-- BuyMeATee Stripe Connect payment domain (ADR-009)
--
-- Tables:
--   1. public.stripe_connected_accounts — one Stripe Connect account per recipient
--   2. public.gifts                     — every Tee (gift) and its payment lifecycle
--   3. public.gift_events               — append-only audit history per gift
--   4. public.gift_refunds              — normalised refunds (supports partial refunds)
--   5. public.gift_disputes             — dispute lifecycle tracking
--   6. public.stripe_webhook_events     — idempotent webhook processing ledger
--   7. public.gift_notifications        — idempotent notification queue boundary
--   8. public.admin_users               — platform administrators (server-checked)
--
-- Security model: every table has RLS enabled. Authoritative financial writes
-- happen ONLY through trusted server code using the service-role key — there
-- are deliberately no insert/update/delete policies for any client role.
-- Amounts are integer minor currency units (pence / cents). Never floats.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.gift_status as enum (
  'draft',
  'checkout_created',
  'processing',
  'paid',
  'payment_failed',
  'expired',
  'partially_refunded',
  'refunded',
  'disputed',
  'dispute_won',
  'dispute_lost',
  'cancelled'
);

create type public.payment_currency as enum ('gbp', 'eur');

-- ---------------------------------------------------------------------------
-- 1. Recipient Connect accounts
-- ---------------------------------------------------------------------------

create table public.stripe_connected_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.profiles (id) on delete cascade,
  stripe_account_id   text not null unique check (stripe_account_id ~ '^acct_[A-Za-z0-9]+$'),
  country             text not null check (country ~ '^[A-Z]{2}$'),
  default_currency    public.payment_currency,
  details_submitted   boolean not null default false,
  charges_enabled     boolean not null default false,
  payouts_enabled     boolean not null default false,
  onboarding_complete boolean not null default false,
  currently_due       text[] not null default '{}',
  eventually_due      text[] not null default '{}',
  disabled_reason     text,
  livemode            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  last_synced_at      timestamptz
);

comment on table public.stripe_connected_accounts is
  'One Stripe Connect account per BuyMeATee user (MVP). Status fields are synchronised from Stripe by server code only.';

create trigger stripe_connected_accounts_set_updated_at
  before update on public.stripe_connected_accounts
  for each row execute function public.set_updated_at();

alter table public.stripe_connected_accounts enable row level security;

-- Owners may read their own account status. Nobody writes from the client.
create policy "Users can view their own connected account"
  on public.stripe_connected_accounts for select
  using ((select auth.uid()) = user_id);

-- Do not let clients enumerate Stripe account ids or requirement lists of
-- other users: column privileges restrict even the owner to safe columns.
revoke all on public.stripe_connected_accounts from anon, authenticated;
grant select (
  id, user_id, country, default_currency, details_submitted, charges_enabled,
  payouts_enabled, onboarding_complete, disabled_reason, livemode,
  created_at, updated_at, last_synced_at
) on public.stripe_connected_accounts to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Gifts
-- ---------------------------------------------------------------------------

create table public.gifts (
  id                              uuid primary key default gen_random_uuid(),
  -- Non-guessable reference used in URLs and guest success lookups.
  public_id                       uuid not null unique default gen_random_uuid(),
  sender_user_id                  uuid references public.profiles (id) on delete set null,
  recipient_user_id               uuid not null references public.profiles (id) on delete restrict,
  recipient_connected_account_id  uuid not null references public.stripe_connected_accounts (id) on delete restrict,
  sender_name                     text not null check (char_length(sender_name) between 1 and 100),
  sender_email                    text check (char_length(sender_email) <= 200),
  message                         text check (char_length(message) <= 280),
  currency                        public.payment_currency not null,
  -- All amounts in integer minor units (pence / cents).
  gift_amount                     integer not null check (gift_amount > 0),
  platform_fee_amount             integer not null check (platform_fee_amount >= 0),
  payment_handling_amount         integer not null check (payment_handling_amount >= 0),
  application_fee_amount          integer not null check (application_fee_amount >= 0),
  total_amount                    integer not null check (total_amount > 0),
  amount_refunded                 integer not null default 0 check (amount_refunded >= 0),
  status                          public.gift_status not null default 'draft',
  is_anonymous                    boolean not null default false,
  fee_model_version               text not null,
  livemode                        boolean not null default false,
  stripe_checkout_session_id      text unique,
  stripe_payment_intent_id        text unique,
  stripe_charge_id                text,
  stripe_application_fee_id       text,
  stripe_transfer_id              text,
  stripe_refund_id                text,
  failure_code                    text,
  failure_message                 text,
  -- Set when a verified Stripe object does not match our stored expectation.
  reconciliation_error            text,
  paid_at                         timestamptz,
  refunded_at                     timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  metadata                        jsonb not null default '{}'::jsonb,
  -- The fee model must always reconcile internally.
  constraint gifts_total_consistent
    check (total_amount = gift_amount + platform_fee_amount + payment_handling_amount),
  constraint gifts_application_fee_consistent
    check (application_fee_amount = platform_fee_amount + payment_handling_amount)
);

