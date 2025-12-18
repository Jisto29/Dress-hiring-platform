package com.fitsera.controller;

import com.fitsera.model.Customer;
import com.fitsera.model.WishlistItem;
import com.fitsera.service.CustomerService;
import com.fitsera.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class WishlistController {
    
    @Autowired
    private WishlistService wishlistService;
    
    @Autowired
    private CustomerService customerService;
    
    @GetMapping("/customer/{customerId}")
    public List<WishlistItem> getCustomerWishlist(@PathVariable UUID customerId) {
        return wishlistService.getWishlistByCustomerId(customerId);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<WishlistItem> getWishlistItemById(@PathVariable UUID id) {
        return wishlistService.getWishlistItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/customer/{customerId}/product/{productId}")
    public ResponseEntity<WishlistItem> getWishlistItemByProduct(
            @PathVariable UUID customerId, 
            @PathVariable UUID productId) {
        return wishlistService.getWishlistItemByCustomerAndProduct(customerId, productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/customer/{customerId}/check/{productId}")
    public ResponseEntity<Map<String, Boolean>> checkIfInWishlist(
            @PathVariable UUID customerId, 
            @PathVariable UUID productId) {
        Map<String, Boolean> response = new HashMap<>();
        boolean inWishlist = wishlistService.isProductInWishlist(customerId, productId);
        response.put("inWishlist", inWishlist);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/customer/{customerId}")
    public ResponseEntity<WishlistItem> addToWishlist(
            @PathVariable UUID customerId, 
            @RequestBody WishlistItem wishlistItem) {
        Optional<Customer> customer = customerService.getCustomerById(customerId);
        if (customer.isPresent()) {
            wishlistItem.setCustomer(customer.get());
            WishlistItem saved = wishlistService.addToWishlist(wishlistItem);
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.badRequest().build();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<WishlistItem> updateWishlistItem(
            @PathVariable UUID id, 
            @RequestBody WishlistItem wishlistItem) {
        WishlistItem updated = wishlistService.updateWishlistItem(id, wishlistItem);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable UUID id) {
        wishlistService.removeFromWishlist(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/customer/{customerId}/product/{productId}")
    public ResponseEntity<Void> removeFromWishlistByProduct(
            @PathVariable UUID customerId, 
            @PathVariable UUID productId) {
        wishlistService.removeFromWishlistByProductId(customerId, productId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/customer/{customerId}")
    public ResponseEntity<Void> clearWishlist(@PathVariable UUID customerId) {
        wishlistService.clearWishlist(customerId);
        return ResponseEntity.noContent().build();
    }
}

