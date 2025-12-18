package com.fitsera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;  // Multi-tenant: which brand owns this product
    
    private String sku;
    private String brand;
    private String title;
    private String name;  // Product name

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price_per_day")
    private Double basePricePerDay;

    private Double price;  // Legacy field for backward compatibility

    @Column(columnDefinition = "TEXT")
    @Deprecated // Use media_assets table instead
    private String imageUrl;  // DEPRECATED: Large Object for Base64 images (slow, use media_assets instead)
    
    @Column(columnDefinition = "jsonb")
    @Deprecated // Use media_assets table instead
    private String images;  // DEPRECATED: JSON array of Base64 images (slow, use media_assets instead)
    
    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl; // Quick reference to primary image URL (for migration/caching)
    
    @Column(name = "uses_media_assets")
    private Boolean usesMediaAssets = false; // Flag: true = uses media_assets table, false = legacy Base64
    
    private String occasion;
    private Boolean available;
    private Boolean archived = false;
    private String category;
    private String color;
    private String sizes; // Comma-separated list of sizes
    private Double rating;
    private Integer stock; // Stock count for inventory management
    
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


