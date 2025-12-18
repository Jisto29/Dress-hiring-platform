-- ==============================================================================
-- FITSERA RENTAL MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- PostgreSQL / Supabase Compatible
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- for text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- for exclusion constraints
CREATE EXTENSION IF NOT EXISTS "citext";       -- case-insensitive text

-- ==============================================================================
-- 1) ENUM TYPES
-- ==============================================================================

-- Roles & statuses
CREATE TYPE user_role AS ENUM ('owner','admin','staff');
CREATE TYPE item_condition AS ENUM ('new','like_new','good','fair','retired');
CREATE TYPE rental_status AS ENUM ('draft','pending_payment','paid','fulfillment','in_transit','with_customer','return_in_transit','returned','completed','canceled','refunded','disputed');
CREATE TYPE payment_status AS ENUM ('requires_payment','paid','failed','refunded','partially_refunded','disputed');
CREATE TYPE line_status AS ENUM ('reserved','picked','shipped','with_customer','return_shipped','checked_in','lost','damaged','canceled');
CREATE TYPE address_type AS ENUM ('shipping','return','billing');
CREATE TYPE media_kind AS ENUM ('image','video');
CREATE TYPE discount_type AS ENUM ('percent','fixed');

-- ==============================================================================
-- 2) TENANCY & AUTH
-- ==============================================================================

-- Brand/Tenant accounts
CREATE TABLE accounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text UNIQUE NOT NULL,
  brand_logo   text,                          -- URL to logo
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Brand staff users (admins)
CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email        citext UNIQUE NOT NULL,
  password     text NOT NULL,                 -- hashed password
  full_name    text,
  role         user_role NOT NULL DEFAULT 'staff',
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_account ON users(account_id);
CREATE INDEX users_email ON users(email);

-- Customer/renters (public users who rent items)
CREATE TABLE customers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        citext UNIQUE NOT NULL,
  password     text NOT NULL,                 -- hashed password
  full_name    text,
  phone        text,
  mobile       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_email_trgm ON customers USING gin (email gin_trgm_ops);

-- ==============================================================================
-- 3) CATALOG & INVENTORY
-- ==============================================================================

-- Products (models/designs)
CREATE TABLE products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  category     text,                          -- e.g., "gowns", "dresses", "cocktail"
  occasion     text,                          -- e.g., "wedding", "formal", "casual"
  tags         text[] DEFAULT '{}',
  available    boolean NOT NULL DEFAULT true,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_account ON products(account_id);
CREATE INDEX products_category ON products(category);
CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX products_tags_gin ON products USING gin (tags);
CREATE INDEX products_desc_trgm ON products USING gin (description gin_trgm_ops);

-- Product variants (size/color combinations)
CREATE TABLE product_variants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label   text NOT NULL,                -- e.g., "XS","S","M","L","8","10"
  color        text,
  sku          text UNIQUE,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product ON product_variants(product_id);
CREATE INDEX product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;

-- Physical inventory items (actual trackable units)
CREATE TABLE inventory_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  serial_code     text UNIQUE,               -- physical id/tag (e.g., "DRESS-A-102")
  condition       item_condition NOT NULL DEFAULT 'like_new',
  purchase_price  numeric(10,2),
  stock           int NOT NULL DEFAULT 1,    -- for backward compatibility
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_items_product ON inventory_items(product_id);
CREATE INDEX inventory_items_account ON inventory_items(account_id);
CREATE INDEX inventory_items_variant ON inventory_items(variant_id);
CREATE INDEX inventory_items_serial ON inventory_items(serial_code) WHERE serial_code IS NOT NULL;

-- Media assets (images/videos)
CREATE TABLE media_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id   uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  item_id      uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  kind         media_kind NOT NULL DEFAULT 'image',
  storage_url  text NOT NULL,                -- URL to cloud storage
  alt_text     text,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_assets_product ON media_assets(product_id);
