package com.healthcare.system.services;

import com.healthcare.system.entities.EmergencyAlert;
import com.healthcare.system.entities.EmergencyAlert.EmergencyStatus;
import java.util.List;

public interface IEmergencyAlertService {
    
    EmergencyAlert createEmergencyAlert(EmergencyAlert alert);
    
    EmergencyAlert getEmergencyAlertById(Long id);
    
    List<EmergencyAlert> getAllEmergencyAlerts();
    
    List<EmergencyAlert> getActiveEmergencies();
    
    List<EmergencyAlert> getPatientEmergencies(Long patientId);
    
    EmergencyAlert assignDoctorToEmergency(Long emergencyId, Long doctorId);
    
    EmergencyAlert updateEmergencyStatus(Long emergencyId, EmergencyStatus status);
    
    EmergencyAlert resolveEmergency(Long emergencyId, String resolution);
    
    Long getActiveEmergencyCount();
}
