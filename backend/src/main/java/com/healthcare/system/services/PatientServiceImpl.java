package com.healthcare.system.services;

import com.healthcare.system.entities.Patient;
import com.healthcare.system.repositories.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PatientServiceImpl implements IPatientService {
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public Patient registerPatient(Patient patient) {
        // Encode password if not already encoded
        if (patient.getPassword() != null && !patient.getPassword().startsWith("$2a$")) {
            patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        }
        patient.setCreatedAt(LocalDateTime.now());
        patient.setActive(true);
        Patient savedPatient = patientRepository.save(patient);
        
        // Log the action
        auditLogService.logAction(
            savedPatient.getId(),
            "PATIENT",
            "CREATE",
            "Patient",
            savedPatient.getId(),
            "New patient registered: " + savedPatient.getFirstName() + " " + savedPatient.getLastName()
        );
        
        return savedPatient;
    }
    
    @Override
    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + id));
    }
    
    @Override
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }
    
    @Override
    public List<Patient> getActivePatients() {
        return patientRepository.findAllActivePatients();
    }
    
    @Override
    @Transactional
    public Patient updatePatient(Patient patient) {
        if (!patientRepository.existsById(patient.getId())) {
            throw new RuntimeException("Patient not found with ID: " + patient.getId());
        }
        
        patient.setUpdatedAt(LocalDateTime.now());
        Patient updatedPatient = patientRepository.save(patient);
        
        // Log the action
        auditLogService.logAction(
            updatedPatient.getId(),
            "PATIENT",
            "UPDATE",
            "Patient",
            updatedPatient.getId(),
            "Patient information updated"
        );
        
        return updatedPatient;
    }
    
    @Override
    @Transactional
    public void deletePatient(Long id) {
        Patient patient = getPatientById(id);
        patient.setActive(false);
        patientRepository.save(patient);
        
        // Log the action
        auditLogService.logAction(
            id,
            "ADMIN",
            "DELETE",
            "Patient",
            id,
            "Patient deactivated"
        );
    }
    
    @Override
    public List<Patient> searchPatients(String searchTerm) {
        return patientRepository.findByFirstNameContainingOrLastNameContaining(searchTerm, searchTerm);
    }
    
    @Override
    public List<Patient> getPatientsByBloodGroup(String bloodGroup) {
        return patientRepository.findByBloodGroup(bloodGroup);
    }
    
    @Override
    public Long getActivePatientCount() {
        return patientRepository.countActivePatients();
    }
    
    @Override
    public String getPatientMedicalHistory(Long patientId) {
        Patient patient = getPatientById(patientId);
        
        // Log the access
        auditLogService.logAction(
            patientId,
            "DOCTOR",
            "READ",
            "Patient",
            patientId,
            "Medical history accessed"
        );
        
        return patient.getMedicalHistory();
    }
}
