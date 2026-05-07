package com.healthcare.system.controllers;

import com.healthcare.system.entities.Doctor;
import com.healthcare.system.services.IDoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {
    
    @Autowired
    private IDoctorService doctorService;
    
    @PostMapping
    public ResponseEntity<Doctor> registerDoctor(@RequestBody Doctor doctor) {
        Doctor savedDoctor = doctorService.registerDoctor(doctor);
        return new ResponseEntity<>(savedDoctor, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        List<Doctor> doctors = doctorService.getAllDoctors();
        return ResponseEntity.ok(doctors);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Doctor>> getActiveDoctors() {
        List<Doctor> doctors = doctorService.getActiveDoctors();
        return ResponseEntity.ok(doctors);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        Doctor doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Doctor> updateDoctor(@PathVariable Long id, @RequestBody Doctor doctor) {
        doctor.setId(id);
        Doctor updatedDoctor = doctorService.updateDoctor(doctor);
        return ResponseEntity.ok(updatedDoctor);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.ok("Doctor deactivated successfully");
    }
    
    @GetMapping("/specialty/{specialtyId}")
    public ResponseEntity<List<Doctor>> getDoctorsBySpecialty(@PathVariable Long specialtyId) {
        List<Doctor> doctors = doctorService.getDoctorsBySpecialty(specialtyId);
        return ResponseEntity.ok(doctors);
    }
    
    @GetMapping("/license/{licenseNumber}")
    public ResponseEntity<Doctor> getDoctorByLicenseNumber(@PathVariable String licenseNumber) {
        Doctor doctor = doctorService.getDoctorByLicenseNumber(licenseNumber);
        return ResponseEntity.ok(doctor);
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getActiveDoctorCount() {
        Long count = doctorService.getActiveDoctorCount();
        return ResponseEntity.ok(count);
    }
}
