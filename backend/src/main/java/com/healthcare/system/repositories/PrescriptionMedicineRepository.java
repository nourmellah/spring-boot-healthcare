package com.healthcare.system.repositories;

import com.healthcare.system.entities.PrescriptionMedicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionMedicineRepository extends JpaRepository<PrescriptionMedicine, Long> {
    
    List<PrescriptionMedicine> findByPrescriptionId(Long prescriptionId);
    
    List<PrescriptionMedicine> findByMedicineId(Long medicineId);
}
