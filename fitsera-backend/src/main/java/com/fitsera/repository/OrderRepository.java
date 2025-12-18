package com.fitsera.repository;

import com.fitsera.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByIdAndCustomerId(UUID id, UUID customerId);
    
    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi JOIN Product p ON oi.productId = p.id WHERE p.accountId = :accountId ORDER BY o.createdAt DESC")
    List<Order> findOrdersByAccountId(@Param("accountId") UUID accountId);
}
