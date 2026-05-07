package com.healthcare.system.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId; // Recipient user ID
    
    @Column(nullable = false)
    private String title;
    
    @Column(length = 1000, nullable = false)
    private String message;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 50, columnDefinition = "varchar(50)")
    private NotificationType type;
    
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "related_entity")
    private String relatedEntity; // e.g., "Appointment", "Prescription"
    
    @Column(name = "related_entity_id")
    private Long relatedEntityId;
    
    public enum NotificationType {
        APPOINTMENT_CONFIRMED,
        APPOINTMENT_CANCELLED,
        APPOINTMENT_REMINDER,
        PRESCRIPTION_CREATED,
        LAB_RESULT_AVAILABLE,
        EMERGENCY_ALERT,
        GENERAL
    }
}
