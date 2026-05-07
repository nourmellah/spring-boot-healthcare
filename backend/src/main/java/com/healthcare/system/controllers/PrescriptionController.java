package com.healthcare.system.controllers;

import com.healthcare.system.entities.Prescription;
import com.healthcare.system.entities.PrescriptionMedicine;
import com.healthcare.system.services.IPrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {
    
    @Autowired
    private IPrescriptionService prescriptionService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Prescription> createPrescription(@RequestBody Prescription prescription) {
        Prescription savedPrescription = prescriptionService.createPrescription(prescription, null);
        return new ResponseEntity<>(savedPrescription, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Prescription> getPrescriptionById(@PathVariable Long id) {
        Prescription prescription = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(prescription);
    }
    
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long patientId) {
        List<Prescription> prescriptions = prescriptionService.getPatientPrescriptions(patientId);
        return ResponseEntity.ok(prescriptions);
    }
    
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Prescription>> getDoctorPrescriptions(@PathVariable Long doctorId) {
        List<Prescription> prescriptions = prescriptionService.getDoctorPrescriptions(doctorId);
        return ResponseEntity.ok(prescriptions);
    }
    
    @GetMapping("/valid")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Prescription>> getValidPrescriptions() {
        List<Prescription> prescriptions = prescriptionService.getValidPrescriptions();
        return ResponseEntity.ok(prescriptions);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Prescription> updatePrescription(
            @PathVariable Long id,
            @RequestBody Prescription prescription) {
        prescription.setId(id);
        Prescription updatedPrescription = prescriptionService.updatePrescription(prescription);
        return ResponseEntity.ok(updatedPrescription);
    }
    
    @PostMapping("/{id}/medicines")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<String> addMedicineToPrescription(
            @PathVariable Long id,
            @RequestBody PrescriptionMedicine medicine) {
        prescriptionService.addMedicineToPrescription(id, medicine);
        return ResponseEntity.ok("Medicine added to prescription successfully");
    }
    
    @GetMapping("/{id}/medicines")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<PrescriptionMedicine>> getPrescriptionMedicines(@PathVariable Long id) {
        List<PrescriptionMedicine> medicines = prescriptionService.getPrescriptionMedicines(id);
        medicines.forEach(this::sanitizePrescriptionMedicine);
        return ResponseEntity.ok(medicines);
    }

    private void sanitizePrescriptionMedicine(PrescriptionMedicine prescriptionMedicine) {
        prescriptionMedicine.setPrescription(null);

        if (prescriptionMedicine.getMedicine() != null) {
            prescriptionMedicine.getMedicine().setPrescriptionMedicines(null);
        }
    }
}

