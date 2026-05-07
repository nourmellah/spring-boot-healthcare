package com.healthcare.system.repositories;

import com.healthcare.system.entities.LabResult;
import com.healthcare.system.entities.LabResult.LabStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LabResultRepository extends JpaRepository<LabResult, Long> {
    
    List<LabResult> findByPatientId(Long patientId);
    
    List<LabResult> findByDoctorId(Long doctorId);
    
    List<LabResult> findByStatus(LabStatus status);
    
    List<LabResult> findByUploadedByOrderByCreatedAtDesc(Long uploadedBy);
    
    List<LabResult> findByPatientIdAndStatus(Long patientId, LabStatus status);
    
    @Query("SELECT l FROM LabResult l WHERE l.patient.id = :patientId ORDER BY l.testDate DESC")
    List<LabResult> findPatientLabResultsOrderedByDate(Long patientId);
}
