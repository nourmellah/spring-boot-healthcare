package com.healthcare.system.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_signs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VitalSign {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
    
    @Column(name = "blood_pressure")
    private String bloodPressure; // e.g., "120/80"
    
    @Column(name = "heart_rate")
    private Integer heartRate; // beats per minute
    
    @Column(name = "temperature")
    private Double temperature; // in Celsius
    
    @Column(name = "weight")
    private Double weight; // in kg
    
    @Column(name = "height")
    private Double height; // in cm
    
    @Column(name = "oxygen_saturation")
    private Integer oxygenSaturation; // SpO2 percentage
    
    @Column(name = "respiratory_rate")
    private Integer respiratoryRate; // breaths per minute
    
    @Column(length = 500)
    private String notes;
    
    @Column(name = "recorded_by")
    private Long recordedBy; // User ID who recorded (doctor/nurse)
}
