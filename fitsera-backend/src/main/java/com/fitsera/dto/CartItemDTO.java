package com.fitsera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private UUID id;
    private UUID productId;
    private String title;
    private String name;
    private String brand;
    private String size;
    private String color;
    private String rentalPeriod;
    private Integer quantity;
    private Double price;
    private String image; // Primary image URL
    private List<String> images; // All images
    private LocalDate desiredDeliveryDate;
    private Boolean needsExpressDelivery;
}

