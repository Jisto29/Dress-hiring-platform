package com.fitsera.controller;

import com.fitsera.dto.CartItemDTO;
import com.fitsera.service.CartService;
import com.fitsera.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @GetMapping
    public ResponseEntity<List<CartItemDTO>> getCart(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID customerId = extractCustomerId(authHeader);
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        List<CartItemDTO> cartItems = cartService.getCartItems(customerId);
        return ResponseEntity.ok(cartItems);
    }
    
    @PutMapping
    public ResponseEntity<List<CartItemDTO>> updateCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody List<CartItemDTO> cartItems) {
        UUID customerId = extractCustomerId(authHeader);
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        List<CartItemDTO> updatedCart = cartService.updateCart(customerId, cartItems);
        return ResponseEntity.ok(updatedCart);
    }
    
    @DeleteMapping
    public ResponseEntity<Void> clearCart(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID customerId = extractCustomerId(authHeader);
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        cartService.clearCart(customerId);
        return ResponseEntity.noContent().build();
    }
    
    private UUID extractCustomerId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        try {
            String token = authHeader.substring(7);
            return jwtUtil.extractUserId(token);
        } catch (Exception e) {
            return null;
        }
    }
}

