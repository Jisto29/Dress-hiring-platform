package com.fitsera.service;

import com.fitsera.model.PaymentMethod;
import com.fitsera.repository.PaymentMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentMethodService {
    
    @Autowired
    private PaymentMethodRepository paymentMethodRepository;
    
    public List<PaymentMethod> getPaymentMethodsByCustomerId(UUID customerId) {
        return paymentMethodRepository.findByCustomerId(customerId);
    }
    
    public Optional<PaymentMethod> getPaymentMethodById(UUID id) {
        return paymentMethodRepository.findById(id);
    }
    
    public Optional<PaymentMethod> getDefaultPaymentMethod(UUID customerId) {
        return paymentMethodRepository.findByCustomerIdAndIsDefault(customerId, true);
    }
    
    @Transactional
    public PaymentMethod createPaymentMethod(PaymentMethod paymentMethod) {
        // If this is set as default, unset other defaults for this customer
        if (paymentMethod.getIsDefault() != null && paymentMethod.getIsDefault()) {
            List<PaymentMethod> existingMethods = paymentMethodRepository.findByCustomerId(paymentMethod.getCustomer().getId());
            for (PaymentMethod existing : existingMethods) {
                if (existing.getIsDefault()) {
                    existing.setIsDefault(false);
                    paymentMethodRepository.save(existing);
                }
            }
        }
        return paymentMethodRepository.save(paymentMethod);
    }
    
    @Transactional
    public PaymentMethod updatePaymentMethod(UUID id, PaymentMethod paymentMethodDetails) {
        Optional<PaymentMethod> optionalPaymentMethod = paymentMethodRepository.findById(id);
        if (optionalPaymentMethod.isPresent()) {
            PaymentMethod paymentMethod = optionalPaymentMethod.get();
            
            // If setting as default, unset other defaults
            if (paymentMethodDetails.getIsDefault() != null && paymentMethodDetails.getIsDefault() 
                && !paymentMethod.getIsDefault()) {
                List<PaymentMethod> customerPaymentMethods = paymentMethodRepository.findByCustomerId(paymentMethod.getCustomer().getId());
                for (PaymentMethod existing : customerPaymentMethods) {
                    if (existing.getIsDefault()) {
                        existing.setIsDefault(false);
                        paymentMethodRepository.save(existing);
                    }
                }
            }
            
            if (paymentMethodDetails.getPaymentType() != null) {
                paymentMethod.setPaymentType(paymentMethodDetails.getPaymentType());
            }
            if (paymentMethodDetails.getIsDefault() != null) {
                paymentMethod.setIsDefault(paymentMethodDetails.getIsDefault());
            }
            if (paymentMethodDetails.getCardType() != null) {
                paymentMethod.setCardType(paymentMethodDetails.getCardType());
            }
            if (paymentMethodDetails.getCardLast4() != null) {
                paymentMethod.setCardLast4(paymentMethodDetails.getCardLast4());
            }
            if (paymentMethodDetails.getCardHolderName() != null) {
                paymentMethod.setCardHolderName(paymentMethodDetails.getCardHolderName());
            }
            if (paymentMethodDetails.getExpiryMonth() != null) {
                paymentMethod.setExpiryMonth(paymentMethodDetails.getExpiryMonth());
            }
            if (paymentMethodDetails.getExpiryYear() != null) {
                paymentMethod.setExpiryYear(paymentMethodDetails.getExpiryYear());
            }
            if (paymentMethodDetails.getPaymentToken() != null) {
                paymentMethod.setPaymentToken(paymentMethodDetails.getPaymentToken());
            }
            if (paymentMethodDetails.getBillingAddressId() != null) {
                paymentMethod.setBillingAddressId(paymentMethodDetails.getBillingAddressId());
            }
            
            return paymentMethodRepository.save(paymentMethod);
        }
        return null;
    }
    
    public void deletePaymentMethod(UUID id) {
        paymentMethodRepository.deleteById(id);
    }
}

