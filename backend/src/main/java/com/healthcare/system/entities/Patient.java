package com.healthcare.system.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "user_id")
public class Patient extends User {
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    @Column(length = 500)
    private String address;
    
    @Column(name = "blood_group")
    private String bloodGroup; // A+, B+, O+, AB+, etc.
    
    @Column(name = "emergency_contact")
    private String emergencyContact;
    
    @Column(name = "emergency_contact_name")
    private String emergencyContactName;
    
    @Column(name = "medical_history", length = 2000)
    private String medicalHistory; // Allergies, chronic diseases, etc.
    
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<Appointment> appointments;
    
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<Prescription> prescriptions;
    
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<LabResult> labResults;
    
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<EmergencyAlert> emergencyAlerts;
    
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonIgnore  // Prevent infinite recursion
    private List<VitalSign> vitalSigns;
    
    public enum Gender {
        MALE, FEMALE, OTHER
    }
}
