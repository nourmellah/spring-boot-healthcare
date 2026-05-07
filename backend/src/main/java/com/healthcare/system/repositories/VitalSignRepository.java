package com.healthcare.system.repositories;

import com.healthcare.system.entities.VitalSign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {
    
    List<VitalSign> findByPatientId(Long patientId);
    
    @Query("SELECT v FROM VitalSign v WHERE v.patient.id = :patientId ORDER BY v.recordedAt DESC")
    List<VitalSign> findPatientVitalSignsOrderedByDate(Long patientId);
    
    @Query("SELECT v FROM VitalSign v WHERE v.patient.id = :patientId ORDER BY v.recordedAt DESC LIMIT 1")
    VitalSign findLatestVitalSignForPatient(Long patientId);
}
