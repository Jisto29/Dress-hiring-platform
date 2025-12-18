package com.fitsera.repository;

import com.fitsera.model.BrandUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandUserRepository extends JpaRepository<BrandUser, UUID> {
    Optional<BrandUser> findByEmail(String email);
    List<BrandUser> findByAccountId(UUID accountId);
    boolean existsByEmail(String email);
}

