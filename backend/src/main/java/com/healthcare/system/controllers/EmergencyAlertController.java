package com.healthcare.system.controllers;

import com.healthcare.system.entities.EmergencyAlert;
import com.healthcare.system.entities.EmergencyAlert.EmergencyStatus;
import com.healthcare.system.services.IEmergencyAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/emergencies")
@CrossOrigin(origins = "*")
public class EmergencyAlertController {
    
    @Autowired
    private IEmergencyAlertService emergencyAlertService;
    
    @PostMapping
    public ResponseEntity<EmergencyAlert> createEmergencyAlert(@RequestBody EmergencyAlert alert) {
        EmergencyAlert savedAlert = emergencyAlertService.createEmergencyAlert(alert);
        return new ResponseEntity<>(savedAlert, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<EmergencyAlert>> getAllEmergencyAlerts() {
        List<EmergencyAlert> alerts = emergencyAlertService.getAllEmergencyAlerts();
        return ResponseEntity.ok(alerts);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<EmergencyAlert>> getActiveEmergencies() {
        List<EmergencyAlert> alerts = emergencyAlertService.getActiveEmergencies();
        return ResponseEntity.ok(alerts);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EmergencyAlert> getEmergencyAlertById(@PathVariable Long id) {
        EmergencyAlert alert = emergencyAlertService.getEmergencyAlertById(id);
        return ResponseEntity.ok(alert);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<EmergencyAlert>> getPatientEmergencies(@PathVariable Long patientId) {
        List<EmergencyAlert> alerts = emergencyAlertService.getPatientEmergencies(patientId);
        return ResponseEntity.ok(alerts);
    }
    
    @PutMapping("/{id}/assign-doctor/{doctorId}")
    public ResponseEntity<EmergencyAlert> assignDoctorToEmergency(
            @PathVariable Long id,
            @PathVariable Long doctorId) {
        EmergencyAlert alert = emergencyAlertService.assignDoctorToEmergency(id, doctorId);
        return ResponseEntity.ok(alert);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<EmergencyAlert> updateEmergencyStatus(
            @PathVariable Long id,
            @RequestParam EmergencyStatus status) {
        EmergencyAlert alert = emergencyAlertService.updateEmergencyStatus(id, status);
        return ResponseEntity.ok(alert);
    }
    
    @PutMapping("/{id}/resolve")
    public ResponseEntity<EmergencyAlert> resolveEmergency(
            @PathVariable Long id,
            @RequestParam String resolution) {
        EmergencyAlert alert = emergencyAlertService.resolveEmergency(id, resolution);
        return ResponseEntity.ok(alert);
    }
    
    @GetMapping("/active/count")
    public ResponseEntity<Long> getActiveEmergencyCount() {
        Long count = emergencyAlertService.getActiveEmergencyCount();
        return ResponseEntity.ok(count);
    }
}
