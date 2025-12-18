package com.fitsera.controller;

import com.fitsera.dto.OrderDTO;
import com.fitsera.model.Order;
import com.fitsera.service.OrderService;
import com.fitsera.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, 
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody OrderDTO orderDTO) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Extract user ID from JWT
            String token = authHeader.substring(7);
            UUID customerId = jwtUtil.extractUserId(token);

            // Check for overdue returns
            if (orderService.hasOverdueReturns(customerId)) {
                response.put("success", false);
                response.put("message", "Cannot place order: You have overdue returns. Please return your items before placing a new order.");
                response.put("hasOverdueReturns", true);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Create order
            Order order = orderService.createOrder(customerId, orderDTO);
            OrderDTO responseDTO = orderService.convertToDTO(order);

            response.put("success", true);
            response.put("order", responseDTO);
            response.put("message", "Order created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to create order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/overdue-check")
    public ResponseEntity<Map<String, Object>> checkOverdueReturns(
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Extract user ID from JWT
            String token = authHeader.substring(7);
            UUID customerId = jwtUtil.extractUserId(token);

            boolean hasOverdue = orderService.hasOverdueReturns(customerId);
            
            response.put("success", true);
            response.put("hasOverdueReturns", hasOverdue);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to check overdue returns: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCustomerOrders(
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Extract user ID from JWT
            String token = authHeader.substring(7);
            UUID customerId = jwtUtil.extractUserId(token);

            // Get orders
            List<Order> orders = orderService.getCustomerOrders(customerId);
            List<OrderDTO> orderDTOs = orders.stream()
                    .map(orderService::convertToDTO)
                    .collect(Collectors.toList());

            response.put("success", true);
            response.put("orders", orderDTOs);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to fetch orders: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderById(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID orderId) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Extract user ID from JWT
            String token = authHeader.substring(7);
            UUID customerId = jwtUtil.extractUserId(token);

            // Get order
            Order order = orderService.getOrderById(orderId, customerId);
            OrderDTO orderDTO = orderService.convertToDTO(order);

            response.put("success", true);
            response.put("order", orderDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to fetch order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<Map<String, Object>> getOrderByNumber(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String orderNumber) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Get order
            Order order = orderService.getOrderByNumber(orderNumber);
            OrderDTO orderDTO = orderService.convertToDTO(order);

            response.put("success", true);
            response.put("order", orderDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to fetch order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody Map<String, String> statusUpdate) {
        Map<String, Object> response = new HashMap<>();

        try {
            String status = statusUpdate.get("status");
            Order order = orderService.updateOrderStatus(orderId, status);
            OrderDTO orderDTO = orderService.convertToDTO(order);

            response.put("success", true);
            response.put("order", orderDTO);
            response.put("message", "Order status updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update order status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByAccount(@PathVariable UUID accountId) {
        try {
            List<Order> orders = orderService.getOrdersByAccountId(accountId);
            List<OrderDTO> orderDTOs = orders.stream()
                    .map(orderService::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(orderDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{orderId}/items/{productId}/return")
    public ResponseEntity<Map<String, Object>> processItemReturn(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID orderId,
            @PathVariable UUID productId,
            @RequestBody Map<String, String> returnData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String token = authHeader.replace("Bearer ", "");
            UUID customerId = jwtUtil.extractUserId(token);
            
            String condition = returnData.get("condition");
            orderService.processItemReturn(orderId, productId, condition);
            
            // Fetch updated order with customer verification
            Order order = orderService.getOrderById(orderId, customerId);
            OrderDTO orderDTO = orderService.convertToDTO(order);

            response.put("success", true);
            response.put("order", orderDTO);
            response.put("message", "Return submitted successfully. Awaiting admin confirmation.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to process return: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PatchMapping("/admin/{orderId}/items/{productId}/return/process")
    public ResponseEntity<Map<String, Object>> adminProcessReturn(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID orderId,
            @PathVariable UUID productId,
            @RequestBody Map<String, Boolean> requestData) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Verify admin role from token
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.isAdminToken(token)) {
                response.put("success", false);
                response.put("message", "Unauthorized: Admin access required");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            Boolean approved = requestData.get("approved");
            if (approved == null) {
                response.put("success", false);
                response.put("message", "Missing 'approved' field");
                return ResponseEntity.badRequest().body(response);
            }
            
            orderService.adminProcessReturn(orderId, productId, approved);
            
            // Fetch updated order
            Order order = orderService.getOrderByIdAdmin(orderId);
            OrderDTO orderDTO = orderService.convertToDTO(order);

            response.put("success", true);
            response.put("order", orderDTO);
            response.put("message", approved ? "Return approved successfully" : "Return rejected - marked as not returned");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to process return: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
