package com.fitsera.dto;

public class BrandSignupRequest {
    // Admin details
    private String adminName;
    private String email;
    private String password;
    
    // Brand details
    private String brandName;
    private String brandLogo;
    
    // Getters and Setters
    public String getAdminName() {
        return adminName;
    }
    
    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getBrandName() {
        return brandName;
    }
    
    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }
    
    public String getBrandLogo() {
        return brandLogo;
    }
    
    public void setBrandLogo(String brandLogo) {
        this.brandLogo = brandLogo;
    }
}

