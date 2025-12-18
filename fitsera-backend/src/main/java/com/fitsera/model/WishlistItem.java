package com.fitsera.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wishlist_items")
public class WishlistItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    @Column(name = "product_id", nullable = false)
    private UUID productId;
    
    @Column(name = "product_title")
    private String productTitle;
    
    @Column(name = "product_image")
    private String productImage;
    
    @Column(name = "product_price")
    private Double productPrice;
    
    @Column(name = "product_brand")
    private String productBrand;
    
    @Column(name = "account_id")
    private UUID accountId; // Which brand/account this product belongs to
    
    // Optional: Save specific preferences
    @Column(name = "preferred_size")
    private String preferredSize;
    
    @Column(name = "preferred_color")
    private String preferredColor;
    
    @Column(name = "notes")
    private String notes; // Customer notes about the item
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public Customer getCustomer() {
        return customer;
    }
    
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
    
    public UUID getProductId() {
        return productId;
    }
    
    public void setProductId(UUID productId) {
        this.productId = productId;
    }
    
    public String getProductTitle() {
        return productTitle;
    }
    
    public void setProductTitle(String productTitle) {
        this.productTitle = productTitle;
    }
    
    public String getProductImage() {
        return productImage;
    }
    
    public void setProductImage(String productImage) {
        this.productImage = productImage;
    }
    
    public Double getProductPrice() {
        return productPrice;
    }
    
    public void setProductPrice(Double productPrice) {
        this.productPrice = productPrice;
    }
    
    public String getProductBrand() {
        return productBrand;
    }
    
    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }
    
    public UUID getAccountId() {
        return accountId;
    }
    
    public void setAccountId(UUID accountId) {
        this.accountId = accountId;
    }
    
    public String getPreferredSize() {
        return preferredSize;
    }
    
    public void setPreferredSize(String preferredSize) {
        this.preferredSize = preferredSize;
    }
    
    public String getPreferredColor() {
        return preferredColor;
    }
    
    public void setPreferredColor(String preferredColor) {
        this.preferredColor = preferredColor;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

