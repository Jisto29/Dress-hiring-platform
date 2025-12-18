-- Create saved_cards table for customer payment methods
CREATE TABLE saved_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  card_number_last4 text NOT NULL,
  card_brand      text,                         -- 'visa', 'mastercard', 'amex', etc.
  name_on_card    text NOT NULL,
  expiry_month    int NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year     int NOT NULL CHECK (expiry_year >= 2024),
  billing_line1   text,
  billing_line2   text,
  billing_city    text,
  billing_state   text,
  billing_postal_code text,
  billing_country text DEFAULT 'AU',
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_cards_customer ON saved_cards(customer_id);
CREATE INDEX saved_cards_default ON saved_cards(customer_id, is_default) WHERE is_default = true;

-- Trigger for updated_at
CREATE TRIGGER update_saved_cards_updated_at BEFORE UPDATE ON saved_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

