package com.healthcare.system.services;

import com.healthcare.system.entities.Prescription;
import com.healthcare.system.entities.PrescriptionMedicine;
import com.healthcare.system.repositories.PrescriptionRepository;
import com.healthcare.system.repositories.PrescriptionMedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrescriptionServiceImpl implements IPrescriptionService {
    
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    
    @Autowired
    private PrescriptionMedicineRepository prescriptionMedicineRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Override
    @Transactional
    public Prescription createPrescription(Prescription prescription, List<PrescriptionMedicine> medicines) {
        prescription.setCreatedAt(LocalDateTime.now());
        prescription.setPrescriptionDate(LocalDate.now());
        
        // Set validity (default 30 days)
        if (prescription.getValidUntil() == null) {
            prescription.setValidUntil(LocalDate.now().plusDays(30));
        }
        
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        
        // Add medicines to prescription
        if (medicines != null && !medicines.isEmpty()) {
            for (PrescriptionMedicine medicine : medicines) {
                medicine.setPrescription(savedPrescription);
                prescriptionMedicineRepository.save(medicine);
            }
        }
        
        // Send notification to patient
        notificationService.sendPrescriptionNotification(
            savedPrescription.getPatient().getId(),
            "New Prescription",
            "Dr. " + savedPrescription.getDoctor().getLastName() + " has created a new prescription for you",
            savedPrescription.getId()
        );
        
        // Log the action
        auditLogService.logAction(
            savedPrescription.getDoctor().getId(),
            "DOCTOR",
            "CREATE",
            "Prescription",
            savedPrescription.getId(),
            "Prescription created for patient: " + savedPrescription.getPatient().getFirstName()
        );
        
        return savedPrescription;
    }
    
    @Override
    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));
    }
    
    @Override
    public List<Prescription> getPatientPrescriptions(Long patientId) {
        return prescriptionRepository.findPatientPrescriptionsOrderedByDate(patientId);
    }
    
    @Override
    public List<Prescription> getDoctorPrescriptions(Long doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }
    
    @Override
    public List<Prescription> getValidPrescriptions() {
        return prescriptionRepository.findValidPrescriptions(LocalDate.now());
    }
    
    @Override
    @Transactional
    public Prescription updatePrescription(Prescription prescription) {
        if (!prescriptionRepository.existsById(prescription.getId())) {
            throw new RuntimeException("Prescription not found with ID: " + prescription.getId());
        }
        
        Prescription updatedPrescription = prescriptionRepository.save(prescription);
        
        // Log the action
        auditLogService.logAction(
            updatedPrescription.getDoctor().getId(),
            "DOCTOR",
            "UPDATE",
            "Prescription",
            updatedPrescription.getId(),
            "Prescription updated"
        );
        
        return updatedPrescription;
    }
    
    @Override
    @Transactional
    public void addMedicineToPrescription(Long prescriptionId, PrescriptionMedicine medicine) {
        Prescription prescription = getPrescriptionById(prescriptionId);
        medicine.setPrescription(prescription);
        prescriptionMedicineRepository.save(medicine);
    }
    
    @Override
    public List<PrescriptionMedicine> getPrescriptionMedicines(Long prescriptionId) {
        return prescriptionMedicineRepository.findByPrescriptionId(prescriptionId);
    }
}
