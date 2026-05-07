package com.healthcare.system.services;

import com.healthcare.system.entities.Patient;
import com.healthcare.system.entities.User;
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
        if (patient.getPassword() != null && !patient.getPassword().startsWith("$2a$")) {
            patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        }

        patient.setRole(User.Role.PATIENT);
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());
        patient.setActive(true);

        Patient savedPatient = patientRepository.save(patient);

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
        Patient existing = getPatientById(patient.getId());

        if (patient.getFirstName() != null) {
            existing.setFirstName(patient.getFirstName());
        }
        if (patient.getLastName() != null) {
            existing.setLastName(patient.getLastName());
        }
        if (patient.getEmail() != null) {
            existing.setEmail(patient.getEmail());
        }
        if (patient.getPhone() != null) {
            existing.setPhone(patient.getPhone());
        }
        if (patient.getPassword() != null && !patient.getPassword().isBlank()) {
            String password = patient.getPassword();
            existing.setPassword(password.startsWith("$2a$") ? password : passwordEncoder.encode(password));
        }
        if (patient.getDateOfBirth() != null) {
            existing.setDateOfBirth(patient.getDateOfBirth());
        }
        if (patient.getGender() != null) {
            existing.setGender(patient.getGender());
        }
        if (patient.getAddress() != null) {
            existing.setAddress(patient.getAddress());
        }
        if (patient.getBloodGroup() != null) {
            existing.setBloodGroup(patient.getBloodGroup());
        }
        if (patient.getEmergencyContact() != null) {
            existing.setEmergencyContact(patient.getEmergencyContact());
        }
        if (patient.getEmergencyContactName() != null) {
            existing.setEmergencyContactName(patient.getEmergencyContactName());
        }
        if (patient.getMedicalHistory() != null) {
            existing.setMedicalHistory(patient.getMedicalHistory());
        }

        existing.setRole(User.Role.PATIENT);
        existing.setUpdatedAt(LocalDateTime.now());

        Patient updatedPatient = patientRepository.save(existing);

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
        patient.setUpdatedAt(LocalDateTime.now());
        patientRepository.save(patient);

        auditLogService.logAction(
                id,
                "ADMIN",
                "DEACTIVATE",
                "Patient",
                id,
                "Patient account deactivated safely. Medical records were kept."
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