package com.fitsera.controller;

import com.fitsera.model.Address;
import com.fitsera.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers/{customerId}/addresses")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class CustomerAddressController {
    
    @Autowired
    private AddressService addressService;
    
    @GetMapping
    public ResponseEntity<List<Address>> getCustomerAddresses(@PathVariable UUID customerId) {
        try {
            List<Address> addresses = addressService.getCustomerAddresses(customerId);
            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createAddress(
            @PathVariable UUID customerId,
            @RequestBody Address address) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            Address createdAddress = addressService.createAddress(customerId, address);
            response.put("success", true);
            response.put("address", createdAddress);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{addressId}")
    public ResponseEntity<Map<String, Object>> updateAddress(
            @PathVariable UUID customerId,
            @PathVariable UUID addressId,
            @RequestBody Address address) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            Address updatedAddress = addressService.updateAddress(customerId, addressId, address);
            response.put("success", true);
            response.put("address", updatedAddress);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Map<String, Object>> deleteAddress(
            @PathVariable UUID customerId,
            @PathVariable UUID addressId) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            addressService.deleteAddress(customerId, addressId);
            response.put("success", true);
            response.put("message", "Address deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{addressId}/set-default")
    public ResponseEntity<Map<String, Object>> setDefaultAddress(
            @PathVariable UUID customerId,
            @PathVariable UUID addressId) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            Address updatedAddress = addressService.setDefaultAddress(customerId, addressId);
            response.put("success", true);
            response.put("address", updatedAddress);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

