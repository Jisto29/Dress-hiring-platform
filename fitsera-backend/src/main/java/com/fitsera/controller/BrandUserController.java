package com.fitsera.controller;

import com.fitsera.dto.BrandSignupRequest;
import com.fitsera.model.BrandUser;
import com.fitsera.service.BrandUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/brand-users")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class BrandUserController {
    
    @Autowired
    private BrandUserService brandUserService;

    @GetMapping("/me")
    public ResponseEntity<BrandUser> getCurrentBrandUser(HttpSession session) {
        // Check if user is logged in via session
        UUID brandUserId = (UUID) session.getAttribute("brandUserId");
        
        if (brandUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        return brandUserService.getBrandUserById(brandUserId)
                .map(user -> {
                    // Don't send password to frontend
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @GetMapping
    public List<BrandUser> getAllBrandUsers() {
        return brandUserService.getAllBrandUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrandUser> getBrandUserById(@PathVariable UUID id) {
        return brandUserService.getBrandUserById(id)
                .map(user -> {
                    // Don't send password to frontend
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<BrandUser>> getBrandUsersByAccountId(@PathVariable UUID accountId) {
        List<BrandUser> users = brandUserService.getBrandUsersByAccountId(accountId);
        // Don't send passwords to frontend
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody BrandSignupRequest signupRequest, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validate input
            if (signupRequest.getEmail() == null || signupRequest.getEmail().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            if (signupRequest.getPassword() == null || signupRequest.getPassword().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Password is required");
                return ResponseEntity.badRequest().body(response);
            }
            if (signupRequest.getAdminName() == null || signupRequest.getAdminName().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Admin name is required");
                return ResponseEntity.badRequest().body(response);
            }
            if (signupRequest.getBrandName() == null || signupRequest.getBrandName().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Brand name is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            BrandUser createdUser = brandUserService.signupBrandWithAdmin(signupRequest);
            
            // Store user ID in session (auto-login after signup)
            session.setAttribute("brandUserId", createdUser.getId());
            
            // Don't send password back to frontend
            createdUser.setPassword(null);
            response.put("success", true);
            response.put("user", createdUser);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        String email = credentials.get("email");
        String password = credentials.get("password");

        BrandUser user = brandUserService.authenticate(email, password);
        if (user != null) {
            // Store user ID in session
            session.setAttribute("brandUserId", user.getId());
            
            // Don't send password back to frontend
            user.setPassword(null);
            response.put("success", true);
            response.put("user", user);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        // Invalidate the session
        session.invalidate();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandUser> updateBrandUser(@PathVariable UUID id, @RequestBody BrandUser brandUserDetails) {
        try {
            BrandUser updatedUser = brandUserService.updateBrandUser(id, brandUserDetails);
            // Don't send password back to frontend
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBrandUser(@PathVariable UUID id) {
        try {
            brandUserService.deleteBrandUser(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

