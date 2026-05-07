package com.healthcare.system.repositories;

import com.healthcare.system.entities.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    
    List<Prescription> findByPatientId(Long patientId);
    
    List<Prescription> findByDoctorId(Long doctorId);
    
    List<Prescription> findByAppointmentId(Long appointmentId);
    
    @Query("SELECT p FROM Prescription p WHERE p.patient.id = :patientId ORDER BY p.prescriptionDate DESC")
    List<Prescription> findPatientPrescriptionsOrderedByDate(@Param("patientId") Long patientId);
    
    @Query("SELECT p FROM Prescription p WHERE p.validUntil >= :currentDate")
    List<Prescription> findValidPrescriptions(@Param("currentDate") LocalDate currentDate);
    
    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.doctor.id = :doctorId")
    Long countPrescriptionsByDoctor(@Param("doctorId") Long doctorId);
}
