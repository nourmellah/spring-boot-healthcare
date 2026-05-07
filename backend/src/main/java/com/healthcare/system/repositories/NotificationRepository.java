package com.healthcare.system.repositories;

import com.healthcare.system.entities.Notification;
import com.healthcare.system.entities.Notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserId(Long userId);
    
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
    
    List<Notification> findByUserIdAndType(Long userId, NotificationType type);
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    
    Long countByUserIdAndIsReadFalse(Long userId);
    
    default List<Notification> findUserNotificationsOrderedByDate(Long userId) {
        return findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    default Long countUnreadNotifications(Long userId) {
        return countByUserIdAndIsReadFalse(userId);
    }
}
