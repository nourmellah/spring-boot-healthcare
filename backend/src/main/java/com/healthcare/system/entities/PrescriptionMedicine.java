package com.healthcare.system.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionMedicine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "prescription_id", nullable = false)
    @JsonIgnore
    private Prescription prescription;
    
    @ManyToOne
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;
    
    @Column(nullable = false)
    private String dosage; // e.g., "500mg", "10ml"
    
    @Column(nullable = false)
    private String frequency; // e.g., "Twice daily", "Every 8 hours"
    
    @Column(nullable = false)
    private Integer duration; // Duration in days
    
    @Column(length = 500)
    private String instructions; // e.g., "Take after meals", "Take with water"
    
    @Column(nullable = false)
    private Integer quantity; // Total quantity prescribed
}
