package com.healthcare.system.services;

import com.healthcare.system.entities.EmergencyAlert;
import com.healthcare.system.entities.EmergencyAlert.EmergencyStatus;
import com.healthcare.system.entities.Doctor;
import com.healthcare.system.repositories.EmergencyAlertRepository;
import com.healthcare.system.repositories.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmergencyAlertServiceImpl implements IEmergencyAlertService {
    
    @Autowired
    private EmergencyAlertRepository emergencyAlertRepository;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Override
    @Transactional
    public EmergencyAlert createEmergencyAlert(EmergencyAlert alert) {
        alert.setStatus(EmergencyStatus.ACTIVE);
        alert.setCreatedAt(LocalDateTime.now());
        EmergencyAlert savedAlert = emergencyAlertRepository.save(alert);
        
        // Notify all active doctors about the emergency
        List<Doctor> activeDoctors = doctorRepository.findByActiveTrue();
        for (Doctor doctor : activeDoctors) {
            notificationService.sendEmergencyNotification(
                doctor.getId(),
                "🚨 EMERGENCY ALERT",
                "Emergency from " + savedAlert.getPatient().getFirstName() + " - " + savedAlert.getDescription(),
                savedAlert.getId()
            );
        }
        
        // Log the action
        auditLogService.logAction(
            savedAlert.getPatient().getId(),
            "PATIENT",
            "CREATE",
            "EmergencyAlert",
            savedAlert.getId(),
            "Emergency alert created: " + savedAlert.getDescription()
        );
        
        return savedAlert;
    }
    
    @Override
    public EmergencyAlert getEmergencyAlertById(Long id) {
        return emergencyAlertRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Emergency alert not found with ID: " + id));
    }
    
    @Override
    public List<EmergencyAlert> getAllEmergencyAlerts() {
        return emergencyAlertRepository.findAll();
    }
    
    @Override
    public List<EmergencyAlert> getActiveEmergencies() {
        return emergencyAlertRepository.findActiveEmergenciesOrderedBySeverity();
    }
    
    @Override
    public List<EmergencyAlert> getPatientEmergencies(Long patientId) {
        return emergencyAlertRepository.findByPatientId(patientId);
    }
    
    @Override
    @Transactional
    public EmergencyAlert assignDoctorToEmergency(Long emergencyId, Long doctorId) {
        EmergencyAlert alert = getEmergencyAlertById(emergencyId);
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        alert.setDoctor(doctor);
        alert.setStatus(EmergencyStatus.IN_PROGRESS);
        EmergencyAlert updatedAlert = emergencyAlertRepository.save(alert);
        
        // Notify patient
        notificationService.sendEmergencyNotification(
            alert.getPatient().getId(),
            "Emergency Response",
            "Dr. " + doctor.getLastName() + " is responding to your emergency",
            emergencyId
        );
        
        // Log the action
        auditLogService.logAction(
            doctorId,
            "DOCTOR",
            "UPDATE",
            "EmergencyAlert",
            emergencyId,
            "Doctor assigned to emergency"
        );
        
        return updatedAlert;
    }
    
    @Override
    @Transactional
    public EmergencyAlert updateEmergencyStatus(Long emergencyId, EmergencyStatus status) {
        EmergencyAlert alert = getEmergencyAlertById(emergencyId);
        alert.setStatus(status);
        
        if (status == EmergencyStatus.RESOLVED) {
            alert.setResolvedAt(LocalDateTime.now());
        }
        
        return emergencyAlertRepository.save(alert);
    }
    
    @Override
    @Transactional
    public EmergencyAlert resolveEmergency(Long emergencyId, String resolution) {
        EmergencyAlert alert = getEmergencyAlertById(emergencyId);
        alert.setStatus(EmergencyStatus.RESOLVED);
        alert.setResolution(resolution);
        alert.setResolvedAt(LocalDateTime.now());
        EmergencyAlert resolvedAlert = emergencyAlertRepository.save(alert);
        
        // Notify patient
        notificationService.sendEmergencyNotification(
            alert.getPatient().getId(),
            "Emergency Resolved",
            "Your emergency has been resolved: " + resolution,
            emergencyId
        );
        
        // Log the action
        auditLogService.logAction(
            alert.getDoctor() != null ? alert.getDoctor().getId() : 0L,
            "DOCTOR",
            "UPDATE",
            "EmergencyAlert",
            emergencyId,
            "Emergency resolved: " + resolution
        );
        
        return resolvedAlert;
    }
    
    @Override
    public Long getActiveEmergencyCount() {
        return emergencyAlertRepository.countActiveEmergencies();
    }
}
