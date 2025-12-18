package com.fitsera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Media Assets - stores metadata for images/files
 * Actual files are stored in Supabase Storage (S3-like), not in database
 * This dramatically improves query performance
 */
@Entity
@Table(name = "media_assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MediaAsset {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;
    
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // 'product', 'brand_logo', etc.
    
    @Column(name = "entity_id")
    private UUID entityId; // ID of the product/brand/etc
    
    // Storage reference (Supabase Storage)
    @Column(name = "storage_bucket", nullable = false, length = 100)
    private String storageBucket = "product-images";
    
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath; // e.g. 'products/123/image1.jpg'
    
    // URL for direct access
    @Column(name = "public_url", nullable = false, columnDefinition = "TEXT")
    private String publicUrl;
    
    // Metadata
    @Column(name = "file_name", length = 255)
    private String fileName;
    
    @Column(name = "file_size")
    private Long fileSize; // in bytes
    
    @Column(name = "mime_type", length = 100)
    private String mimeType;
    
    @Column(name = "alt_text", columnDefinition = "TEXT")
    private String altText;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "is_primary")
    private Boolean isPrimary = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

