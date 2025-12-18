package com.fitsera.repository;

import com.fitsera.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByProductId(UUID productId);
    List<Review> findByAccountId(UUID accountId);
    List<Review> findByOrderId(UUID orderId);
    boolean existsByOrderId(UUID orderId);
}

