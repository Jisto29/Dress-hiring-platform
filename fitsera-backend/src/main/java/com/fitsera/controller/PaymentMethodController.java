package com.fitsera.controller;

import com.fitsera.model.Customer;
import com.fitsera.model.PaymentMethod;
import com.fitsera.service.CustomerService;
import com.fitsera.service.PaymentMethodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment-methods")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class PaymentMethodController {
    
    @Autowired
    private PaymentMethodService paymentMethodService;
    
    @Autowired
    private CustomerService customerService;
    
    @GetMapping("/customer/{customerId}")
    public List<PaymentMethod> getCustomerPaymentMethods(@PathVariable UUID customerId) {
        return paymentMethodService.getPaymentMethodsByCustomerId(customerId);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PaymentMethod> getPaymentMethodById(@PathVariable UUID id) {
        return paymentMethodService.getPaymentMethodById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/customer/{customerId}/default")
    public ResponseEntity<PaymentMethod> getDefaultPaymentMethod(@PathVariable UUID customerId) {
        return paymentMethodService.getDefaultPaymentMethod(customerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/customer/{customerId}")
    public ResponseEntity<PaymentMethod> createPaymentMethod(
            @PathVariable UUID customerId, 
            @RequestBody PaymentMethod paymentMethod) {
        Optional<Customer> customer = customerService.getCustomerById(customerId);
        if (customer.isPresent()) {
            paymentMethod.setCustomer(customer.get());
            PaymentMethod saved = paymentMethodService.createPaymentMethod(paymentMethod);
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.badRequest().build();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PaymentMethod> updatePaymentMethod(
            @PathVariable UUID id, 
            @RequestBody PaymentMethod paymentMethod) {
        PaymentMethod updated = paymentMethodService.updatePaymentMethod(id, paymentMethod);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentMethod(@PathVariable UUID id) {
        paymentMethodService.deletePaymentMethod(id);
        return ResponseEntity.noContent().build();
    }
}

