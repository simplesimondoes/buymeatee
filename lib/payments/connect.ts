import "server-only";

import type Stripe from "stripe";

import {
  defaultCurrencyForCountry,
  getAllowedConnectCountries,
  getStripeUrls,
} from "@/lib/payments/config";
import { isSupportedCurrency } from "@/lib/payments/currency";
import { logPaymentEvent } from "@/lib/payments/log";
import type { ConnectedAccountRow } from "@/lib/payments/types";
import { getStripeClient, isLivemode } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe Connect account service (ADR-009).
 *
 * Connected accounts use the controller model with Stripe-hosted onboarding:
 * Stripe collects requirements, runs identity verification / KYC and manages
 * bank details. The platform pays Stripe fees and owns losses, matching the
 * destination-charge + application-fee model. Only the `transfers` capability
 * is requested — the minimum needed to receive destination charges and be
 * paid out.
 */

export async function getConnectedAccountForUser(
  userId: string,
): Promise<ConnectedAccountRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load connected account: ${error.message}`);
  }
  return (data as ConnectedAccountRow | null) ?? null;
}

export async function getConnectedAccountById(
  id: string,
): Promise<ConnectedAccountRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load connected account: ${error.message}`);
  }
  return (data as ConnectedAccountRow | null) ?? null;
}

export async function getOrCreateConnectedAccount(
  userId: string,
  email: string | undefined,
  country: string,
): Promise<ConnectedAccountRow> {
  const existing = await getConnectedAccountForUser(userId);
  if (existing) {
    return existing;
  }

  const allowed = getAllowedConnectCountries();
  if (!allowed.includes(country)) {
    throw new Error(`Country ${country} is not currently supported.`);
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.create(
    {
      controller: {
        fees: { payer: "application" },
        losses: { payments: "application" },
        stripe_dashboard: { type: "express" },
        requirement_collection: "stripe",
      },
      country,
      email,
      capabilities: { transfers: { requested: true } },
      metadata: { buymeatee_user_id: userId },
    },
    // One account per user: retries of the same creation are deduplicated.
    { idempotencyKey: `bmat-account-create-${userId}` },
  );

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .insert({
      user_id: userId,
      stripe_account_id: account.id,
      country,
      default_currency: defaultCurrencyForCountry(country),
      livemode: isLivemode(),
    })
    .select("*")
    .single();
  if (error) {
    // A concurrent request may have inserted first (unique user_id): reuse it.
    const raced = await getConnectedAccountForUser(userId);
    if (raced) {
      return raced;
    }
    throw new Error(`Failed to store connected account: ${error.message}`);
  }

  logPaymentEvent("info", "connect.account_created", {
    user_id: userId,
    stripe_account_id: account.id,
    country,
    livemode: isLivemode(),
  });
  return data as ConnectedAccountRow;
}

/** Single-use Stripe-hosted onboarding link. */
export async function createOnboardingLink(
  account: ConnectedAccountRow,
): Promise<string> {
  const stripe = getStripeClient();
  const urls = getStripeUrls();
  const link = await stripe.accountLinks.create({
    account: account.stripe_account_id,
    refresh_url: urls.connectRefreshUrl,
    return_url: urls.connectReturnUrl,
    type: "account_onboarding",
  });
  logPaymentEvent("info", "connect.onboarding_link_created", {
    user_id: account.user_id,
    stripe_account_id: account.stripe_account_id,
  });
  return link.url;
}

/** Stripe-hosted (Express) dashboard login link for the account owner. */
export async function createDashboardLoginLink(
  account: ConnectedAccountRow,
): Promise<string> {
  const stripe = getStripeClient();
  const link = await stripe.accounts.createLoginLink(
    account.stripe_account_id,
  );
  return link.url;
}

/**
 * Pull the authoritative account state from Stripe and persist it. Called on
 * return from onboarding, on account.updated webhooks and by reconciliation.
 * Never trust "the user came back from Stripe" as a completion signal.
 */
export async function syncConnectedAccount(
  stripeAccountId: string,
  prefetched?: Stripe.Account,
): Promise<ConnectedAccountRow | null> {
  const stripe = getStripeClient();
  const account =
    prefetched ?? (await stripe.accounts.retrieve(stripeAccountId));

  const requirements = account.requirements;
  const defaultCurrency = isSupportedCurrency(account.default_currency)
    ? account.default_currency
    : null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .update({
      details_submitted: account.details_submitted ?? false,
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      onboarding_complete: account.details_submitted ?? false,
      currently_due: requirements?.currently_due ?? [],
      eventually_due: requirements?.eventually_due ?? [],
      disabled_reason: requirements?.disabled_reason ?? null,
      ...(defaultCurrency ? { default_currency: defaultCurrency } : {}),
      last_synced_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to sync connected account: ${error.message}`);
  }
  if (!data) {
    // Event for an account we do not know — worth an operational look.
    logPaymentEvent("warn", "connect.sync_unknown_account", {
      stripe_account_id: stripeAccountId,
    });
    return null;
  }

  logPaymentEvent("info", "connect.account_synced", {
    stripe_account_id: stripeAccountId,
    details_submitted: account.details_submitted ?? false,
    charges_enabled: account.charges_enabled ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
  });
  return data as ConnectedAccountRow;
}