comment on table public.gifts is
  'Every Tee (gift). Marked paid ONLY by the verified Stripe webhook — never from the browser or success redirect.';

create index gifts_recipient_idx on public.gifts (recipient_user_id, created_at desc);
create index gifts_sender_idx on public.gifts (sender_user_id) where sender_user_id is not null;
create index gifts_status_idx on public.gifts (status);
create index gifts_reconciliation_idx on public.gifts (created_at)
  where reconciliation_error is not null;

create trigger gifts_set_updated_at
  before update on public.gifts
  for each row execute function public.set_updated_at();

-- Defence in depth: once a gift has been paid, its recipient, destination and
-- amounts are immutable even for privileged code paths.
create or replace function public.prevent_paid_gift_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('paid', 'partially_refunded', 'refunded', 'disputed', 'dispute_won', 'dispute_lost') then
    if new.recipient_user_id is distinct from old.recipient_user_id
       or new.recipient_connected_account_id is distinct from old.recipient_connected_account_id
       or new.gift_amount is distinct from old.gift_amount
       or new.platform_fee_amount is distinct from old.platform_fee_amount
       or new.payment_handling_amount is distinct from old.payment_handling_amount
       or new.application_fee_amount is distinct from old.application_fee_amount
       or new.total_amount is distinct from old.total_amount
       or new.currency is distinct from old.currency then
      raise exception 'Paid gifts are immutable: recipient, destination and amounts cannot change.';
    end if;
  end if;
  return new;
end;
$$;

create trigger gifts_prevent_paid_mutation
  before update on public.gifts
  for each row execute function public.prevent_paid_gift_mutation();

alter table public.gifts enable row level security;

