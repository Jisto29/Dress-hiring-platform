package com.fitsera.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private UUID id;
    private String orderNumber;
    private String status;
    private Double subtotal;
    private Double discount;
    private Double deliveryFee;
    private Double total;
    private DeliveryAddressDTO deliveryAddress;
    private ContactInfoDTO contactInfo;
    private PaymentInfoDTO paymentInfo;
    private List<OrderItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDate estimatedDeliveryDate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryAddressDTO {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String postalCode;
        private String country;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactInfoDTO {
        private String email;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInfoDTO {
        private String method;
        private String status;
        private String cardLast4;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDTO {
        private UUID productId;
        private String productName;
        private String productBrand;
        private String productImageUrl;
        private String size;
        private String color;
        private String rentalPeriod;
        private Integer quantity;
        private Double price;
        private LocalDate desiredDeliveryDate;
        private Boolean needsExpressDelivery;
        
        // Return tracking
        private LocalDate expectedReturnDate; // Calculated: deliveryDate + rentalPeriod
        private LocalDateTime returnDate;
        private String returnCondition; // excellent, good, fair, poor, damaged
        private String returnStatus; // not_returned, return_requested, returned
    }
}

