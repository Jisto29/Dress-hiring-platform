package com.fitsera.service;

import com.fitsera.model.MediaAsset;
import com.fitsera.repository.MediaAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MediaAssetService {

    @Autowired
    private MediaAssetRepository mediaAssetRepository;

    /**
     * Get all media assets for an entity (generic)
     */
    public List<MediaAsset> getMediaAssetsForEntity(UUID entityId, String entityType) {
        return mediaAssetRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /**
     * Get all images for a product
     */
    public List<MediaAsset> getProductImages(UUID productId) {
        return getMediaAssetsForEntity(productId, "product");
    }
    
    /**
     * Get a single media asset by ID
     */
    public Optional<MediaAsset> getMediaAssetById(UUID id) {
        return mediaAssetRepository.findById(id);
    }
    
    /**
     * Get all image URLs for a product (lightweight)
     */
    public List<String> getProductImageUrls(UUID productId) {
        return getProductImages(productId).stream()
                .map(MediaAsset::getPublicUrl)
                .collect(Collectors.toList());
    }
    
    /**
     * Get primary/featured image for a product
     */
    public Optional<MediaAsset> getPrimaryProductImage(UUID productId) {
        return mediaAssetRepository.findPrimaryByEntityTypeAndEntityId("product", productId);
    }
    
    /**
     * Get primary image URL (or first image if no primary set)
     */
    public String getPrimaryProductImageUrl(UUID productId) {
        // Try to get primary image
        Optional<MediaAsset> primary = getPrimaryProductImage(productId);
        if (primary.isPresent()) {
            return primary.get().getPublicUrl();
        }
        
        // Fallback to first image if no primary
        List<MediaAsset> images = getProductImages(productId);
        if (!images.isEmpty()) {
            return images.get(0).getPublicUrl();
        }
        
        return null;
    }
    
    /**
     * Save a media asset
     */
    public MediaAsset saveMediaAsset(MediaAsset mediaAsset) {
        return mediaAssetRepository.save(mediaAsset);
    }
    
    /**
     * Delete a media asset
     * NOTE: This only deletes the DB record, not the file from Supabase Storage
     * You should delete from storage separately
     */
    public void deleteMediaAsset(UUID id) {
        mediaAssetRepository.deleteById(id);
    }
    
    /**
     * Delete all images for an entity
     * NOTE: This only deletes the DB records, not the files from Supabase Storage
     */
    @Transactional
    public void deleteEntityImages(String entityType, UUID entityId) {
        mediaAssetRepository.deleteByEntityTypeAndEntityId(entityType, entityId);
    }
    
    /**
     * Set an image as primary (and unset others)
     */
    @Transactional
    public void setPrimaryImage(UUID productId, UUID imageId) {
        List<MediaAsset> images = getProductImages(productId);
        
        for (MediaAsset image : images) {
            image.setIsPrimary(image.getId().equals(imageId));
            mediaAssetRepository.save(image);
        }
    }
}

