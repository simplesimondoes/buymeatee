-- BuyMeATee merchandise shops — Printful print-on-demand MVP (ADR-024)
--
-- Merchandise is DELIBERATELY separate from contributions/gifts (spec §3):
-- its own products, orders, order items, quotes, ledger, shipments, emails and
-- analytics. A merchandise purchase is NOT a donation; the creator never
-- receives the full retail price. The platform collects the customer payment,
-- retains the Printful production + shipping + tax cost and a merchandise
-- platform fee, and transfers only the creator's PROFIT to their existing
-- Stripe Connect account (separate charges + transfers, not the gift
-- destination-charge model).
--
-- Security model (mirrors ADR-009/011/018):
--  * All money is integer minor units. Never floats.
--  * Financial + fulfilment state (orders, items, quotes, ledger, shipments,
--    events, Printful/Stripe ids, transfer/refund state) is SERVICE-ROLE ONLY.
--    Clients — including a product's own creator — can never write it; those
--    surfaces are served by trusted server code projecting only safe columns.
--  * A creator owns their shop settings, artwork and product LISTING fields
--    (title/price/colours…) via RLS + narrow column grants; moderation,
--    pricing estimates, mockup status and Printful ids on a product are
--    service-role only.
--  * The whole feature ships behind disabled feature flags (see lib/merch).

-- ===========================================================================
-- Enums
-- ===========================================================================

create type public.merch_shop_status as enum ('draft', 'open', 'paused', 'closed');

create type public.merch_product_status as enum (
  'draft', 'awaiting_approval', 'changes_requested',
  'approved', 'published', 'paused', 'archived'
);

create type public.merch_mockup_status as enum (
  'none', 'processing', 'ready', 'failed'
);

create type public.merch_moderation_status as enum (
  'pending', 'approved', 'changes_requested', 'rejected'
);

create type public.merch_order_status as enum (
  'draft', 'awaiting_payment', 'payment_processing', 'paid',
  'printful_submission_pending', 'printful_draft_created', 'printful_confirmed',
  'in_production', 'partially_shipped', 'shipped', 'delivered',
  'on_hold', 'failed', 'cancelled',
  'refund_pending', 'partially_refunded', 'refunded', 'disputed'
);

create type public.merch_payment_status as enum (
  'pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded', 'disputed'
);

create type public.merch_fulfilment_status as enum (
  'not_submitted', 'submitted', 'confirmed', 'in_production',
  'partially_shipped', 'shipped', 'delivered', 'cancelled', 'on_hold', 'failed'
);

create type public.merch_transfer_status as enum (
  'none', 'pending', 'transferred', 'transfer_failed', 'reversed', 'held'
);

create type public.merch_refund_status as enum (
  'none', 'refund_pending', 'partially_refunded', 'refunded'
);

create type public.merch_ledger_type as enum (
  'customer_payment', 'printful_reserve', 'platform_fee', 'creator_earning',
  'creator_transfer', 'creator_transfer_reversal', 'customer_refund',
  'chargeback', 'manual_adjustment'
);

create type public.merch_event_source as enum (
  'system', 'stripe', 'printful', 'admin', 'creator', 'customer'
);

-- ===========================================================================
-- 1. merch_shop_settings — per-creator shop configuration
-- ===========================================================================

