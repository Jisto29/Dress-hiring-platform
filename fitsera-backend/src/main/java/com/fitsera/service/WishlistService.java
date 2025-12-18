package com.fitsera.service;

import com.fitsera.model.WishlistItem;
import com.fitsera.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WishlistService {
    
    @Autowired
    private WishlistItemRepository wishlistItemRepository;
    
    public List<WishlistItem> getWishlistByCustomerId(UUID customerId) {
        return wishlistItemRepository.findByCustomerId(customerId);
    }
    
    public Optional<WishlistItem> getWishlistItemById(UUID id) {
        return wishlistItemRepository.findById(id);
    }
    
    public Optional<WishlistItem> getWishlistItemByCustomerAndProduct(UUID customerId, UUID productId) {
        return wishlistItemRepository.findByCustomerIdAndProductId(customerId, productId);
    }
    
    public boolean isProductInWishlist(UUID customerId, UUID productId) {
        return wishlistItemRepository.existsByCustomerIdAndProductId(customerId, productId);
    }
    
    public WishlistItem addToWishlist(WishlistItem wishlistItem) {
        // Check if already exists
        if (wishlistItemRepository.existsByCustomerIdAndProductId(
                wishlistItem.getCustomer().getId(), 
                wishlistItem.getProductId())) {
            // Already in wishlist, return existing
            return wishlistItemRepository.findByCustomerIdAndProductId(
                wishlistItem.getCustomer().getId(), 
                wishlistItem.getProductId()
            ).orElse(null);
        }
        return wishlistItemRepository.save(wishlistItem);
    }
    
    public WishlistItem updateWishlistItem(UUID id, WishlistItem wishlistItemDetails) {
        Optional<WishlistItem> optionalWishlistItem = wishlistItemRepository.findById(id);
        if (optionalWishlistItem.isPresent()) {
            WishlistItem wishlistItem = optionalWishlistItem.get();
            if (wishlistItemDetails.getPreferredSize() != null) {
                wishlistItem.setPreferredSize(wishlistItemDetails.getPreferredSize());
            }
            if (wishlistItemDetails.getPreferredColor() != null) {
                wishlistItem.setPreferredColor(wishlistItemDetails.getPreferredColor());
            }
            if (wishlistItemDetails.getNotes() != null) {
                wishlistItem.setNotes(wishlistItemDetails.getNotes());
            }
            return wishlistItemRepository.save(wishlistItem);
        }
        return null;
    }
    
    public void removeFromWishlist(UUID id) {
        wishlistItemRepository.deleteById(id);
    }
    
    @Transactional
    public void removeFromWishlistByProductId(UUID customerId, UUID productId) {
        wishlistItemRepository.deleteByCustomerIdAndProductId(customerId, productId);
    }
    
    public void clearWishlist(UUID customerId) {
        List<WishlistItem> items = wishlistItemRepository.findByCustomerId(customerId);
        wishlistItemRepository.deleteAll(items);
    }
}

