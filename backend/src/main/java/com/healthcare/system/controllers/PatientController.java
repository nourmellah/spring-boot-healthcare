package com.healthcare.system.controllers;

import com.healthcare.system.entities.Patient;
import com.healthcare.system.services.IPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {
    
    @Autowired
    private IPatientService patientService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<Patient> registerPatient(@RequestBody Patient patient) {
        Patient savedPatient = patientService.registerPatient(patient);
        return new ResponseEntity<>(savedPatient, HttpStatus.CREATED);
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return ResponseEntity.ok(patients);
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Patient>> getActivePatients() {
        List<Patient> patients = patientService.getActivePatients();
        return ResponseEntity.ok(patients);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        Patient patient = patientService.getPatientById(id);
        return ResponseEntity.ok(patient);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<Patient> updatePatient(@PathVariable Long id, @RequestBody Patient patient) {
        patient.setId(id);
        Patient updatedPatient = patientService.updatePatient(patient);
        return ResponseEntity.ok(updatedPatient);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok("Patient deactivated successfully");
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Patient>> searchPatients(@RequestParam String term) {
        List<Patient> patients = patientService.searchPatients(term);
        return ResponseEntity.ok(patients);
    }
    
    @GetMapping("/blood-group/{bloodGroup}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Patient>> getPatientsByBloodGroup(@PathVariable String bloodGroup) {
        List<Patient> patients = patientService.getPatientsByBloodGroup(bloodGroup);
        return ResponseEntity.ok(patients);
    }
    
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Long> getActivePatientCount() {
        Long count = patientService.getActivePatientCount();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/{id}/medical-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<String> getPatientMedicalHistory(@PathVariable Long id) {
        String history = patientService.getPatientMedicalHistory(id);
        return ResponseEntity.ok(history);
    }
}
