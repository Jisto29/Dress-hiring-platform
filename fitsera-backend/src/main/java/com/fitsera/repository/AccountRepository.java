package com.fitsera.repository;

import com.fitsera.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findBySlug(String slug);
    Optional<Account> findByName(String name);
    boolean existsBySlug(String slug);
    boolean existsByName(String name);
}

