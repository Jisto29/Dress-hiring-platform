-- Media Assets table for storing image/file metadata
-- Actual files stored in Supabase Storage, not in database
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'brand_logo', etc.
    entity_id UUID, -- ID of the product/brand/etc
    
    -- Storage reference (Supabase Storage path)
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'product-images',
    storage_path VARCHAR(500) NOT NULL, -- e.g. 'products/123/image1.jpg'
    
    -- URLs
    public_url TEXT NOT NULL, -- Full public URL to access the image
    
    -- Metadata
    file_name VARCHAR(255),
    file_size BIGINT, -- in bytes
    mime_type VARCHAR(100),
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0, -- for ordering multiple images
    is_primary BOOLEAN DEFAULT false, -- primary/featured image
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_media_assets_entity ON media_assets(entity_type, entity_id);
CREATE INDEX idx_media_assets_account ON media_assets(account_id);
CREATE INDEX idx_media_assets_primary ON media_assets(entity_id, is_primary) WHERE is_primary = true;

-- Add new columns to products table for backward compatibility
-- Keep imageUrl for now but mark as deprecated
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS uses_media_assets BOOLEAN DEFAULT false;

-- Comments
COMMENT ON TABLE media_assets IS 'Stores metadata for images/files. Actual files are in Supabase Storage (S3).';
COMMENT ON COLUMN media_assets.storage_path IS 'Path in Supabase Storage bucket, e.g., products/uuid/filename.jpg';
COMMENT ON COLUMN media_assets.public_url IS 'Full public URL for direct access, e.g., https://[project].supabase.co/storage/v1/object/public/...';

