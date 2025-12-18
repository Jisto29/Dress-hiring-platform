package com.fitsera.repository;

import com.fitsera.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, UUID> {
    List<PaymentMethod> findByCustomerId(UUID customerId);
    Optional<PaymentMethod> findByCustomerIdAndIsDefault(UUID customerId, Boolean isDefault);
}

