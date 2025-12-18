package com.fitsera.service;

import com.fitsera.model.Customer;
import com.fitsera.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerService {
    
    @Autowired
    private CustomerRepository customerRepository;
    
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }
    
    public Optional<Customer> getCustomerById(UUID id) {
        return customerRepository.findById(id);
    }
    
    public Optional<Customer> getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email);
    }
    
    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }
    
    public Customer updateCustomer(UUID id, Customer customerDetails) {
        Optional<Customer> optionalCustomer = customerRepository.findById(id);
        if (optionalCustomer.isPresent()) {
            Customer customer = optionalCustomer.get();
            if (customerDetails.getFullName() != null) {
                customer.setFullName(customerDetails.getFullName());
            }
            if (customerDetails.getPhone() != null) {
                customer.setPhone(customerDetails.getPhone());
            }
            if (customerDetails.getProfileImage() != null) {
                customer.setProfileImage(customerDetails.getProfileImage());
            }
            if (customerDetails.getDateOfBirth() != null) {
                customer.setDateOfBirth(customerDetails.getDateOfBirth());
            }
            if (customerDetails.getPreferredSize() != null) {
                customer.setPreferredSize(customerDetails.getPreferredSize());
            }
            if (customerDetails.getPreferredStyle() != null) {
                customer.setPreferredStyle(customerDetails.getPreferredStyle());
            }
            if (customerDetails.getLoyaltyPoints() != null) {
                customer.setLoyaltyPoints(customerDetails.getLoyaltyPoints());
            }
            if (customerDetails.getNewsletterSubscribed() != null) {
                customer.setNewsletterSubscribed(customerDetails.getNewsletterSubscribed());
            }
            return customerRepository.save(customer);
        }
        return null;
    }
    
    public void deleteCustomer(UUID id) {
        customerRepository.deleteById(id);
    }
    
    public Customer authenticate(String email, String password) {
        Optional<Customer> customer = customerRepository.findByEmail(email);
        if (customer.isPresent() && customer.get().getPassword().equals(password)) {
            // Update last login
            Customer c = customer.get();
            c.setLastLoginAt(LocalDateTime.now());
            return customerRepository.save(c);
        }
        return null;
    }
    
    public boolean existsByEmail(String email) {
        return customerRepository.existsByEmail(email);
    }
    
    public void addLoyaltyPoints(UUID customerId, Integer points) {
        Optional<Customer> optionalCustomer = customerRepository.findById(customerId);
        if (optionalCustomer.isPresent()) {
            Customer customer = optionalCustomer.get();
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + points);
            customerRepository.save(customer);
        }
    }
}

