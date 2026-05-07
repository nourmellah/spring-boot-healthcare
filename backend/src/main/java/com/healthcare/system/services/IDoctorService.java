package com.healthcare.system.services;

import com.healthcare.system.entities.Doctor;
import java.util.List;

public interface IDoctorService {
    
    Doctor registerDoctor(Doctor doctor);
    
    Doctor getDoctorById(Long id);
    
    List<Doctor> getAllDoctors();
    
    List<Doctor> getActiveDoctors();
    
    Doctor updateDoctor(Doctor doctor);
    
    void deleteDoctor(Long id);
    
    List<Doctor> getDoctorsBySpecialty(Long specialtyId);
    
    Doctor getDoctorByLicenseNumber(String licenseNumber);
    
    Long getActiveDoctorCount();
}
