package com.healthcare.system.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LabResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor; // Doctor who requested the test
    
    @Column(name = "test_name", nullable = false)
    private String testName; // e.g., "Blood Test", "X-Ray", "MRI"
    
    @Column(name = "test_date", nullable = false)
    private LocalDate testDate;
    
    @Column(length = 2000)
    private String results; // Test results/findings
    
    @Column(length = 1000)
    private String remarks; // Lab technician remarks
    
    @Column(name = "file_path")
    private String filePath; // Path to uploaded PDF/image
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LabStatus status = LabStatus.PENDING;
    
    @Column(name = "uploaded_by")
    private Long uploadedBy; // Lab technician user ID
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum LabStatus {
        PENDING, COMPLETED, REVIEWED
    }
}
