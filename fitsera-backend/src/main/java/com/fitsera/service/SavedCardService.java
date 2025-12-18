package com.fitsera.service;

import com.fitsera.model.SavedCard;
import com.fitsera.repository.SavedCardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SavedCardService {
    
    @Autowired
    private SavedCardRepository savedCardRepository;
    
    public List<SavedCard> getCustomerCards(UUID customerId) {
        return savedCardRepository.findByCustomerId(customerId);
    }
    
    public Optional<SavedCard> getCardById(UUID id) {
        return savedCardRepository.findById(id);
    }
    
    @Transactional
    public SavedCard createCard(UUID customerId, SavedCard card) {
        card.setCustomerId(customerId);
        
        // Extract last 4 digits if full card number provided (for simplicity)
        // In production, this should go through a payment gateway like Stripe
        
        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(card.getIsDefault())) {
            unsetDefaultCards(customerId);
        }
        
        return savedCardRepository.save(card);
    }
    
    @Transactional
    public SavedCard updateCard(UUID customerId, UUID cardId, SavedCard cardDetails) {
        Optional<SavedCard> existingCard = savedCardRepository.findById(cardId);
        
        if (existingCard.isPresent() && existingCard.get().getCustomerId().equals(customerId)) {
            SavedCard card = existingCard.get();
            
            // Update fields (excluding card number for security)
            if (cardDetails.getNameOnCard() != null) card.setNameOnCard(cardDetails.getNameOnCard());
            if (cardDetails.getExpiryMonth() != null) card.setExpiryMonth(cardDetails.getExpiryMonth());
            if (cardDetails.getExpiryYear() != null) card.setExpiryYear(cardDetails.getExpiryYear());
            if (cardDetails.getBillingLine1() != null) card.setBillingLine1(cardDetails.getBillingLine1());
            if (cardDetails.getBillingLine2() != null) card.setBillingLine2(cardDetails.getBillingLine2());
            if (cardDetails.getBillingCity() != null) card.setBillingCity(cardDetails.getBillingCity());
            if (cardDetails.getBillingState() != null) card.setBillingState(cardDetails.getBillingState());
            if (cardDetails.getBillingPostalCode() != null) card.setBillingPostalCode(cardDetails.getBillingPostalCode());
            if (cardDetails.getBillingCountry() != null) card.setBillingCountry(cardDetails.getBillingCountry());
            
            // Handle default flag
            if (Boolean.TRUE.equals(cardDetails.getIsDefault())) {
                unsetDefaultCards(customerId);
                card.setIsDefault(true);
            }
            
            return savedCardRepository.save(card);
        }
        
        throw new RuntimeException("Card not found or does not belong to customer");
    }
    
    @Transactional
    public void deleteCard(UUID customerId, UUID cardId) {
        Optional<SavedCard> card = savedCardRepository.findById(cardId);
        if (card.isPresent() && card.get().getCustomerId().equals(customerId)) {
            savedCardRepository.deleteById(cardId);
        } else {
            throw new RuntimeException("Card not found or does not belong to customer");
        }
    }
    
    @Transactional
    public SavedCard setDefaultCard(UUID customerId, UUID cardId) {
        Optional<SavedCard> card = savedCardRepository.findById(cardId);
        
        if (card.isPresent() && card.get().getCustomerId().equals(customerId)) {
            unsetDefaultCards(customerId);
            
            SavedCard c = card.get();
            c.setIsDefault(true);
            return savedCardRepository.save(c);
        }
        
        throw new RuntimeException("Card not found or does not belong to customer");
    }
    
    private void unsetDefaultCards(UUID customerId) {
        List<SavedCard> cards = getCustomerCards(customerId);
        for (SavedCard card : cards) {
            if (Boolean.TRUE.equals(card.getIsDefault())) {
                card.setIsDefault(false);
                savedCardRepository.save(card);
            }
        }
    }
}

