package com.healthcare.system.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    private String manufacturer;
    
    @Enumerated(EnumType.STRING)
    private MedicineType type; // TABLET, CAPSULE, SYRUP, INJECTION, etc.
    
    @Column(name = "stock_quantity")
    private Integer stockQuantity = 0;
    
    @Column(name = "unit_price")
    private Double unitPrice;
    
    @Column(name = "requires_prescription")
    private Boolean requiresPrescription = true;
    
    @OneToMany(mappedBy = "medicine")
    @JsonIgnore
    private List<PrescriptionMedicine> prescriptionMedicines;
    
    public enum MedicineType {
        TABLET, CAPSULE, SYRUP, INJECTION, CREAM, DROPS, INHALER, OTHER
    }
}
