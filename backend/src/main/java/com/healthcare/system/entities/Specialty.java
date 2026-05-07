package com.healthcare.system.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "specialties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Specialty {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name; // Cardiology, Neurology, Pediatrics, etc.
    
    @Column(length = 1000)
    private String description;
    
    @OneToMany(mappedBy = "specialty")
    @JsonIgnore  // Prevent infinite recursion
    private List<Doctor> doctors;
}
