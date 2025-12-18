package com.fitsera.repository;

import com.fitsera.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByOccasion(String occasion);
    
    // Using Spring's automatic query derivation instead of @Query
    List<Product> findByAccountId(UUID accountId);
    
    List<Product> findByAccountIdAndArchivedFalse(UUID accountId);
    List<Product> findByBrand(String brand);
    
}


