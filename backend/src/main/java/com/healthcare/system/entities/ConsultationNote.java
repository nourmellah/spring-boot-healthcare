package com.healthcare.system.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationNote {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;
    
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;
    
    @Column(length = 2000, nullable = false)
    private String chiefComplaint; // Main reason for visit
    
    @Column(length = 2000)
    private String symptoms; // Patient symptoms
    
    @Column(length = 2000)
    private String examination; // Physical examination findings
    
    @Column(length = 2000)
    private String diagnosis; // Medical diagnosis
    
    @Column(length = 2000)
    private String treatment; // Treatment plan
    
    @Column(length = 1000)
    private String followUp; // Follow-up instructions
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