CREATE INDEX media_assets_variant ON media_assets(variant_id);
CREATE INDEX media_assets_item ON media_assets(item_id);

-- ==============================================================================
-- 4) PRICING & PROMOTIONS
-- ==============================================================================

-- Pricing rules (per product/variant)
CREATE TABLE pricing_rules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id          uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id          uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  base_price_per_day  numeric(10,2) NOT NULL,
  weekend_multiplier  numeric(5,2) DEFAULT 1.0,
  peak_multiplier     numeric(5,2) DEFAULT 1.0,
  security_deposit    numeric(10,2) DEFAULT 0,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pricing_rules_product ON pricing_rules(product_id);
CREATE INDEX pricing_rules_variant ON pricing_rules(variant_id);

-- Coupons/discount codes
CREATE TABLE coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  code            text UNIQUE NOT NULL,
  discount_kind   discount_type NOT NULL,
  discount_value  numeric(10,2) NOT NULL,    -- percent or fixed amount
  min_order_total numeric(10,2),
  starts_at       timestamptz,
  ends_at         timestamptz,
  max_uses        int,
  used_count      int NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coupons_code ON coupons(code);

-- ==============================================================================
-- 5) ADDRESSES (REUSABLE)
-- ==============================================================================

CREATE TABLE addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind  text NOT NULL CHECK (owner_kind IN ('customer','account')),
  owner_id    uuid NOT NULL,
  type        address_type NOT NULL,
  line1       text NOT NULL,
  line2       text,
  city        text NOT NULL,
  state       text,
  postal_code text NOT NULL,
  country     text NOT NULL DEFAULT 'AU',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_owner ON addresses(owner_kind, owner_id);

-- ==============================================================================
-- 6) RENTALS (ORDERS) & RENTAL LINES
-- ==============================================================================

-- Rental header (order)
CREATE TABLE rentals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status          rental_status NOT NULL DEFAULT 'draft',
  subtotal        numeric(10,2) NOT NULL DEFAULT 0,
  discount_total  numeric(10,2) NOT NULL DEFAULT 0,
  deposit_total   numeric(10,2) NOT NULL DEFAULT 0,
  shipping_total  numeric(10,2) NOT NULL DEFAULT 0,
  tax_total       numeric(10,2) NOT NULL DEFAULT 0,
  grand_total     numeric(10,2) NOT NULL DEFAULT 0,
  coupon_id       uuid REFERENCES coupons(id),
  placed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rentals_account ON rentals(account_id);
CREATE INDEX rentals_customer ON rentals(customer_id);
CREATE INDEX rentals_status ON rentals(status);

-- Rental lines (one physical item per line)
CREATE TABLE rental_lines (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id          uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  item_id            uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  status             line_status NOT NULL DEFAULT 'reserved',
  unit_price_per_day numeric(10,2) NOT NULL,
  days               int NOT NULL,
  line_total         numeric(10,2) NOT NULL,
  deposit_amount     numeric(10,2) NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rental_lines_rental ON rental_lines(rental_id);
CREATE INDEX rental_lines_item ON rental_lines(item_id);

-- Rental windows (date ranges per line) - PREVENTS DOUBLE BOOKING
CREATE TABLE rental_windows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_line_id uuid NOT NULL REFERENCES rental_lines(id) ON DELETE CASCADE,
  item_id        uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  rental_window  tsrange NOT NULL,            -- time range for reservation
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rental_windows_gist ON rental_windows USING gist (item_id, rental_window);

-- Exclusion constraint: prevent overlapping reservations for same item
ALTER TABLE rental_windows
  ADD CONSTRAINT no_overlap_per_item
  EXCLUDE USING gist (
    item_id WITH =,
    rental_window WITH &&
  );

-- ==============================================================================
-- 7) FULFILLMENT & LOGISTICS
-- ==============================================================================

