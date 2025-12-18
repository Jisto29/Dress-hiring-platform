package com.fitsera.dto;

import lombok.Data;
import java.util.UUID;

/**
 * Lightweight DTO for media assets
 */
@Data
public class MediaAssetDTO {
    private UUID id;
    private String publicUrl;
    private String altText;
    private Integer sortOrder;
    private Boolean isPrimary;
    private String fileName;
    private String mimeType;
}

