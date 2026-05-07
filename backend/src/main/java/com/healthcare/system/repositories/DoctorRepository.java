package com.healthcare.system.repositories;

import com.healthcare.system.entities.Doctor;
import com.healthcare.system.entities.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    
    Optional<Doctor> findByLicenseNumber(String licenseNumber);
    
    List<Doctor> findBySpecialty(Specialty specialty);
    
    List<Doctor> findBySpecialtyId(Long specialtyId);
    
    @Query("SELECT d FROM Doctor d WHERE d.active = true ORDER BY d.yearsOfExperience DESC")
    List<Doctor> findAllActiveDoctorsOrderedByExperience();
    
    @Query("SELECT COUNT(d) FROM Doctor d WHERE d.active = true")
    Long countActiveDoctors();
    
    List<Doctor> findByActiveTrue();
}
