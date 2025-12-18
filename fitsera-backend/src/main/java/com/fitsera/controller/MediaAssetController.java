package com.fitsera.controller;

import com.fitsera.model.MediaAsset;
import com.fitsera.model.Product;
import com.fitsera.service.MediaAssetService;
import com.fitsera.service.ProductService;
import com.fitsera.service.SupabaseStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller for managing media assets (images, files)
 * Handles uploads to Supabase Storage
 */
@RestController
@RequestMapping("/api/media")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class MediaAssetController {

    @Autowired
    private SupabaseStorageService supabaseStorageService;

    @Autowired
    private MediaAssetService mediaAssetService;

    @Autowired
    private ProductService productService;

    /**
     * Upload product image
     * 
     * @param file Image file
     * @param productId Product UUID
     * @param isPrimary Whether this is the primary/thumbnail image
     * @param sortOrder Display order (0 = first)
     * @return MediaAsset metadata
     */
    @PostMapping("/upload/product")
    public ResponseEntity<Map<String, Object>> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("productId") UUID productId,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary,
            @RequestParam(value = "sortOrder", defaultValue = "0") Integer sortOrder) {
        
        try {
            // Get product to verify it exists and get accountId
            Optional<Product> productOpt = productService.getProductById(productId);
            if (productOpt.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }

            Product product = productOpt.get();
            UUID accountId = product.getAccountId();

            // Upload file to Supabase Storage
            MediaAsset mediaAsset = supabaseStorageService.uploadFile(file, accountId, "product", productId);
            
            // Set additional metadata
            mediaAsset.setIsPrimary(isPrimary);
            mediaAsset.setSortOrder(sortOrder);
            
            // Save metadata to database
            MediaAsset savedAsset = mediaAssetService.saveMediaAsset(mediaAsset);

            // Update product to use media_assets system
            if (!Boolean.TRUE.equals(product.getUsesMediaAssets())) {
                product.setUsesMediaAssets(true);
                productService.saveProduct(product);
            }

            // Update product thumbnail if this is primary image
            if (isPrimary) {
                product.setThumbnailUrl(savedAsset.getPublicUrl());
                productService.saveProduct(product);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mediaAsset", savedAsset);
            response.put("publicUrl", savedAsset.getPublicUrl());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ ERROR uploading product image:");
            System.err.println("Error type: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("errorType", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get all images for a product
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<Map<String, Object>> getProductImages(@PathVariable UUID productId) {
        try {
            var mediaAssets = mediaAssetService.getMediaAssetsForEntity(productId, "product");
            var imageUrls = mediaAssetService.getProductImageUrls(productId);
            var primaryUrl = mediaAssetService.getPrimaryProductImageUrl(productId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mediaAssets", mediaAssets);
            response.put("imageUrls", imageUrls);
            response.put("primaryUrl", primaryUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Delete a media asset
     */
    @DeleteMapping("/{mediaAssetId}")
    public ResponseEntity<Map<String, Object>> deleteMediaAsset(@PathVariable UUID mediaAssetId) {
        try {
            // Get media asset
            Optional<MediaAsset> assetOpt = mediaAssetService.getMediaAssetById(mediaAssetId);

            if (assetOpt.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Media asset not found");
                return ResponseEntity.notFound().build();
            }

            MediaAsset asset = assetOpt.get();

            // Delete from Supabase Storage
            supabaseStorageService.deleteFile(asset.getStoragePath());

            // Delete from database
            mediaAssetService.deleteMediaAsset(mediaAssetId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Media asset deleted successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

