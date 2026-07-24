-- Add multi-currency payout support to the payment domain (ADR-017)
--
-- Expands the payout countries a creator can onboard from (English + EU core,
-- Switzerland + Nordics) beyond the original GBP/EUR MVP. A creator's country
-- fixes their Stripe settlement currency, so each new country needs its
-- settlement currency added to the public.payment_currency enum.
--
-- Only 2-decimal currencies are added here. Zero-decimal currencies (JPY/KRW,
-- for Japan/Korea) are deferred until the app's minor-unit formatting handles
-- a per-currency decimal exponent.
--
-- ALTER TYPE ... ADD VALUE is additive and irreversible (Postgres has no
-- DROP VALUE); IF NOT EXISTS keeps this migration idempotent.

alter type public.payment_currency add value if not exists 'usd';
alter type public.payment_currency add value if not exists 'cad';
alter type public.payment_currency add value if not exists 'aud';
alter type public.payment_currency add value if not exists 'nzd';
alter type public.payment_currency add value if not exists 'chf';
alter type public.payment_currency add value if not exists 'sek';
alter type public.payment_currency add value if not exists 'nok';
alter type public.payment_currency add value if not exists 'dkk';
