package com.fitsera.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * Lightweight DTO for product listings
 * Uses Supabase Storage URLs instead of Base64 for optimal performance
 */
@Data
public class ProductSummaryDTO {
    private UUID id;
    private UUID accountId;
    private String sku;
    private String brand;
    private String title;
    private String name;
    private String description;
    private Double basePricePerDay;
    private Double price;
    private String occasion;
    private Boolean available;
    private Boolean archived;
    private String category;
    private String color;
    private String sizes;
    private Double rating;
    private Integer stock;
    
    // Image URLs from Supabase Storage (no Base64 - fast!)
    private String thumbnailUrl; // Primary image URL
    private List<String> imageUrls; // All image URLs
    
    // Legacy support (deprecated - will be removed)
    @Deprecated
    private String imageUrl; // Old Base64 field
}

