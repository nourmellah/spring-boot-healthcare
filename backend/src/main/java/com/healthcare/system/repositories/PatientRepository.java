package com.healthcare.system.repositories;

import com.healthcare.system.entities.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    
    List<Patient> findByBloodGroup(String bloodGroup);
    
    List<Patient> findByFirstNameContainingOrLastNameContaining(String firstName, String lastName);
    
    @Query("SELECT p FROM Patient p WHERE p.active = true ORDER BY p.createdAt DESC")
    List<Patient> findAllActivePatients();
    
    @Query("SELECT COUNT(p) FROM Patient p WHERE p.active = true")
    Long countActivePatients();
}
