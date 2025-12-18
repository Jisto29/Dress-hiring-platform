package com.fitsera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_brand")
    private String productBrand;

    @Column(name = "product_image_url")
    private String productImageUrl;

    @Column(name = "size")
    private String size;

    @Column(name = "color")
    private String color;

    @Column(name = "rental_period")
    private String rentalPeriod;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "subtotal", nullable = false)
    private Double subtotal; // price * quantity

    @Column(name = "desired_delivery_date")
    private LocalDate desiredDeliveryDate;

    @Column(name = "needs_express_delivery")
    private Boolean needsExpressDelivery = false;

    // Return tracking
    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Column(name = "return_condition")
    private String returnCondition; // excellent, good, fair, poor, damaged

    @Column(name = "return_status")
    private String returnStatus = "not_returned"; // not_returned, return_requested, returned

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

