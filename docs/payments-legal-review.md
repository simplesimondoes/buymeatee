# Payments — provisions requiring legal review

> **Status: DRAFT LIST — nothing here is final legal language.** The existing
> `/terms` and `/privacy` pages are marked placeholders pending legal review;
> the items below extend that review to payments. Do not launch live payments
> before counsel has covered them.

## Product-copy rules already enforced in code

- Gifts are called "Tee", "gift" or "support" — never "donation" (no
  charitable framing, no tax-deductibility claims anywhere).
- The full fee breakdown (gift / platform fee / payment handling / total /
  what the recipient receives) is shown before the donor leaves for Stripe.
  No dark patterns: no pre-ticked extras, no hidden fees.
- Payment handling is labelled an estimate of card-processing costs, not
  Stripe's exact charge.
- "Paid" messaging never claims money reached the recipient's bank — payouts
  are Stripe's.

## Documents / sections needing drafting or update

1. **Terms & Conditions**: platform role (BuyMeATee is not a party to the
   gift; Stripe processes payments), recipient eligibility, account
   suspension rights, right to suspend payment functionality.
2. **Payment terms**: fee schedule (5% platform fee + payment handling, added
   on top), currencies (GBP/EUR), minimum/maximum gift amounts, fee-change
   notice policy (fee_model_version supports historic transparency).
3. **Refund policy**: when donors can expect refunds, whether payment
   handling/platform fee are returned (current implementation refunds the
   full charge including fees and reverses the recipient transfer), who
   decides (admin-only MVP).
4. **Dispute & chargeback policy**: platform liability for destination
   charges, when a recipient's transfer may be reversed after a lost dispute
   (currently never automatic — requires this policy to exist first).
5. **Recipient obligations**: accurate identity information to Stripe,
   Stripe Connected Account Agreement acceptance, prohibited use of funds.
6. **Prohibited-use policy**: no gambling stakes, no payment for regulated
   services, no self-dealing/card-testing, etc.
7. **Stripe Connect disclosure**: recipients contract with Stripe for payment
   services; Stripe's privacy handling of KYC data.
8. **Privacy Policy updates**: new data categories (gift records, sender
   name/message, optional donor email, Stripe ids), Stripe as processor/
   controller, retention of financial records, admin access.
9. **Tax-responsibility wording**: recipients are responsible for their own
   tax affairs; BuyMeATee provides no tax advice and gifts are not framed as
   charitable donations.
10. **Age restrictions**: minimum age for recipients (Stripe requires 18 for
    account holders; decide the donor-side statement).
11. **Supported countries and currencies**: GB + euro-area onboarding list,
    GBP/EUR only, subject to change.
12. **Guest donor terms**: guests transact without an account; how their data
    (name, message, receipt email) is used.
