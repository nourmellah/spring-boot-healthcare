package com.healthcare.system.controllers;

import com.healthcare.system.entities.LabResult;
import com.healthcare.system.entities.LabResult.LabStatus;
import com.healthcare.system.services.LabResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lab-results")
@CrossOrigin(origins = "*")
public class LabResultController {

    @Autowired
    private LabResultService labResultService;

    // LAB_TECH and ADMIN can upload results
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<LabResult> upload(@RequestBody LabResult labResult) {
        return new ResponseEntity<>(labResultService.upload(labResult), HttpStatus.CREATED);
    }

    // ADMIN sees all
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LabResult>> getAll() {
        return ResponseEntity.ok(labResultService.getAll());
    }

    // LAB_TECH sees only results uploaded by the authenticated lab technician
    @GetMapping("/my-uploads")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<List<LabResult>> getMyUploads() {
        return ResponseEntity.ok(labResultService.getCurrentUserUploads());
    }

    // ADMIN, DOCTOR, PATIENT (own), LAB_TECH (own)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT', 'LAB_TECHNICIAN')")
    public ResponseEntity<LabResult> getById(@PathVariable Long id) {
        return ResponseEntity.ok(labResultService.getById(id));
    }

    // ADMIN, DOCTOR, PATIENT (own)
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<LabResult>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(labResultService.getByPatientId(patientId));
    }

    // ADMIN, DOCTOR (own)
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<LabResult>> getByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(labResultService.getByDoctorId(doctorId));
    }

    // ADMIN, DOCTOR
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<LabResult>> getByStatus(@PathVariable LabStatus status) {
        return ResponseEntity.ok(labResultService.getByStatus(status));
    }

    // ADMIN can update any result. LAB_TECH can update only their own uploaded results.
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<LabResult> update(@PathVariable Long id, @RequestBody LabResult labResult) {
        return ResponseEntity.ok(labResultService.update(id, labResult));
    }

    // ADMIN can delete any result. LAB_TECH can delete only their own uploaded results.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        labResultService.delete(id);
        return ResponseEntity.ok("Lab result deleted successfully");
    }
}
