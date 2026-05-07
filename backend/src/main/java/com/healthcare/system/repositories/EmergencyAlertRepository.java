package com.healthcare.system.repositories;

import com.healthcare.system.entities.EmergencyAlert;
import com.healthcare.system.entities.EmergencyAlert.EmergencyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {
    
    List<EmergencyAlert> findByPatientId(Long patientId);
    
    List<EmergencyAlert> findByDoctorId(Long doctorId);
    
    List<EmergencyAlert> findByStatus(EmergencyStatus status);
    
    @Query("SELECT e FROM EmergencyAlert e WHERE e.status = 'ACTIVE' ORDER BY e.severity DESC, e.createdAt DESC")
    List<EmergencyAlert> findActiveEmergenciesOrderedBySeverity();
    
    @Query("SELECT COUNT(e) FROM EmergencyAlert e WHERE e.status = 'ACTIVE'")
    Long countActiveEmergencies();
}
