package com.healthcare.system.controllers;

import com.healthcare.system.entities.VitalSign;
import com.healthcare.system.services.VitalSignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vital-signs")
@CrossOrigin(origins = "*")
public class VitalSignController {

    @Autowired
    private VitalSignService vitalSignService;

    // ADMIN and DOCTOR can add vital signs
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<VitalSign> addVitalSign(@RequestBody VitalSign vitalSign) {
        VitalSign saved = vitalSignService.addVitalSign(vitalSign);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // ADMIN sees all
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VitalSign>> getAll() {
        return ResponseEntity.ok(vitalSignService.getAll());
    }

    // ADMIN, DOCTOR, PATIENT (own) can view by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<VitalSign> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vitalSignService.getById(id));
    }

    // ADMIN, DOCTOR, PATIENT (own) can view by patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<VitalSign>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(vitalSignService.getByPatientId(patientId));
    }

    // Latest vital sign for a patient
    @GetMapping("/patient/{patientId}/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<VitalSign> getLatest(@PathVariable Long patientId) {
        return ResponseEntity.ok(vitalSignService.getLatestForPatient(patientId));
    }

    // ADMIN can update any vital sign. DOCTOR can update only records they created.
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<VitalSign> update(@PathVariable Long id, @RequestBody VitalSign vitalSign) {
        return ResponseEntity.ok(vitalSignService.update(id, vitalSign));
    }

    // ADMIN can delete any vital sign. DOCTOR can delete only records they created.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        vitalSignService.delete(id);
        return ResponseEntity.ok("Vital sign deleted successfully");
    }
}