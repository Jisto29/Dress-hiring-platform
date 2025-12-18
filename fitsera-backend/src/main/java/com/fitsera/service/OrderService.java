package com.fitsera.service;

import com.fitsera.dto.OrderDTO;
import com.fitsera.model.Order;
import com.fitsera.model.OrderItem;
import com.fitsera.model.Payment;
import com.fitsera.repository.OrderRepository;
import com.fitsera.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductService productService;

    @Transactional
    public Order createOrder(UUID customerId, OrderDTO orderDTO) {
        // Create order entity
        Order order = new Order();
        order.setCustomerId(customerId);
        order.setOrderNumber(Order.generateOrderNumber());
        order.setStatus("pending");
        order.setSubtotal(orderDTO.getSubtotal());
        order.setDiscount(orderDTO.getDiscount());
        order.setDeliveryFee(orderDTO.getDeliveryFee());
        order.setTotal(orderDTO.getTotal());

        // Set delivery address
        if (orderDTO.getDeliveryAddress() != null) {
            order.setDeliveryLine1(orderDTO.getDeliveryAddress().getLine1());
            order.setDeliveryLine2(orderDTO.getDeliveryAddress().getLine2());
            order.setDeliveryCity(orderDTO.getDeliveryAddress().getCity());
            order.setDeliveryState(orderDTO.getDeliveryAddress().getState());
            order.setDeliveryPostalCode(orderDTO.getDeliveryAddress().getPostalCode());
            order.setDeliveryCountry(orderDTO.getDeliveryAddress().getCountry());
        }

        // Set contact info
        if (orderDTO.getContactInfo() != null) {
            order.setContactEmail(orderDTO.getContactInfo().getEmail());
            order.setContactPhone(orderDTO.getContactInfo().getPhone());
        }

        // Save order first to get ID
        order = orderRepository.save(order);

        // Create payment record
        if (orderDTO.getPaymentInfo() != null) {
            Payment payment = new Payment();
            payment.setOrderId(order.getId());
            payment.setPaymentMethod(orderDTO.getPaymentInfo().getMethod() != null ? 
                orderDTO.getPaymentInfo().getMethod() : "card");
            payment.setPaymentStatus("pending");
            payment.setCardLast4(orderDTO.getPaymentInfo().getCardLast4());
            payment.setAmount(orderDTO.getTotal());
            paymentRepository.save(payment);
        }

        // Create order items and track earliest delivery date
        LocalDate earliestDeliveryDate = null;
        if (orderDTO.getItems() != null) {
            for (OrderDTO.OrderItemDTO itemDTO : orderDTO.getItems()) {
                // Check stock availability before creating order item
                if (!productService.isStockAvailable(itemDTO.getProductId(), itemDTO.getQuantity())) {
                    throw new RuntimeException("Insufficient stock for product: " + itemDTO.getProductName());
                }
                
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProductId(itemDTO.getProductId());
                item.setProductName(itemDTO.getProductName());
                item.setProductBrand(itemDTO.getProductBrand());
                item.setProductImageUrl(itemDTO.getProductImageUrl());
                item.setSize(itemDTO.getSize());
                item.setColor(itemDTO.getColor());
                item.setRentalPeriod(itemDTO.getRentalPeriod());
                item.setQuantity(itemDTO.getQuantity());
                item.setPrice(itemDTO.getPrice());
                item.setSubtotal(itemDTO.getPrice() * itemDTO.getQuantity());
                item.setDesiredDeliveryDate(itemDTO.getDesiredDeliveryDate());
                item.setNeedsExpressDelivery(itemDTO.getNeedsExpressDelivery() != null ? itemDTO.getNeedsExpressDelivery() : false);

                order.addItem(item);
                
                // Reduce stock for this product
                productService.reduceStock(itemDTO.getProductId(), itemDTO.getQuantity());
                
                // Track earliest delivery date
                if (itemDTO.getDesiredDeliveryDate() != null) {
                    if (earliestDeliveryDate == null || itemDTO.getDesiredDeliveryDate().isBefore(earliestDeliveryDate)) {
                        earliestDeliveryDate = itemDTO.getDesiredDeliveryDate();
                    }
                }
            }
        }
        
        // Set estimated delivery date on order (earliest desired delivery date from all items)
        order.setEstimatedDeliveryDate(earliestDeliveryDate);

        // Save order with items
        return orderRepository.save(order);
    }

    public List<Order> getCustomerOrders(UUID customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public Order getOrderById(UUID orderId, UUID customerId) {
        return orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public Order getOrderByIdAdmin(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public Order getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> getOrdersByAccountId(UUID accountId) {
        return orderRepository.findOrdersByAccountId(accountId);
    }

    @Transactional
    public Order updateOrderStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(status);
        
        // Update timestamps and payment status based on status
        if ("paid".equals(status)) {
            // Update payment record
            paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
                payment.setPaymentStatus("paid");
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
            });
        } else if ("shipped".equals(status)) {
            order.setShippedAt(LocalDateTime.now());
        } else if ("delivered".equals(status)) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        
        return orderRepository.save(order);
    }

    @Transactional
    public OrderItem processItemReturn(UUID orderId, UUID productId, String condition) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Find the specific item
        OrderItem item = order.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in order"));
        
        // Update item return info - set status to "return_submitted" for admin review
        item.setReturnDate(LocalDateTime.now());
        item.setReturnCondition(condition);
        item.setReturnStatus("return_submitted");
        
        // Stock will be restored only after admin confirms the return
        
        // Check if all items are returned
        boolean allItemsReturned = order.getItems().stream()
                .allMatch(i -> "returned".equals(i.getReturnStatus()));
        
        // If all items returned, mark order as returned
        if (allItemsReturned) {
            order.setStatus("returned");
        }
        
        orderRepository.save(order);
        return item;
    }

    @Transactional
    public OrderItem adminProcessReturn(UUID orderId, UUID productId, boolean approved) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Find the specific item
        OrderItem item = order.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in order"));
        
        if (approved) {
            // Admin confirms the item was returned
            item.setReturnStatus("returned");
            
            // Restore stock for returned items
            productService.restoreStock(item.getProductId(), item.getQuantity());
        } else {
            // Admin marks that item was not returned
            item.setReturnStatus("not_returned");
        }
        
        // Check if all items are returned
        boolean allItemsReturned = order.getItems().stream()
                .allMatch(i -> "returned".equals(i.getReturnStatus()));
        
        // If all items returned, mark order as returned
        if (allItemsReturned) {
            order.setStatus("returned");
        }
        
        orderRepository.save(order);
        return item;
    }

    // Convert Order to DTO for response
    public OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setStatus(order.getStatus());
        dto.setSubtotal(order.getSubtotal());
        dto.setDiscount(order.getDiscount());
        dto.setDeliveryFee(order.getDeliveryFee());
        dto.setTotal(order.getTotal());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setShippedAt(order.getShippedAt());
        dto.setDeliveredAt(order.getDeliveredAt());
        dto.setEstimatedDeliveryDate(order.getEstimatedDeliveryDate());

        // Delivery address
        OrderDTO.DeliveryAddressDTO addressDTO = new OrderDTO.DeliveryAddressDTO();
        addressDTO.setLine1(order.getDeliveryLine1());
        addressDTO.setLine2(order.getDeliveryLine2());
        addressDTO.setCity(order.getDeliveryCity());
        addressDTO.setState(order.getDeliveryState());
        addressDTO.setPostalCode(order.getDeliveryPostalCode());
        addressDTO.setCountry(order.getDeliveryCountry());
        dto.setDeliveryAddress(addressDTO);

        // Contact info
        OrderDTO.ContactInfoDTO contactDTO = new OrderDTO.ContactInfoDTO();
        contactDTO.setEmail(order.getContactEmail());
        contactDTO.setPhone(order.getContactPhone());
        dto.setContactInfo(contactDTO);

        // Payment info - fetch from payments table
        OrderDTO.PaymentInfoDTO paymentDTO = new OrderDTO.PaymentInfoDTO();
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            paymentDTO.setMethod(payment.getPaymentMethod());
            paymentDTO.setStatus(payment.getPaymentStatus());
            paymentDTO.setCardLast4(payment.getCardLast4());
            dto.setPaidAt(payment.getPaidAt());
        });
        dto.setPaymentInfo(paymentDTO);

        // Items
        if (order.getItems() != null) {
            List<OrderDTO.OrderItemDTO> itemDTOs = order.getItems().stream()
                    .map(item -> {
                        OrderDTO.OrderItemDTO itemDTO = new OrderDTO.OrderItemDTO();
                        itemDTO.setProductId(item.getProductId());
                        itemDTO.setProductName(item.getProductName());
                        itemDTO.setProductBrand(item.getProductBrand());
                        itemDTO.setProductImageUrl(item.getProductImageUrl());
                        itemDTO.setSize(item.getSize());
                        itemDTO.setColor(item.getColor());
                        itemDTO.setRentalPeriod(item.getRentalPeriod());
                        itemDTO.setQuantity(item.getQuantity());
                        itemDTO.setPrice(item.getPrice());
                        itemDTO.setDesiredDeliveryDate(item.getDesiredDeliveryDate());
                        itemDTO.setNeedsExpressDelivery(item.getNeedsExpressDelivery());
                        
                        // Calculate expected return date: deliveryDate + rentalPeriod
                        if (order.getDeliveredAt() != null && item.getRentalPeriod() != null) {
                            int rentalDays = parseRentalPeriodDays(item.getRentalPeriod());
                            LocalDate deliveryDate = order.getDeliveredAt().toLocalDate();
                            itemDTO.setExpectedReturnDate(deliveryDate.plusDays(rentalDays));
                        }
                        
                        // Return tracking
                        itemDTO.setReturnDate(item.getReturnDate());
                        itemDTO.setReturnCondition(item.getReturnCondition());
                        itemDTO.setReturnStatus(item.getReturnStatus());
                        
                        return itemDTO;
                    })
                    .collect(Collectors.toList());
            dto.setItems(itemDTOs);
        }

        return dto;
    }

    // Helper method to parse rental period string (e.g., "1 week" -> 7, "2 week" -> 14, "3 days" -> 3)
    private int parseRentalPeriodDays(String rentalPeriod) {
        if (rentalPeriod == null) {
            return 0;
        }
        try {
            // Extract number and unit from strings like "1 week", "2 week", "3 days", etc.
            String[] parts = rentalPeriod.trim().toLowerCase().split("\\s+");
            if (parts.length > 0) {
                int number = Integer.parseInt(parts[0]);
                
                // Check if it's weeks or days
                if (parts.length > 1 && parts[1].startsWith("week")) {
                    // Convert weeks to days (1 week = 7 days)
                    return number * 7;
                }
                
                // Default to days
                return number;
            }
        } catch (NumberFormatException e) {
            System.err.println("Failed to parse rental period: " + rentalPeriod);
        }
        return 0;
    }

    // Check if a customer has overdue returns
    public boolean hasOverdueReturns(UUID customerId) {
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        LocalDate today = LocalDate.now();
        
        for (Order order : orders) {
            // Only check delivered orders
            if (order.getDeliveredAt() != null && order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    // Skip items that are already returned
                    if ("returned".equals(item.getReturnStatus())) {
                        continue;
                    }
                    
                    // Calculate expected return date
                    int rentalDays = parseRentalPeriodDays(item.getRentalPeriod());
                    LocalDate deliveryDate = order.getDeliveredAt().toLocalDate();
                    LocalDate expectedReturnDate = deliveryDate.plusDays(rentalDays);
                    
                    // Check if return is overdue
                    if (today.isAfter(expectedReturnDate)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}