-- Recipients see gifts sent to them once the payment lifecycle has begun
-- (never other people's drafts). Senders see their own gifts. Guests use the
-- server-side status endpoint with the non-guessable public_id instead.
create policy "Recipients can view gifts sent to them"
  on public.gifts for select
  using (
    (select auth.uid()) = recipient_user_id
    and status <> 'draft'
  );

create policy "Senders can view their own gifts"
  on public.gifts for select
  using ((select auth.uid()) = sender_user_id);

-- Column privileges: clients never read donor emails, Stripe identifiers or
-- reconciliation internals directly; dashboards select explicit safe columns.
revoke all on public.gifts from anon, authenticated;
grant select (
  id, public_id, sender_user_id, recipient_user_id, sender_name, message,
  currency, gift_amount, amount_refunded, status, is_anonymous, livemode,
  paid_at, refunded_at, created_at
) on public.gifts to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Gift audit history
-- ---------------------------------------------------------------------------

create table public.gift_events (
  id              bigint generated always as identity primary key,
  gift_id         uuid not null references public.gifts (id) on delete cascade,
  event_type      text not null,
  from_status     public.gift_status,
  to_status       public.gift_status,
  stripe_event_id text,
  detail          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.gift_events is
  'Append-only audit trail per gift: status changes, refunds, disputes, reconciliation errors.';

create index gift_events_gift_idx on public.gift_events (gift_id, created_at);

-- RLS on, no policies: service-role only.
alter table public.gift_events enable row level security;
revoke all on public.gift_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Refunds
-- ---------------------------------------------------------------------------

create table public.gift_refunds (
  id                       uuid primary key default gen_random_uuid(),
  gift_id                  uuid not null references public.gifts (id) on delete restrict,
  stripe_refund_id         text not null unique,
  amount                   integer not null check (amount > 0),
  currency                 public.payment_currency not null,
  status                   text not null default 'pending',
  reason                   text,
  transfer_reversed        boolean not null default false,
  application_fee_refunded boolean not null default false,
  requested_by             uuid references public.profiles (id) on delete set null,
  requested_reason         text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.gift_refunds is
  'Refunds against gifts (full or partial). Written by server code from Stripe API responses and webhooks.';

create index gift_refunds_gift_idx on public.gift_refunds (gift_id);

create trigger gift_refunds_set_updated_at
  before update on public.gift_refunds
  for each row execute function public.set_updated_at();

alter table public.gift_refunds enable row level security;
revoke all on public.gift_refunds from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Disputes
-- ---------------------------------------------------------------------------

create table public.gift_disputes (
  id                uuid primary key default gen_random_uuid(),
  gift_id           uuid not null references public.gifts (id) on delete restrict,
  stripe_dispute_id text not null unique,
  amount            integer not null,
  currency          public.payment_currency not null,
  reason            text,
  status            text not null,
  evidence_due_by   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.gift_disputes is
  'Dispute lifecycle per gift. Destination charges make the platform liable — surfaced in the admin view.';

create index gift_disputes_gift_idx on public.gift_disputes (gift_id);

create trigger gift_disputes_set_updated_at
  before update on public.gift_disputes
  for each row execute function public.set_updated_at();

alter table public.gift_disputes enable row level security;
revoke all on public.gift_disputes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Webhook idempotency ledger
-- ---------------------------------------------------------------------------

create table public.stripe_webhook_events (
  id                bigint generated always as identity primary key,
  stripe_event_id   text not null unique,
  event_type        text not null,
  stripe_account_id text,
  api_version       text,
  livemode          boolean not null,
  status            text not null default 'processing'
                    check (status in ('processing', 'processed', 'failed', 'skipped')),
  attempt_count     integer not null default 1,
  -- Deliberately a filtered summary (object ids, amounts, statuses) — never
  -- the full Stripe payload, which can carry personal data.
  summary           jsonb not null default '{}'::jsonb,
  last_error        text,
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'Idempotent Stripe webhook processing: unique stripe_event_id prevents duplicate handling on retries.';

create index stripe_webhook_events_type_idx on public.stripe_webhook_events (event_type, created_at desc);
create index stripe_webhook_events_failed_idx on public.stripe_webhook_events (created_at)
  where status = 'failed';

create trigger stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row execute function public.set_updated_at();

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Notification queue boundary
-- ---------------------------------------------------------------------------

create table public.gift_notifications (
  id                uuid primary key default gen_random_uuid(),
  gift_id           uuid not null references public.gifts (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  type              text not null default 'gift_received',
  -- Safe display payload: sender display name (respecting anonymity), amount,
  -- currency, message. Never bank/payout details.
  payload           jsonb not null default '{}'::jsonb,
  status            text not null default 'pending'
                    check (status in ('pending', 'sent', 'failed')),
  created_at        timestamptz not null default now(),
  sent_at           timestamptz,
  -- Idempotency: one notification of a given type per gift, however many
  -- times Stripe retries the webhook.
  constraint gift_notifications_once unique (gift_id, type)
);

comment on table public.gift_notifications is
  'Queue boundary for recipient notifications. Delivery is decoupled from webhook processing; duplicates impossible by constraint.';

create index gift_notifications_recipient_idx
  on public.gift_notifications (recipient_user_id, created_at desc);

alter table public.gift_notifications enable row level security;

create policy "Recipients can view their own notifications"
  on public.gift_notifications for select
  using ((select auth.uid()) = recipient_user_id);

revoke all on public.gift_notifications from anon, authenticated;
grant select (id, gift_id, recipient_user_id, type, payload, status, created_at, sent_at)
  on public.gift_notifications to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Platform administrators
-- ---------------------------------------------------------------------------

create table public.admin_users (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Platform administrators. Rows are added manually via SQL/dashboard only; admin routes verify membership server-side with the service role.';

alter table public.admin_users enable row level security;

-- Users may check whether they themselves are an admin; nothing else.
create policy "Users can check their own admin membership"
  on public.admin_users for select
  using ((select auth.uid()) = user_id);

revoke all on public.admin_users from anon, authenticated;
grant select (user_id, created_at) on public.admin_users to authenticated;
