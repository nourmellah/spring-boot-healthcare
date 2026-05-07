package com.healthcare.system.services;

import com.healthcare.system.entities.Doctor;
import com.healthcare.system.entities.User;
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
        if (doctor.getPassword() != null && !doctor.getPassword().startsWith("$2a$")) {
            doctor.setPassword(passwordEncoder.encode(doctor.getPassword()));
        }

        doctor.setRole(User.Role.DOCTOR);
        doctor.setCreatedAt(LocalDateTime.now());
        doctor.setUpdatedAt(LocalDateTime.now());
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
        Doctor existing = getDoctorById(doctor.getId());

        if (doctor.getFirstName() != null) {
            existing.setFirstName(doctor.getFirstName());
        }
        if (doctor.getLastName() != null) {
            existing.setLastName(doctor.getLastName());
        }
        if (doctor.getEmail() != null) {
            existing.setEmail(doctor.getEmail());
        }
        if (doctor.getPhone() != null) {
            existing.setPhone(doctor.getPhone());
        }
        if (doctor.getPassword() != null && !doctor.getPassword().isBlank()) {
            String password = doctor.getPassword();
            existing.setPassword(password.startsWith("$2a$") ? password : passwordEncoder.encode(password));
        }
        if (doctor.getLicenseNumber() != null) {
            existing.setLicenseNumber(doctor.getLicenseNumber());
        }
        if (doctor.getSpecialty() != null) {
            existing.setSpecialty(doctor.getSpecialty());
        }
        if (doctor.getYearsOfExperience() != null) {
            existing.setYearsOfExperience(doctor.getYearsOfExperience());
        }
        if (doctor.getQualifications() != null) {
            existing.setQualifications(doctor.getQualifications());
        }
        if (doctor.getConsultationFee() != null) {
            existing.setConsultationFee(doctor.getConsultationFee());
        }
        if (doctor.getAvailableDays() != null) {
            existing.setAvailableDays(doctor.getAvailableDays());
        }
        if (doctor.getAvailableHours() != null) {
            existing.setAvailableHours(doctor.getAvailableHours());
        }

        existing.setRole(User.Role.DOCTOR);
        existing.setUpdatedAt(LocalDateTime.now());

        Doctor updatedDoctor = doctorRepository.save(existing);

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
        doctor.setUpdatedAt(LocalDateTime.now());
        doctorRepository.save(doctor);

        auditLogService.logAction(
                id,
                "ADMIN",
                "DEACTIVATE",
                "Doctor",
                id,
                "Doctor account deactivated safely. Medical records were kept."
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