-- Shipments (outbound to customer)
CREATE TABLE shipments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id       uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  carrier         text,
  tracking_number text,
  label_url       text,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shipments_rental ON shipments(rental_id);

-- Returns (inbound from customer)
CREATE TABLE returns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id       uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  carrier         text,
  tracking_number text,
  label_url       text,
  dropped_at      timestamptz,
  received_at     timestamptz,
  condition_notes text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX returns_rental ON returns(rental_id);

-- ==============================================================================
-- 8) PAYMENTS & REFUNDS
-- ==============================================================================

CREATE TABLE payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id          uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  provider           text NOT NULL CHECK (provider IN ('stripe','paypal','card')),
  status             payment_status NOT NULL DEFAULT 'requires_payment',
  amount             numeric(10,2) NOT NULL,
  currency           text NOT NULL DEFAULT 'AUD',
  provider_intent_id text,                    -- e.g., Stripe payment_intent_id
  provider_charge_id text,                    -- final charge id
  card_last4         text,
  payment_method     text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  captured_at        timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_rental ON payments(rental_id);

CREATE TABLE refunds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id         uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount             numeric(10,2) NOT NULL,
  provider_refund_id text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refunds_payment ON refunds(payment_id);

-- ==============================================================================
-- 9) REVIEWS
-- ==============================================================================

CREATE TABLE reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id  uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id    uuid REFERENCES rentals(id) ON DELETE SET NULL,
  rating       int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title text,
  comment      text,
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, customer_id, rental_id)
);
CREATE INDEX reviews_product ON reviews(product_id);
CREATE INDEX reviews_customer ON reviews(customer_id);

-- ==============================================================================
-- 10) NOTIFICATIONS
-- ==============================================================================

CREATE TABLE notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id) ON DELETE CASCADE,
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  channel      text NOT NULL CHECK (channel IN ('email','sms','push','inapp')),
  template_key text NOT NULL,                -- e.g., "rental_reminder", "return_due"
  title        text,
  message      text,
  payload      jsonb NOT NULL DEFAULT '{}',
  read_at      timestamptz,
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_account ON notifications(account_id);
CREATE INDEX notifications_customer ON notifications(customer_id);
CREATE INDEX notifications_read ON notifications(read_at) WHERE read_at IS NULL;

-- ==============================================================================
-- 11) AUDIT LOG (IMMUTABLE TRAIL)
-- ==============================================================================

CREATE TABLE audit_log (
  id           bigserial PRIMARY KEY,
  at           timestamptz NOT NULL DEFAULT now(),
  actor_kind   text NOT NULL CHECK (actor_kind IN ('system','user','customer')),
  actor_id     uuid,
  account_id   uuid REFERENCES accounts(id) ON DELETE SET NULL,
  entity_table text NOT NULL,
  entity_id    uuid,
  action       text NOT NULL,                -- 'create','update','cancel','status_change', etc
  diff         jsonb                         -- changed fields
);
CREATE INDEX audit_log_entity ON audit_log(entity_table, entity_id);
CREATE INDEX audit_log_actor ON audit_log(actor_kind, actor_id);
CREATE INDEX audit_log_at ON audit_log(at);

-- ==============================================================================
-- 12) OUTBOX FOR ASYNC INTEGRATIONS (WEBHOOKS, EMAIL)
-- ==============================================================================

CREATE TABLE outbox_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic        text NOT NULL,                -- "rental.created", "payment.captured"
  payload      jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX outbox_unpublished ON outbox_events (published_at) WHERE published_at IS NULL;

-- ==============================================================================
-- 13) FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_lines_updated_at BEFORE UPDATE ON rental_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 14) SEED DATA (OPTIONAL - FOR TESTING)
-- ==============================================================================

-- Insert default Fitsera account
INSERT INTO accounts (name, slug) 
VALUES ('Fitsera', 'fitsera')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- SCHEMA CREATION COMPLETE
-- ==============================================================================

