package com.healthcare.system.services;

import com.healthcare.system.entities.Notification;
import com.healthcare.system.entities.Notification.NotificationType;
import com.healthcare.system.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Transactional
    public Notification createNotification(Long userId, String title, String message, NotificationType type, String relatedEntity, Long relatedEntityId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedEntity(relatedEntity);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }
    
    public void sendAppointmentNotification(Long userId, String title, String message, Long appointmentId) {
        createNotification(userId, title, message, NotificationType.APPOINTMENT_CONFIRMED, "Appointment", appointmentId);
    }
    
    public void sendPrescriptionNotification(Long userId, String title, String message, Long prescriptionId) {
        createNotification(userId, title, message, NotificationType.PRESCRIPTION_CREATED, "Prescription", prescriptionId);
    }
    
    public void sendLabResultNotification(Long userId, String title, String message, Long labResultId) {
        createNotification(userId, title, message, NotificationType.LAB_RESULT_AVAILABLE, "LabResult", labResultId);
    }
    
    public void sendEmergencyNotification(Long userId, String title, String message, Long emergencyId) {
        createNotification(userId, title, message, NotificationType.EMERGENCY_ALERT, "EmergencyAlert", emergencyId);
    }
    
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }
    
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        markNotificationAsRead(notification);
    }
    
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        markNotificationAsRead(notification);
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId);
        for (Notification notification : unreadNotifications) {
            markNotificationAsRead(notification);
        }
    }
    
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    private void markNotificationAsRead(Notification notification) {
        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }
}
