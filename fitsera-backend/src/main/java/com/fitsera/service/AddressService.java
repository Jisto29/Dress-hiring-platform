package com.fitsera.service;

import com.fitsera.model.Address;
import com.fitsera.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AddressService {
    
    @Autowired
    private AddressRepository addressRepository;
    
    public List<Address> getCustomerAddresses(UUID customerId) {
        return addressRepository.findByCustomerId(customerId);
    }
    
    public Optional<Address> getAddressById(UUID id) {
        return addressRepository.findById(id);
    }
    
    @Transactional
    public Address createAddress(UUID customerId, Address address) {
        address.setCustomerId(customerId);
        
        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            unsetDefaultAddresses(customerId);
        }
        
        return addressRepository.save(address);
    }
    
    @Transactional
    public Address updateAddress(UUID customerId, UUID addressId, Address addressDetails) {
        Optional<Address> existingAddress = addressRepository.findById(addressId);
        
        if (existingAddress.isPresent() && existingAddress.get().getCustomerId().equals(customerId)) {
            Address address = existingAddress.get();
            
            // Update fields
            if (addressDetails.getLine1() != null) address.setLine1(addressDetails.getLine1());
            if (addressDetails.getLine2() != null) address.setLine2(addressDetails.getLine2());
            if (addressDetails.getCity() != null) address.setCity(addressDetails.getCity());
            if (addressDetails.getState() != null) address.setState(addressDetails.getState());
            if (addressDetails.getPostalCode() != null) address.setPostalCode(addressDetails.getPostalCode());
            if (addressDetails.getCountry() != null) address.setCountry(addressDetails.getCountry());
            if (addressDetails.getAddressType() != null) address.setAddressType(addressDetails.getAddressType());
            
            // Handle default flag
            if (Boolean.TRUE.equals(addressDetails.getIsDefault())) {
                unsetDefaultAddresses(customerId);
                address.setIsDefault(true);
            }
            
            return addressRepository.save(address);
        }
        
        throw new RuntimeException("Address not found or does not belong to customer");
    }
    
    @Transactional
    public void deleteAddress(UUID customerId, UUID addressId) {
        Optional<Address> address = addressRepository.findById(addressId);
        if (address.isPresent() && address.get().getCustomerId().equals(customerId)) {
            addressRepository.deleteById(addressId);
        } else {
            throw new RuntimeException("Address not found or does not belong to customer");
        }
    }
    
    @Transactional
    public Address setDefaultAddress(UUID customerId, UUID addressId) {
        Optional<Address> address = addressRepository.findById(addressId);
        
        if (address.isPresent() && address.get().getCustomerId().equals(customerId)) {
            unsetDefaultAddresses(customerId);
            
            Address addr = address.get();
            addr.setIsDefault(true);
            return addressRepository.save(addr);
        }
        
        throw new RuntimeException("Address not found or does not belong to customer");
    }
    
    private void unsetDefaultAddresses(UUID customerId) {
        List<Address> addresses = getCustomerAddresses(customerId);
        for (Address addr : addresses) {
            if (Boolean.TRUE.equals(addr.getIsDefault())) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}
