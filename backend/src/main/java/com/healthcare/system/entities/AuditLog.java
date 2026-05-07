package com.healthcare.system.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId; // Who performed the action
    
    @Column(name = "user_role", nullable = false)
    private String userRole; // PATIENT, DOCTOR, ADMIN, etc.
    
    @Column(nullable = false)
    private String action; // CREATE, READ, UPDATE, DELETE
    
    @Column(nullable = false)
    private String entity; // Patient, Prescription, Appointment, etc.
    
    @Column(name = "entity_id")
    private Long entityId; // ID of the affected entity
    
    @Column(length = 2000)
    private String details; // Additional details about the action
    
    @Column(name = "ip_address")
    private String ipAddress; // User's IP address
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
