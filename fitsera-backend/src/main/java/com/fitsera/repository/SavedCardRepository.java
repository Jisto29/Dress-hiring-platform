package com.fitsera.repository;

import com.fitsera.model.SavedCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedCardRepository extends JpaRepository<SavedCard, UUID> {
    List<SavedCard> findByCustomerId(UUID customerId);
    Optional<SavedCard> findByCustomerIdAndIsDefaultTrue(UUID customerId);
    void deleteByCustomerIdAndId(UUID customerId, UUID id);
}

