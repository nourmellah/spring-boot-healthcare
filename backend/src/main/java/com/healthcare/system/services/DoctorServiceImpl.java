package com.healthcare.system.services;

import com.healthcare.system.entities.Doctor;
import com.healthcare.system.repositories.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DoctorServiceImpl implements IDoctorService {
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public Doctor registerDoctor(Doctor doctor) {
        // Encode password if not already encoded
        if (doctor.getPassword() != null && !doctor.getPassword().startsWith("$2a$")) {
            doctor.setPassword(passwordEncoder.encode(doctor.getPassword()));
        }
        doctor.setCreatedAt(LocalDateTime.now());
        doctor.setActive(true);
        Doctor savedDoctor = doctorRepository.save(doctor);
        
        auditLogService.logAction(
            savedDoctor.getId(),
            "ADMIN",
            "CREATE",
            "Doctor",
            savedDoctor.getId(),
            "New doctor registered: Dr. " + savedDoctor.getFirstName() + " " + savedDoctor.getLastName()
        );
        
        return savedDoctor;
    }
    
    @Override
    public Doctor getDoctorById(Long id) {
        return doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + id));
    }
    
    @Override
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }
    
    @Override
    public List<Doctor> getActiveDoctors() {
        return doctorRepository.findByActiveTrue();
    }
    
    @Override
    @Transactional
    public Doctor updateDoctor(Doctor doctor) {
        if (!doctorRepository.existsById(doctor.getId())) {
            throw new RuntimeException("Doctor not found with ID: " + doctor.getId());
        }
        
        doctor.setUpdatedAt(LocalDateTime.now());
        Doctor updatedDoctor = doctorRepository.save(doctor);
        
        auditLogService.logAction(
            updatedDoctor.getId(),
            "ADMIN",
            "UPDATE",
            "Doctor",
            updatedDoctor.getId(),
            "Doctor information updated"
        );
        
        return updatedDoctor;
    }
    
    @Override
    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = getDoctorById(id);
        doctor.setActive(false);
        doctorRepository.save(doctor);
        
        auditLogService.logAction(
            id,
            "ADMIN",
            "DELETE",
            "Doctor",
            id,
            "Doctor deactivated"
        );
    }
    
    @Override
    public List<Doctor> getDoctorsBySpecialty(Long specialtyId) {
        return doctorRepository.findBySpecialtyId(specialtyId);
    }
    
    @Override
    public Doctor getDoctorByLicenseNumber(String licenseNumber) {
        return doctorRepository.findByLicenseNumber(licenseNumber)
            .orElseThrow(() -> new RuntimeException("Doctor not found with license number: " + licenseNumber));
    }
    
    @Override
    public Long getActiveDoctorCount() {
        return doctorRepository.countActiveDoctors();
    }
}
