package com.healthcare.system.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor; // Doctor assigned to handle emergency
    
    @Column(length = 2000, nullable = false)
    private String description; // Emergency description
    
    @Column(nullable = false)
    private String location; // Patient's current location
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmergencyStatus status = EmergencyStatus.ACTIVE;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmergencySeverity severity = EmergencySeverity.MEDIUM;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(length = 1000)
    private String resolution; // How the emergency was resolved
    
    public enum EmergencyStatus {
        ACTIVE, IN_PROGRESS, RESOLVED, CANCELLED
    }
    
    public enum EmergencySeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
