package com.fitsera.service;

import com.fitsera.model.Review;
import com.fitsera.model.Product;
import com.fitsera.repository.ReviewRepository;
import com.fitsera.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
    
    public Optional<Review> getReviewById(UUID id) {
        return reviewRepository.findById(id);
    }
    
    public List<Review> getReviewsByProductId(UUID productId) {
        return reviewRepository.findByProductId(productId);
    }
    
    public List<Review> getReviewsByAccountId(UUID accountId) {
        return reviewRepository.findByAccountId(accountId);
    }
    
    public boolean hasReviewedOrder(UUID orderId) {
        return reviewRepository.existsByOrderId(orderId);
    }
    
    public Review saveReview(Review review) {
        // Automatically set accountId from the product if not already set
        if (review.getAccountId() == null && review.getProductId() != null) {
            Optional<Product> product = productRepository.findById(review.getProductId());
            if (product.isPresent()) {
                review.setAccountId(product.get().getAccountId());
                System.out.println("✅ Set accountId for review: " + product.get().getAccountId());
            } else {
                System.err.println("⚠️ Product not found for review, productId: " + review.getProductId());
            }
        }
        return reviewRepository.save(review);
    }
    
    public void deleteReview(UUID id) {
        reviewRepository.deleteById(id);
    }
}

