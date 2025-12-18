package com.fitsera.repository;

import com.fitsera.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByBrandUserIdOrderByCreatedAtDesc(UUID brandUserId);
    long countByBrandUserIdAndReadFalse(UUID brandUserId);
}

