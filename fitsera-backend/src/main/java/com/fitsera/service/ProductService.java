package com.fitsera.service;

import com.fitsera.dto.ProductSummaryDTO;
import com.fitsera.model.Product;
import com.fitsera.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired(required = false)
    private MediaAssetService mediaAssetService;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    /**
     * Get lightweight product summaries without heavy Base64 image data
     * Truncates large images for performance
     */
    public List<ProductSummaryDTO> getAllProductsSummary() {
        try {
            List<Product> products = productRepository.findAll();
            if (products == null) {
                return new java.util.ArrayList<>();
            }
            return products.stream()
                    .map(this::convertToSummaryDTO)
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("ERROR in getAllProductsSummary: " + e.getMessage());
            e.printStackTrace();
            // Return empty list on ANY error to prevent 500
            return new java.util.ArrayList<>();
        }
    }

    public List<ProductSummaryDTO> getProductsSummaryByAccountId(UUID accountId) {
        try {
            List<Product> products = productRepository.findByAccountId(accountId);
            if (products == null) {
                return new java.util.ArrayList<>();
            }
            return products.stream()
                    .map(this::convertToSummaryDTO)
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("ERROR in getProductsSummaryByAccountId: " + e.getMessage());
            e.printStackTrace();
            // Return empty list on ANY error to prevent 500
            return new java.util.ArrayList<>();
        }
    }
    
    @SuppressWarnings("deprecation")
    private ProductSummaryDTO convertToSummaryDTO(Product product) {
        try {
            ProductSummaryDTO dto = new ProductSummaryDTO();
            dto.setId(product.getId());
            dto.setAccountId(product.getAccountId());
            dto.setSku(product.getSku());
            dto.setBrand(product.getBrand());
            dto.setTitle(product.getTitle());
            dto.setName(product.getName());
            dto.setDescription(product.getDescription());
            dto.setBasePricePerDay(product.getBasePricePerDay());
            dto.setPrice(product.getPrice());
            dto.setOccasion(product.getOccasion());
            dto.setAvailable(product.getAvailable());
            dto.setArchived(product.getArchived());
            dto.setCategory(product.getCategory());
            dto.setColor(product.getColor());
            dto.setSizes(product.getSizes());
            dto.setRating(product.getRating());
            dto.setStock(product.getStock());
            
            // Try to use new Supabase Storage URLs if available
                try {
                    if (Boolean.TRUE.equals(product.getUsesMediaAssets()) && mediaAssetService != null) {
                        List<String> imageUrls = mediaAssetService.getProductImageUrls(product.getId());
                        dto.setImageUrls(imageUrls);
                        String thumbnailUrl = mediaAssetService.getPrimaryProductImageUrl(product.getId());
                        dto.setThumbnailUrl(thumbnailUrl);
                    } else {
                        // Use legacy Base64 fields - return ACTUAL images
                        String imageUrl = product.getImageUrl();
                        dto.setImageUrl(imageUrl);
                        dto.setThumbnailUrl(imageUrl);
                    }
            } catch (Exception e) {
                // Silently fall back to legacy on ANY error
                String imageUrl = product.getImageUrl();
                dto.setImageUrl(imageUrl);
                dto.setThumbnailUrl(imageUrl);
            }
            
            return dto;
        } catch (Exception e) {
            // If even DTO creation fails, log and return null
            System.err.println("Failed to convert product to DTO: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public Optional<Product> getProductById(UUID id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByOccasion(String occasion) {
        return productRepository.findByOccasion(occasion);
    }
    
    public List<Product> getProductsByAccountId(UUID accountId) {
        return productRepository.findByAccountId(accountId);
    }
    
    public List<Product> getProductsByBrand(String brand) {
        return productRepository.findByBrand(brand);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(UUID id) {
        productRepository.deleteById(id);
    }

    // Reduce stock when order is placed
    public boolean reduceStock(UUID productId, int quantity) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            Integer currentStock = product.getStock();
            
            // Check if stock is available
            if (currentStock != null && currentStock >= quantity) {
                product.setStock(currentStock - quantity);
                productRepository.save(product);
                
                // Return true if product is now out of stock (for notification)
                return product.getStock() == 0;
            }
        }
        return false;
    }

    // Restore stock when item is returned
    public void restoreStock(UUID productId, int quantity) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            Integer currentStock = product.getStock();
            
            if (currentStock != null) {
                product.setStock(currentStock + quantity);
                productRepository.save(product);
            }
        }
    }

    // Check stock availability
    public boolean isStockAvailable(UUID productId, int quantity) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            Integer stock = product.getStock();
            return stock != null && stock >= quantity;
        }
        return false;
    }

    /**
     * Get thumbnail URL for a product (for detail views)
     */
    @SuppressWarnings("deprecation")
    public String getProductThumbnailUrl(UUID productId) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return null;
        }
        
        Product product = productOpt.get();
        
        // Try Supabase Storage first if enabled
        if (Boolean.TRUE.equals(product.getUsesMediaAssets()) && mediaAssetService != null) {
            try {
                String supabaseUrl = mediaAssetService.getPrimaryProductImageUrl(productId);
                if (supabaseUrl != null) {
                    return supabaseUrl;
                }
            } catch (Exception e) {
                System.err.println("Failed to get Supabase thumbnail for product " + productId + ": " + e.getMessage());
            }
        }
        
        // Fallback to legacy imageUrl
        return product.getImageUrl();
    }

    /**
     * Get all image URLs for a product (for detail views with galleries)
     */
    @SuppressWarnings("deprecation")
    public java.util.List<String> getProductImageUrls(UUID productId) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        Product product = productOpt.get();
        
        // Try Supabase Storage first if enabled
        if (Boolean.TRUE.equals(product.getUsesMediaAssets()) && mediaAssetService != null) {
            try {
                java.util.List<String> supabaseUrls = mediaAssetService.getProductImageUrls(productId);
                if (supabaseUrls != null && !supabaseUrls.isEmpty()) {
                    return supabaseUrls;
                }
            } catch (Exception e) {
                System.err.println("Failed to get Supabase images for product " + productId + ": " + e.getMessage());
            }
        }
        
        // Fallback to legacy images (if it's a JSON array)
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            try {
                // Parse JSON array of Base64 images
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.readValue(product.getImages(), 
                    mapper.getTypeFactory().constructCollectionType(java.util.List.class, String.class));
            } catch (Exception e) {
                System.err.println("Failed to parse legacy images JSON: " + e.getMessage());
            }
        }
        
        // Last resort: return imageUrl as single-item list
        if (product.getImageUrl() != null) {
            java.util.List<String> singleImage = new java.util.ArrayList<>();
            singleImage.add(product.getImageUrl());
            return singleImage;
        }
        
        return new java.util.ArrayList<>();
    }
}


