package com.fitsera.repository;

import com.fitsera.model.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {
    
    /**
     * Get all media assets for a specific entity (e.g., all images for a product)
     * Ordered by sort_order for consistent display
     */
    @Query("SELECT m FROM MediaAsset m WHERE m.entityType = :entityType AND m.entityId = :entityId ORDER BY m.sortOrder ASC, m.createdAt ASC")
    List<MediaAsset> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") UUID entityId);
    
    /**
     * Get the primary/featured image for an entity
     */
    @Query("SELECT m FROM MediaAsset m WHERE m.entityType = :entityType AND m.entityId = :entityId AND m.isPrimary = true")
    Optional<MediaAsset> findPrimaryByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") UUID entityId);
    
    /**
     * Get all media assets for an account (useful for admin views)
     */
    List<MediaAsset> findByAccountId(UUID accountId);
    
    /**
     * Delete all media assets for a specific entity (cascade cleanup)
     */
    void deleteByEntityTypeAndEntityId(String entityType, UUID entityId);
}

