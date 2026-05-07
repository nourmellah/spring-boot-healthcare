package com.healthcare.system.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "user_id")
public class Doctor extends User {
    
    @Column(unique = true, nullable = false)
    private String licenseNumber;
    
    @ManyToOne
    @JoinColumn(name = "specialty_id")
    private Specialty specialty;
    
    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;
    
    @Column(length = 1000)
    private String qualifications;
    
    @Column(name = "consultation_fee")
    private Double consultationFee;
    
    @Column(name = "available_days")
    private String availableDays; // e.g., "MON,TUE,WED,THU,FRI"
    
    @Column(name = "available_hours")
    private String availableHours; // e.g., "09:00-17:00"
    
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<Appointment> appointments;
    
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<Prescription> prescriptions;
    
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<ConsultationNote> consultationNotes;
}
