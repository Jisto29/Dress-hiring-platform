package com.fitsera.controller;

import com.fitsera.model.SavedCard;
import com.fitsera.service.SavedCardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers/{customerId}/cards")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class CustomerCardController {
    
    @Autowired
    private SavedCardService savedCardService;
    
    @GetMapping
    public ResponseEntity<List<SavedCard>> getCustomerCards(@PathVariable UUID customerId) {
        try {
            List<SavedCard> cards = savedCardService.getCustomerCards(customerId);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCard(
            @PathVariable UUID customerId,
            @RequestBody SavedCard card) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            // Extract last 4 digits from card number if provided
            if (card.getCardNumberLast4() == null || card.getCardNumberLast4().length() > 4) {
                String fullNumber = card.getCardNumberLast4();
                if (fullNumber != null && fullNumber.length() >= 4) {
                    card.setCardNumberLast4(fullNumber.substring(fullNumber.length() - 4));
                }
            }
            
            // Set card brand based on first digit (simplified)
            if (card.getCardBrand() == null && card.getCardNumberLast4() != null) {
                // This is a simplified version - in production use proper card validation
                card.setCardBrand("card");
            }
            
            SavedCard createdCard = savedCardService.createCard(customerId, card);
            response.put("success", true);
            response.put("card", createdCard);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{cardId}")
    public ResponseEntity<Map<String, Object>> updateCard(
            @PathVariable UUID customerId,
            @PathVariable UUID cardId,
            @RequestBody SavedCard card) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            SavedCard updatedCard = savedCardService.updateCard(customerId, cardId, card);
            response.put("success", true);
            response.put("card", updatedCard);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @DeleteMapping("/{cardId}")
    public ResponseEntity<Map<String, Object>> deleteCard(
            @PathVariable UUID customerId,
            @PathVariable UUID cardId) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            savedCardService.deleteCard(customerId, cardId);
            response.put("success", true);
            response.put("message", "Card deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{cardId}/set-default")
    public ResponseEntity<Map<String, Object>> setDefaultCard(
            @PathVariable UUID customerId,
            @PathVariable UUID cardId) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            SavedCard updatedCard = savedCardService.setDefaultCard(customerId, cardId);
            response.put("success", true);
            response.put("card", updatedCard);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

