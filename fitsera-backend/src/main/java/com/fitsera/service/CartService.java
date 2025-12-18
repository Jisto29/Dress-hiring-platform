package com.fitsera.service;

import com.fitsera.dto.CartItemDTO;
import com.fitsera.model.Cart;
import com.fitsera.model.CartItem;
import com.fitsera.model.MediaAsset;
import com.fitsera.model.Product;
import com.fitsera.repository.CartRepository;
import com.fitsera.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CartService {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private MediaAssetService mediaAssetService;
    
    @Transactional(readOnly = true)
    public List<CartItemDTO> getCartItems(UUID customerId) {
        Cart cart = cartRepository.findByCustomerId(customerId).orElse(null);
        
        if (cart == null || cart.getItems().isEmpty()) {
            return new ArrayList<>();
        }
        
        return cart.getItems().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public List<CartItemDTO> updateCart(UUID customerId, List<CartItemDTO> cartItemDTOs) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setCustomerId(customerId);
                    return cartRepository.save(newCart); // Save cart first to get ID
                });
        
        // Clear existing items
        cart.getItems().clear();
        cartRepository.save(cart); // Flush the deletion
        
        // Add new items
        for (CartItemDTO dto : cartItemDTOs) {
            // Use productId from DTO, or fall back to id field
            UUID productId = dto.getProductId() != null ? dto.getProductId() : 
                            (dto.getId() != null ? dto.getId() : null);
            
            if (productId == null) {
                continue; // Skip items without product ID
            }
            
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProductId(productId);
            item.setSize(dto.getSize());
            item.setColor(dto.getColor());
            item.setRentalPeriod(dto.getRentalPeriod());
            item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
            item.setDesiredDeliveryDate(dto.getDesiredDeliveryDate());
            item.setNeedsExpressDelivery(dto.getNeedsExpressDelivery() != null ? dto.getNeedsExpressDelivery() : false);
            cart.getItems().add(item);
        }
        
        cart = cartRepository.save(cart);
        
        return cart.getItems().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void clearCart(UUID customerId) {
        cartRepository.findByCustomerId(customerId)
                .ifPresent(cart -> {
                    cart.getItems().clear();
                    cartRepository.save(cart);
                });
    }
    
    private CartItemDTO convertToDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProductId());
        dto.setSize(item.getSize());
        dto.setColor(item.getColor());
        dto.setRentalPeriod(item.getRentalPeriod());
        dto.setQuantity(item.getQuantity());
        dto.setDesiredDeliveryDate(item.getDesiredDeliveryDate());
        dto.setNeedsExpressDelivery(item.getNeedsExpressDelivery());
        
        // Fetch product details
        Product product = productRepository.findById(item.getProductId()).orElse(null);
        if (product != null) {
            dto.setTitle(product.getTitle());
            dto.setName(product.getName());
            dto.setBrand(product.getBrand());
            dto.setPrice(product.getPrice() != null ? product.getPrice() : product.getBasePricePerDay());
            
            System.out.println("DEBUG: Product " + product.getTitle() + " - usesMediaAssets: " + product.getUsesMediaAssets());
            System.out.println("DEBUG: Product thumbnailUrl: " + product.getThumbnailUrl());
            
            // Get images from media_assets if available
            if (Boolean.TRUE.equals(product.getUsesMediaAssets())) {
                List<MediaAsset> mediaAssets = mediaAssetService.getProductImages(item.getProductId());
                System.out.println("DEBUG: Found " + mediaAssets.size() + " media assets for product " + product.getTitle());
                if (!mediaAssets.isEmpty()) {
                    // Set primary image
                    MediaAsset primaryImage = mediaAssets.stream()
                            .filter(MediaAsset::getIsPrimary)
                            .findFirst()
                            .orElse(mediaAssets.get(0));
                    String imageUrl = primaryImage.getPublicUrl();
                    System.out.println("DEBUG: Setting primary image URL: " + imageUrl);
                    dto.setImage(imageUrl);
                    
                    // Set all images
                    dto.setImages(mediaAssets.stream()
                            .map(MediaAsset::getPublicUrl)
                            .collect(Collectors.toList()));
                } else if (product.getThumbnailUrl() != null) {
                    System.out.println("DEBUG: No media assets, using thumbnail: " + product.getThumbnailUrl());
                    dto.setImage(product.getThumbnailUrl());
                    dto.setImages(List.of(product.getThumbnailUrl()));
                } else {
                    System.out.println("DEBUG: No media assets and no thumbnail for product " + product.getTitle());
                }
            } else {
                // Fallback to thumbnailUrl
                System.out.println("DEBUG: Product not using media assets, checking thumbnail");
                if (product.getThumbnailUrl() != null) {
                    System.out.println("DEBUG: Using thumbnailUrl: " + product.getThumbnailUrl());
                    dto.setImage(product.getThumbnailUrl());
                    dto.setImages(List.of(product.getThumbnailUrl()));
                } else {
                    System.out.println("DEBUG: No images found for product " + product.getTitle());
                }
            }
            
            System.out.println("DEBUG: Final DTO image URL: " + dto.getImage());
        }
        
        return dto;
    }
}

