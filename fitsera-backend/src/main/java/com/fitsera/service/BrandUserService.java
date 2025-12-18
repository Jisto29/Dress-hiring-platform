package com.fitsera.service;

import com.fitsera.dto.BrandSignupRequest;
import com.fitsera.model.Account;
import com.fitsera.model.BrandUser;
import com.fitsera.repository.AccountRepository;
import com.fitsera.repository.BrandUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BrandUserService {
    
    @Autowired
    private BrandUserRepository brandUserRepository;
    
    @Autowired
    private AccountRepository accountRepository;
    
    public List<BrandUser> getAllBrandUsers() {
        return brandUserRepository.findAll();
    }
    
    public Optional<BrandUser> getBrandUserById(UUID id) {
        return brandUserRepository.findById(id);
    }
    
    public Optional<BrandUser> getBrandUserByEmail(String email) {
        return brandUserRepository.findByEmail(email);
    }
    
    public List<BrandUser> getBrandUsersByAccountId(UUID accountId) {
        return brandUserRepository.findByAccountId(accountId);
    }
    
    public BrandUser createBrandUser(BrandUser brandUser) {
        if (brandUserRepository.existsByEmail(brandUser.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        // In production, hash the password here using BCrypt
        return brandUserRepository.save(brandUser);
    }
    
    @Transactional
    public BrandUser signupBrandWithAdmin(BrandSignupRequest signupRequest) {
        // Check if email already exists
        if (brandUserRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("This email is already registered. Please use a different email or login.");
        }
        
        // Create a URL-friendly slug from brand name
        String slug = signupRequest.getBrandName()
            .toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")  // Remove special characters
            .replaceAll("\\s+", "-")           // Replace spaces with hyphens
            .replaceAll("-+", "-")             // Replace multiple hyphens with single
            .trim();
        
        // Check if brand name or slug already exists
        if (accountRepository.existsByName(signupRequest.getBrandName())) {
            throw new RuntimeException("This brand name is already taken. Please choose a different brand name.");
        }
        
        if (accountRepository.existsBySlug(slug)) {
            throw new RuntimeException("This brand name is already taken. Please choose a different brand name.");
        }
        
        try {
            // Create the brand account (Account)
            Account account = new Account();
            account.setName(signupRequest.getBrandName());
            account.setSlug(slug);
            account.setBrandLogo(signupRequest.getBrandLogo());
            Account savedAccount = accountRepository.save(account);
            
            // Create the brand admin user (BrandUser)
            BrandUser brandUser = new BrandUser();
            brandUser.setAccountId(savedAccount.getId());
            brandUser.setEmail(signupRequest.getEmail());
            brandUser.setFullName(signupRequest.getAdminName());
            brandUser.setPassword(signupRequest.getPassword()); // In production, hash this
            brandUser.setRole(BrandUser.UserRole.OWNER); // First user is the owner
            
            return brandUserRepository.save(brandUser);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Fallback in case of any database constraint violation
            if (e.getMessage().contains("accounts_slug_key")) {
                throw new RuntimeException("This brand name is already taken. Please choose a different brand name.");
            } else if (e.getMessage().contains("users_email_key")) {
                throw new RuntimeException("This email is already registered. Please use a different email or login.");
            } else {
                throw new RuntimeException("Unable to create brand account. Please try again or contact support.");
            }
        }
    }
    
    public BrandUser authenticate(String email, String password) {
        Optional<BrandUser> userOpt = brandUserRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            BrandUser user = userOpt.get();
            // In production, use BCrypt to compare hashed passwords
            if (user.getPassword().equals(password)) {
                return user;
            }
        }
        return null;
    }
    
    public BrandUser updateBrandUser(UUID id, BrandUser brandUserDetails) {
        return brandUserRepository.findById(id)
            .map(existingUser -> {
                if (brandUserDetails.getFullName() != null) {
                    existingUser.setFullName(brandUserDetails.getFullName());
                }
                if (brandUserDetails.getEmail() != null && !brandUserDetails.getEmail().equals(existingUser.getEmail())) {
                    if (brandUserRepository.existsByEmail(brandUserDetails.getEmail())) {
                        throw new RuntimeException("Email already exists");
                    }
                    existingUser.setEmail(brandUserDetails.getEmail());
                }
                if (brandUserDetails.getPassword() != null) {
                    // In production, hash the password using BCrypt
                    existingUser.setPassword(brandUserDetails.getPassword());
                }
                if (brandUserDetails.getRole() != null) {
                    existingUser.setRole(brandUserDetails.getRole());
                }
                return brandUserRepository.save(existingUser);
            })
            .orElseThrow(() -> new RuntimeException("Brand user not found with id: " + id));
    }
    
    public void deleteBrandUser(UUID id) {
        brandUserRepository.deleteById(id);
    }
}

