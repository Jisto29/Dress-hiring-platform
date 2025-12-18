-- Populate test data for overdue returns functionality
-- This script creates a test user with an order from 12/10/2025 that should be overdue

-- 1. Create a test customer
INSERT INTO customers (id, email, full_name, phone, password, created_at, updated_at)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'test.overdue@example.com',
    'Test Overdue User',
    '+1234567890',
    '$2a$10$dummyhashedpassword123456789012345678901234567890', -- Dummy hashed password
    '2025-10-01 10:00:00',
    '2025-10-01 10:00:00'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create an order placed on 12/10/2025
INSERT INTO orders (
    id, 
    customer_id, 
    order_number, 
    status, 
    subtotal, 
    discount, 
    delivery_fee, 
    total,
    delivery_line1,
    delivery_city,
    delivery_state,
    delivery_postal_code,
    delivery_country,
    contact_email,
    contact_phone,
    estimated_delivery_date,
    created_at,
    updated_at,
    shipped_at,
    delivered_at
)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'ORD-TEST-OVERDUE-001',
    'delivered', -- Order is delivered
    50.00,
    0.00,
    5.00,
    55.00,
    '123 Test Street',
    'Test City',
    'Test State',
    '12345',
    'United States',
    'test.overdue@example.com',
    '+1234567890',
    '2025-10-14', -- Estimated delivery was Oct 14
    '2025-10-12 09:00:00', -- Order placed on Oct 12
    '2025-10-12 09:00:00',
    '2025-10-13 10:00:00', -- Shipped on Oct 13
    '2025-10-14 15:30:00'  -- Delivered on Oct 14
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create a payment record
INSERT INTO payments (
    id,
    order_id,
    payment_method,
    payment_status,
    card_last4,
    amount,
    paid_at,
    created_at,
    updated_at
)
VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222',
    'card',
    'paid',
    '4242',
    55.00,
    '2025-10-12 09:05:00',
    '2025-10-12 09:05:00',
    '2025-10-12 09:05:00'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create order items with 1 week rental period
-- Product 1: Should have been returned by Oct 21 (14 + 7 days) - NOW OVERDUE
INSERT INTO order_items (
    id,
    order_id,
    product_id,
    product_name,
    product_brand,
    product_image_url,
    size,
    color,
    rental_period,
    quantity,
    price,
    subtotal,
    desired_delivery_date,
    needs_express_delivery,
    return_status,
    created_at,
    updated_at
)
SELECT 
    'd4444444-4444-4444-4444-444444444444',
    'b2222222-2222-2222-2222-222222222222',
    p.id,
    p.title,
    p.brand,
    COALESCE(
        (SELECT public_url FROM media_assets WHERE entity_type = 'product' AND entity_id = p.id AND is_primary = true LIMIT 1),
        p.image_url
    ),
    '10',
    'Black',
    '1 week', -- 7 days rental period
    1,
    50.00,
    50.00,
    '2025-10-14',
    false,
    'not_returned', -- Still not returned - THIS IS OVERDUE
    '2025-10-12 09:00:00',
    '2025-10-12 09:00:00'
FROM products p
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 5. Create an address for the test user
INSERT INTO addresses (
    id,
    customer_id,
    address_type,
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
    is_default,
    created_at,
    updated_at
)
VALUES (
    'e5555555-5555-5555-5555-555555555555',
    'a1111111-1111-1111-1111-111111111111',
    'shipping',
    '123 Test Street',
    'Apt 1',
    'Test City',
    'Test State',
    '12345',
    'United States',
    true,
    '2025-10-01 10:00:00',
    '2025-10-01 10:00:00'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Create a saved card for the test user
INSERT INTO saved_cards (
    id,
    customer_id,
    name_on_card,
    card_number_last4,
    card_brand,
    expiry_month,
    expiry_year,
    billing_line1,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
    is_default,
    created_at,
    updated_at
)
VALUES (
    'f6666666-6666-6666-6666-666666666666',
    'a1111111-1111-1111-1111-111111111111',
    'Test Overdue User',
    '4242',
    'Visa',
    '12',
    '2028',
    '123 Test Street',
    'Test City',
    'Test State',
    '12345',
    'United States',
    true,
    '2025-10-01 10:00:00',
    '2025-10-01 10:00:00'
)
ON CONFLICT (id) DO NOTHING;

-- Verification queries
SELECT 'Test user created:' as step;
SELECT email, full_name FROM customers WHERE id = 'a1111111-1111-1111-1111-111111111111';

SELECT 'Test order created:' as step;
SELECT order_number, status, created_at, delivered_at FROM orders WHERE id = 'b2222222-2222-2222-2222-222222222222';

SELECT 'Test order items:' as step;
SELECT product_name, rental_period, return_status FROM order_items WHERE order_id = 'b2222222-2222-2222-2222-222222222222';

SELECT 'Expected return date calculation:' as step;
SELECT 
    delivered_at::date as delivery_date,
    delivered_at::date + INTERVAL '7 days' as expected_return_date,
    CURRENT_DATE as today,
    CASE 
        WHEN CURRENT_DATE > (delivered_at::date + INTERVAL '7 days') THEN 'OVERDUE ⚠️'
        ELSE 'NOT OVERDUE ✓'
    END as status
FROM orders 
WHERE id = 'b2222222-2222-2222-2222-222222222222';

