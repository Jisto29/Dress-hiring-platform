package com.fitsera.controller;

import com.fitsera.dto.ProductSummaryDTO;
import com.fitsera.model.Product;
import com.fitsera.model.Review;
import com.fitsera.service.ProductService;
import com.fitsera.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class ProductController {

    @Autowired
    private ProductService productService;
    
    @Autowired
    private ReviewService reviewService;

    /**
     * Get all products - returns lightweight summaries by default (fast)
     * Use ?full=true query parameter to get full product data with images (slow)
     */
    @GetMapping
    public ResponseEntity<List<ProductSummaryDTO>> getAllProducts() {
        // Return lightweight summaries without heavy Base64 images
        return ResponseEntity.ok(productService.getAllProductsSummary());
    }

    @SuppressWarnings("deprecation")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable UUID id) {
        return productService.getProductById(id)
                .map(product -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", product.getId());
                    response.put("accountId", product.getAccountId());
                    response.put("sku", product.getSku());
                    response.put("brand", product.getBrand());
                    response.put("title", product.getTitle());
                    response.put("name", product.getName());
                    response.put("description", product.getDescription());
                    response.put("basePricePerDay", product.getBasePricePerDay());
                    response.put("price", product.getPrice());
                    response.put("occasion", product.getOccasion());
                    response.put("available", product.getAvailable());
                    response.put("archived", product.getArchived());
                    response.put("category", product.getCategory());
                    response.put("color", product.getColor());
                    response.put("sizes", product.getSizes());
                    response.put("rating", product.getRating());
                    response.put("stock", product.getStock());
                    
                    // Include Supabase Storage image URLs if available
                    response.put("thumbnailUrl", productService.getProductThumbnailUrl(id));
                    response.put("imageUrls", productService.getProductImageUrls(id));
                    
                    // Keep legacy fields for backward compatibility
                    response.put("imageUrl", product.getImageUrl());
                    response.put("usesMediaAssets", product.getUsesMediaAssets());
                    
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @SuppressWarnings("deprecation")
    @GetMapping("/{id}/with-rating")
    public ResponseEntity<Map<String, Object>> getProductWithRating(@PathVariable UUID id) {
        return productService.getProductById(id)
                .map(product -> {
                    List<Review> reviews = reviewService.getReviewsByProductId(id);
                    double avgRating = reviews.isEmpty() ? 0.0 : 
                        reviews.stream()
                               .mapToInt(Review::getRating)
                               .average()
                               .orElse(0.0);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", product.getId());
                    response.put("accountId", product.getAccountId());
                    response.put("sku", product.getSku());
                    response.put("brand", product.getBrand());
                    response.put("title", product.getTitle());
                    response.put("name", product.getName());
                    response.put("description", product.getDescription());
                    response.put("basePricePerDay", product.getBasePricePerDay());
                    response.put("price", product.getPrice());
                    response.put("occasion", product.getOccasion());
                    response.put("available", product.getAvailable());
                    response.put("archived", product.getArchived());
                    response.put("category", product.getCategory());
                    response.put("color", product.getColor());
                    response.put("sizes", product.getSizes());
                    response.put("rating", product.getRating());
                    response.put("stock", product.getStock());
                    
                    // Include Supabase Storage image URLs
                    response.put("thumbnailUrl", productService.getProductThumbnailUrl(id));
                    response.put("imageUrls", productService.getProductImageUrls(id));
                    
                    // Keep legacy fields
                    response.put("imageUrl", product.getImageUrl());
                    response.put("usesMediaAssets", product.getUsesMediaAssets());
                    
                    // Rating info
                    response.put("calculatedRating", avgRating);
                    response.put("reviewCount", reviews.size());
                    
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/occasion/{occasion}")
    public ResponseEntity<List<Product>> getProductsByOccasion(@PathVariable String occasion) {
        return ResponseEntity.ok(productService.getProductsByOccasion(occasion));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<ProductSummaryDTO>> getProductsByAccountId(@PathVariable UUID accountId) {
        try {
            // Return lightweight summaries for better performance
            List<ProductSummaryDTO> products = productService.getProductsSummaryByAccountId(accountId);
            return ResponseEntity.ok(products != null ? products : new java.util.ArrayList<>());
        } catch (Exception e) {
            System.err.println("ERROR in getProductsByAccountId controller: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of 500 error
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productService.saveProduct(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID id, @RequestBody Product product) {
        return productService.getProductById(id)
                .map(existingProduct -> {
                    product.setId(id);
                    return ResponseEntity.ok(productService.saveProduct(product));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        return productService.getProductById(id)
                .map(product -> {
                    productService.deleteProduct(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Reduce stock when order is placed
    @PostMapping("/{id}/reduce-stock")
    public ResponseEntity<Map<String, Object>> reduceStock(
            @PathVariable UUID id, 
            @RequestBody Map<String, Integer> request) {
        
        int quantity = request.getOrDefault("quantity", 1);
        boolean isOutOfStock = productService.reduceStock(id, quantity);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("outOfStock", isOutOfStock);
        
        return ResponseEntity.ok(response);
    }

    // Check stock availability
    @GetMapping("/{id}/check-stock")
    public ResponseEntity<Map<String, Object>> checkStock(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "1") int quantity) {
        
        boolean available = productService.isStockAvailable(id, quantity);
        
        Map<String, Object> response = new HashMap<>();
        response.put("available", available);
        
        return ResponseEntity.ok(response);
    }
}


