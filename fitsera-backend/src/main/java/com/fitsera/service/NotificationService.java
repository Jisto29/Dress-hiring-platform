package com.fitsera.service;

import com.fitsera.model.Notification;
import com.fitsera.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<Notification> getNotificationsByBrandUserId(UUID brandUserId) {
        return notificationRepository.findByBrandUserIdOrderByCreatedAtDesc(brandUserId);
    }

    public Optional<Notification> getNotificationById(UUID id) {
        return notificationRepository.findById(id);
    }

    public long getUnreadCount(UUID brandUserId) {
        return notificationRepository.countByBrandUserIdAndReadFalse(brandUserId);
    }

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    public Notification markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(UUID brandUserId) {
        List<Notification> notifications = notificationRepository.findByBrandUserIdOrderByCreatedAtDesc(brandUserId);
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        }
    }

    public void deleteNotification(UUID id) {
        notificationRepository.deleteById(id);
    }
}