create table public.merch_shop_settings (
  creator_id        uuid primary key references public.profiles (id) on delete cascade,
  shop_title        text check (char_length(shop_title) <= 120),
  shop_description  text check (char_length(shop_description) <= 1000),
  shop_status       public.merch_shop_status not null default 'draft',
  default_currency  public.payment_currency,
  terms_accepted_at timestamptz,
  terms_version     text check (char_length(terms_version) <= 40),
  -- Admin-controlled beta gate. No client grant exists: a creator cannot grant
  -- themselves beta access. Read via server code / RLS below.
  beta_access       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.merch_shop_settings is
  'Per-creator merchandise shop settings. beta_access is admin-controlled (no client grant).';

create trigger merch_shop_settings_set_updated_at
  before update on public.merch_shop_settings
  for each row execute function public.set_updated_at();

alter table public.merch_shop_settings enable row level security;

create policy "Creators can view their own shop settings"
  on public.merch_shop_settings for select
  using ((select auth.uid()) = creator_id);

create policy "Creators can insert their own shop settings"
  on public.merch_shop_settings for insert
  with check ((select auth.uid()) = creator_id);

create policy "Creators can update their own shop settings"
  on public.merch_shop_settings for update
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

revoke all on public.merch_shop_settings from anon, authenticated;
grant select on public.merch_shop_settings to authenticated;
-- beta_access deliberately absent from write grants (admin/service-role only).
grant insert (creator_id, shop_title, shop_description, shop_status, default_currency, terms_accepted_at, terms_version)
  on public.merch_shop_settings to authenticated;
grant update (shop_title, shop_description, shop_status, default_currency, terms_accepted_at, terms_version)
  on public.merch_shop_settings to authenticated;

-- ===========================================================================
-- 2. merch_curated_products — admin-managed Printful catalogue (spec §6)
-- ===========================================================================
-- Printful IDs are EXTERNAL references (integer), never local primary keys.

create table public.merch_curated_products (
  id                          uuid primary key default gen_random_uuid(),
  printful_catalog_product_id integer not null,
  slug                        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name                text not null check (char_length(display_name) between 1 and 120),
  description                 text check (char_length(description) <= 2000),
  category                    text check (char_length(category) <= 60),
  enabled                     boolean not null default false,
  featured                    boolean not null default false,
  sort_order                  integer not null default 0,
  -- Curated allow-lists. Printful variant ids are integers; colours/sizes/
  -- placements are Printful's string identifiers.
  allowed_variant_ids         integer[] not null default '{}',
  allowed_colours             text[] not null default '{}',
  allowed_sizes               text[] not null default '{}',
  allowed_placements          text[] not null default '{}',
  default_placement           text,
  supported_regions           text[] not null default '{}',
  -- Reference-currency guidance for pricing. The real per-creator margin gate
  -- lives in lib/merch/pricing.ts using the creator's own currency.
  currency                    public.payment_currency not null,
  minimum_retail_price_minor  integer not null default 0 check (minimum_retail_price_minor >= 0),
  minimum_creator_profit_minor integer not null default 0 check (minimum_creator_profit_minor >= 0),
  internal_notes              text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (printful_catalog_product_id)
);

comment on table public.merch_curated_products is
  'Admin-curated subset of the Printful catalogue creators may choose from. Write is service-role only.';

create index merch_curated_products_enabled_idx
  on public.merch_curated_products (enabled, featured, sort_order);

create trigger merch_curated_products_set_updated_at
  before update on public.merch_curated_products
  for each row execute function public.set_updated_at();

alter table public.merch_curated_products enable row level security;

-- Anyone may read ENABLED curated products (needed by the wizard + public shop).
-- Disabled entries and internal_notes are only reachable via the service role.
create policy "Enabled curated products are viewable by everyone"
  on public.merch_curated_products for select
  using (enabled = true);

revoke all on public.merch_curated_products from anon, authenticated;
-- Column-level select: internal_notes is withheld from clients.
grant select (
  id, printful_catalog_product_id, slug, display_name, description, category,
  enabled, featured, sort_order, allowed_variant_ids, allowed_colours,
  allowed_sizes, allowed_placements, default_placement, supported_regions,
  currency, minimum_retail_price_minor, minimum_creator_profit_minor,
  created_at, updated_at
) on public.merch_curated_products to anon, authenticated;

-- ===========================================================================
-- 3. merch_artwork_files — uploaded artwork + rights confirmation (spec §7)
-- ===========================================================================

create table public.merch_artwork_files (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references public.profiles (id) on delete cascade,
  storage_path   text not null check (char_length(storage_path) <= 500),
  checksum       text not null check (char_length(checksum) <= 128),
  mime_type      text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  byte_size      integer not null check (byte_size > 0),
  width          integer check (width > 0),
  height         integer check (height > 0),
  -- The creator's rights confirmation, recorded for the audit trail (spec §7).
  rights_confirmed boolean not null default false,
  terms_version  text check (char_length(terms_version) <= 40),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.merch_artwork_files is
  'Creator-uploaded artwork with the rights confirmation captured at upload (spec §7).';

create index merch_artwork_files_creator_idx
  on public.merch_artwork_files (creator_id, created_at);

create trigger merch_artwork_files_set_updated_at
  before update on public.merch_artwork_files
  for each row execute function public.set_updated_at();

alter table public.merch_artwork_files enable row level security;

create policy "Creators can view their own artwork"
  on public.merch_artwork_files for select
  using ((select auth.uid()) = creator_id);

create policy "Creators can insert their own artwork"
  on public.merch_artwork_files for insert
  with check ((select auth.uid()) = creator_id);

create policy "Creators can delete their own artwork"
  on public.merch_artwork_files for delete
  using ((select auth.uid()) = creator_id);

revoke all on public.merch_artwork_files from anon, authenticated;
grant select on public.merch_artwork_files to authenticated;
grant insert (creator_id, storage_path, checksum, mime_type, byte_size, width, height, rights_confirmed, terms_version)
  on public.merch_artwork_files to authenticated;
grant delete on public.merch_artwork_files to authenticated;

-- ===========================================================================
-- 4. merch_products — creator merchandise products (spec §10)
-- ===========================================================================

create table public.merch_products (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references public.profiles (id) on delete cascade,
  curated_product_id  uuid not null references public.merch_curated_products (id) on delete restrict,
  title               text not null check (char_length(title) between 1 and 120),
  slug                text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description         text check (char_length(description) <= 2000),
  status              public.merch_product_status not null default 'draft',
  -- Artwork + placement.
  artwork_file_id     uuid references public.merch_artwork_files (id) on delete set null,
  artwork_checksum    text,
  placement           text,
  placement_configuration jsonb not null default '{}'::jsonb,
  -- Curated selections (Printful variant ids + Printful colour/size strings).
  selected_variant_ids integer[] not null default '{}',
  selected_colours    text[] not null default '{}',
  selected_sizes      text[] not null default '{}',
  -- Pricing. retail_price_minor is creator-set; the estimates are computed
  -- server-side from Printful costs (service-role only).
  currency            public.payment_currency not null,
  retail_price_minor  integer not null default 0 check (retail_price_minor >= 0),
  estimated_printful_cost_minor  integer check (estimated_printful_cost_minor >= 0),
  estimated_platform_fee_minor   integer check (estimated_platform_fee_minor >= 0),
  estimated_creator_profit_minor integer check (estimated_creator_profit_minor >= 0),
  -- Mockup + moderation state (service-role only).
  mockup_status       public.merch_mockup_status not null default 'none',
  printful_mockup_task_id text,
  moderation_status   public.merch_moderation_status not null default 'pending',
  moderation_notes    text,
  submitted_for_review_at timestamptz,
  approved_at         timestamptz,
  approved_by         uuid references public.profiles (id) on delete set null,
  published_at        timestamptz,
  paused_at           timestamptz,
  -- Bumped on every material listing change so order snapshots stay immutable.
  version             integer not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (creator_id, slug)
);

comment on table public.merch_products is
  'Creator merchandise products. Listing fields are creator-writable; status, moderation, pricing estimates, mockup + Printful ids are service-role only.';
comment on column public.merch_products.estimated_creator_profit_minor is
  'Server-computed estimate from lib/merch/pricing.ts. Labelled an estimate in the UI; the paid order snapshot is authoritative.';

create index merch_products_creator_idx
  on public.merch_products (creator_id, status, created_at);
create index merch_products_published_idx
  on public.merch_products (creator_id, published_at)
  where status = 'published';
create index merch_products_moderation_idx
  on public.merch_products (moderation_status, submitted_for_review_at)
  where moderation_status = 'pending';

create trigger merch_products_set_updated_at
  before update on public.merch_products
  for each row execute function public.set_updated_at();

alter table public.merch_products enable row level security;

-- Published products are world-readable (the public shop). Creators see all of
-- their own products in every state.
create policy "Published products are viewable by everyone"
  on public.merch_products for select
  using (status = 'published');

create policy "Creators can view all their own products"
  on public.merch_products for select
  using ((select auth.uid()) = creator_id);

create policy "Creators can insert their own products"
  on public.merch_products for insert
  with check ((select auth.uid()) = creator_id);

create policy "Creators can update their own products"
  on public.merch_products for update
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

create policy "Creators can delete their own draft products"
  on public.merch_products for delete
  using ((select auth.uid()) = creator_id and status = 'draft');

revoke all on public.merch_products from anon, authenticated;
grant select on public.merch_products to anon, authenticated;
-- Creators write only listing fields. status is granted so a creator can move a
-- draft to 'awaiting_approval' / pause / archive from the UI; the server
-- validates every transition (it cannot be used to self-approve or self-publish
-- because moderation_status/published_at have no grant). Pricing estimates,
-- moderation, mockup and Printful columns are service-role only.
grant insert (
  creator_id, curated_product_id, title, slug, description, status,
  artwork_file_id, artwork_checksum, placement, placement_configuration,
  selected_variant_ids, selected_colours, selected_sizes, currency, retail_price_minor
) on public.merch_products to authenticated;
grant update (
  title, slug, description, status, artwork_file_id, artwork_checksum,
  placement, placement_configuration, selected_variant_ids, selected_colours,
  selected_sizes, currency, retail_price_minor
) on public.merch_products to authenticated;
grant delete on public.merch_products to authenticated;

-- ===========================================================================
-- 5. printful_mockup_tasks — async mockup generation tracking (spec §9)
-- ===========================================================================

create table public.printful_mockup_tasks (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.merch_products (id) on delete cascade,
  creator_id        uuid not null references public.profiles (id) on delete cascade,
  -- Printful's task key. Unique so a duplicate completion event is idempotent
  -- and a single product can't have two in-flight tasks for the same request.
  printful_task_key text not null unique,
  status            public.merch_mockup_status not null default 'processing',
  request_snapshot  jsonb not null default '{}'::jsonb,
  result            jsonb,
  last_error        text,
  attempts          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.printful_mockup_tasks is
  'Tracks async Printful mockup generation tasks. Service-role only.';

create index printful_mockup_tasks_product_idx
  on public.printful_mockup_tasks (product_id, created_at);
-- At most one in-flight (processing) mockup task per product (spec §9).
create unique index printful_mockup_tasks_one_inflight_idx
  on public.printful_mockup_tasks (product_id)
  where status = 'processing';

create trigger printful_mockup_tasks_set_updated_at
  before update on public.printful_mockup_tasks
  for each row execute function public.set_updated_at();

alter table public.printful_mockup_tasks enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 6. merch_checkout_quotes — immutable priced quotes (spec §16)
-- ===========================================================================

create table public.merch_checkout_quotes (
  id                        uuid primary key default gen_random_uuid(),
  creator_id                uuid not null references public.profiles (id) on delete restrict,
  product_configuration_checksum text not null,
  destination_country       text check (destination_country ~ '^[A-Z]{2}$'),
  destination_postcode      text check (char_length(destination_postcode) <= 32),
  currency                  public.payment_currency not null,
  merchandise_subtotal_minor integer not null check (merchandise_subtotal_minor >= 0),
  shipping_minor            integer not null default 0 check (shipping_minor >= 0),
  tax_minor                 integer not null default 0 check (tax_minor >= 0),
  customer_total_minor      integer not null check (customer_total_minor >= 0),
  printful_cost_snapshot    jsonb not null default '{}'::jsonb,
  pricing_snapshot          jsonb not null default '{}'::jsonb,
  printful_shipping_method  text,
  created_at                timestamptz not null default now(),
  expires_at                timestamptz not null,
  constraint merch_quote_total_consistent
    check (customer_total_minor = merchandise_subtotal_minor + shipping_minor + tax_minor)
);

comment on table public.merch_checkout_quotes is
  'Immutable checkout quotes. Never charge an amount different from the accepted quote. Service-role only.';

create index merch_checkout_quotes_creator_idx
  on public.merch_checkout_quotes (creator_id, created_at);

alter table public.merch_checkout_quotes enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 7. merch_orders — merchandise orders (spec §18), fully service-role only
-- ===========================================================================

create table public.merch_orders (
  id                    uuid primary key default gen_random_uuid(),
  public_reference      text not null unique check (char_length(public_reference) between 6 and 40),
  creator_id            uuid not null references public.profiles (id) on delete restrict,
  buyer_user_id         uuid references public.profiles (id) on delete set null,
  buyer_email           text,
  currency              public.payment_currency not null,

  status                public.merch_order_status not null default 'draft',
  payment_status        public.merch_payment_status not null default 'pending',
  fulfilment_status     public.merch_fulfilment_status not null default 'not_submitted',
  transfer_status       public.merch_transfer_status not null default 'none',
  refund_status         public.merch_refund_status not null default 'none',

  -- Customer-facing money.
  merchandise_subtotal_minor integer not null check (merchandise_subtotal_minor >= 0),
  shipping_charged_minor integer not null default 0 check (shipping_charged_minor >= 0),
  tax_charged_minor     integer not null default 0 check (tax_charged_minor >= 0),
  customer_total_minor  integer not null check (customer_total_minor >= 0),

  -- Platform-facing Printful cost (never shown to customers).
  printful_product_cost_minor  integer not null default 0 check (printful_product_cost_minor >= 0),
  printful_shipping_cost_minor integer not null default 0 check (printful_shipping_cost_minor >= 0),
  printful_tax_cost_minor      integer not null default 0 check (printful_tax_cost_minor >= 0),
  printful_total_cost_minor    integer not null default 0 check (printful_total_cost_minor >= 0),

  -- The margin split.
  platform_fee_minor    integer not null default 0 check (platform_fee_minor >= 0),
  creator_profit_minor  integer not null default 0 check (creator_profit_minor >= 0),
  creator_profit_released_minor integer not null default 0 check (creator_profit_released_minor >= 0),

  pricing_version       text not null,
  quote_id              uuid references public.merch_checkout_quotes (id) on delete set null,
  quote_snapshot        jsonb not null default '{}'::jsonb,
  shipping_address_snapshot jsonb,
  customer_details_snapshot jsonb,

  -- Stripe (separate charges + transfers model).
  stripe_payment_intent_id text unique,
  stripe_charge_id      text,
  stripe_balance_transaction_id text,
  stripe_transfer_group text,
  stripe_transfer_id    text unique,
  stripe_refund_id      text,
  stripe_dispute_id     text,
  livemode              boolean not null default false,

  -- Printful.
  printful_order_id     text unique,
  printful_external_order_id text,
  printful_status       text,
  printful_response_snapshot jsonb,

  -- Reconciliation / attention flag.
  reconciliation_error  text,

  placed_at             timestamptz,
  paid_at               timestamptz,
  submitted_to_printful_at timestamptz,
  accepted_by_printful_at timestamptz,
  first_shipped_at      timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  refunded_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Creator profit can never exceed the recorded profit; released can never
  -- exceed the profit. Belt-and-braces against double transfers.
  constraint merch_orders_released_within_profit
    check (creator_profit_released_minor <= creator_profit_minor)
);

comment on table public.merch_orders is
  'Merchandise orders (spec §18). Service-role only. Creator/customer views are projected by trusted server code. Creator profit is transferred separately and only up to creator_profit_minor.';
comment on column public.merch_orders.creator_profit_minor is
  'The ONLY amount ever transferred to the creator. Shipping and tax are never creator earnings.';

create index merch_orders_creator_idx
  on public.merch_orders (creator_id, created_at);
create index merch_orders_buyer_idx
  on public.merch_orders (buyer_user_id, created_at) where buyer_user_id is not null;
create index merch_orders_status_idx
  on public.merch_orders (status, created_at);
create index merch_orders_transfer_pending_idx
  on public.merch_orders (transfer_status)
  where transfer_status in ('pending', 'transfer_failed');

create trigger merch_orders_set_updated_at
  before update on public.merch_orders
  for each row execute function public.set_updated_at();

alter table public.merch_orders enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 8. merch_order_items — immutable per-line snapshots (spec §18)
-- ===========================================================================

create table public.merch_order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.merch_orders (id) on delete cascade,
  creator_product_id    uuid references public.merch_products (id) on delete set null,
  creator_product_version integer,
  title                 text not null,
  description           text,
  quantity              integer not null check (quantity > 0),
  unit_price_minor      integer not null check (unit_price_minor >= 0),
  variant_id            integer,
  variant_name          text,
  size                  text,
  colour                text,
  artwork_snapshot      jsonb,
  placement_snapshot    jsonb,
  mockup_snapshot       jsonb,
  printful_catalog_product_id integer,
  printful_catalog_variant_id integer,
  printful_item_snapshot jsonb,
  created_at            timestamptz not null default now()
);

comment on table public.merch_order_items is
  'Immutable product snapshots for historical orders. Editing a live product never alters these. Service-role only.';

create index merch_order_items_order_idx
  on public.merch_order_items (order_id);

alter table public.merch_order_items enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 9. merch_shipments — Printful shipments / tracking (spec §18)
-- ===========================================================================

create table public.merch_shipments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.merch_orders (id) on delete cascade,
  printful_shipment_id  text,
  carrier               text,
  service               text,
  tracking_number       text,
  tracking_url          text,
  ship_date             date,
  estimated_delivery_from date,
  estimated_delivery_to date,
  delivered_at          timestamptz,
  raw_snapshot          jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- A given Printful shipment appears once per order (idempotent webhooks).
  unique (order_id, printful_shipment_id)
);

comment on table public.merch_shipments is
  'Printful shipments + tracking. Service-role only. Split shipments = multiple rows.';

create index merch_shipments_order_idx
  on public.merch_shipments (order_id, created_at);

create trigger merch_shipments_set_updated_at
  before update on public.merch_shipments
  for each row execute function public.set_updated_at();

alter table public.merch_shipments enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 10. merch_ledger_entries — financial ledger (spec §18)
-- ===========================================================================

create table public.merch_ledger_entries (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.merch_orders (id) on delete cascade,
  creator_id      uuid not null references public.profiles (id) on delete restrict,
  type            public.merch_ledger_type not null,
  -- Signed minor units (a refund/reversal is negative). Not constrained > 0.
  amount_minor    integer not null,
  currency        public.payment_currency not null,
  status          text not null default 'recorded' check (char_length(status) <= 40),
  stripe_object_id text,
  description     text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.merch_ledger_entries is
  'Double-entry-style financial ledger for merchandise. Service-role only.';

create index merch_ledger_entries_order_idx
  on public.merch_ledger_entries (order_id, created_at);
create index merch_ledger_entries_creator_idx
  on public.merch_ledger_entries (creator_id, type, created_at);
-- A creator transfer for an order happens at most once (double-transfer guard).
create unique index merch_ledger_one_transfer_per_order_idx
  on public.merch_ledger_entries (order_id)
  where type = 'creator_transfer';

create trigger merch_ledger_entries_set_updated_at
  before update on public.merch_ledger_entries
  for each row execute function public.set_updated_at();

alter table public.merch_ledger_entries enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 11. merch_order_events — order state history (spec §19)
-- ===========================================================================

create table public.merch_order_events (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.merch_orders (id) on delete cascade,
  event_type        text not null,
  source            public.merch_event_source not null default 'system',
  previous_status   public.merch_order_status,
  new_status        public.merch_order_status,
  -- The external event id (Stripe/Printful) so replays are idempotent per source.
  external_event_id text,
  message           text,
  payload           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

comment on table public.merch_order_events is
  'Append-only order event timeline (spec §19). Service-role only.';

create index merch_order_events_order_idx
  on public.merch_order_events (order_id, created_at);
-- De-dupe external events per order + source (idempotent webhook processing).
create unique index merch_order_events_external_idx
  on public.merch_order_events (order_id, source, external_event_id)
  where external_event_id is not null;

alter table public.merch_order_events enable row level security; -- no policies: service-role only

-- ===========================================================================
-- 12. printful_webhook_events — Printful webhook idempotency ledger (spec §21)
-- ===========================================================================
-- Mirrors public.stripe_webhook_events. Printful does not always supply a
-- signed event id, so external_event_id is a stable hash the handler computes.

create table public.printful_webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  provider            text not null default 'printful',
  external_event_id   text not null,
  event_type          text not null,
  payload             jsonb not null default '{}'::jsonb,
  processing_status   text not null default 'processing'
                        check (processing_status in ('processing', 'processed', 'failed', 'skipped')),
  processing_attempts integer not null default 1,
  last_error          text,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  unique (provider, external_event_id)
);

comment on table public.printful_webhook_events is
  'Printful webhook idempotency ledger (spec §21). Service-role only.';

create index printful_webhook_events_status_idx
  on public.printful_webhook_events (processing_status, received_at);

alter table public.printful_webhook_events enable row level security; -- no policies: service-role only
