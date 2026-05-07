package com.healthcare.system.controllers;

import com.healthcare.system.entities.Specialty;
import com.healthcare.system.services.ISpecialtyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/specialties")
@CrossOrigin(origins = "*")
public class SpecialtyController {
    
    @Autowired
    private ISpecialtyService specialtyService;
    
    @PostMapping
    public ResponseEntity<Specialty> createSpecialty(@RequestBody Specialty specialty) {
        Specialty savedSpecialty = specialtyService.createSpecialty(specialty);
        return new ResponseEntity<>(savedSpecialty, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Specialty>> getAllSpecialties() {
        List<Specialty> specialties = specialtyService.getAllSpecialties();
        return ResponseEntity.ok(specialties);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Specialty> getSpecialtyById(@PathVariable Long id) {
        Specialty specialty = specialtyService.getSpecialtyById(id);
        return ResponseEntity.ok(specialty);
    }
    
    @GetMapping("/name/{name}")
    public ResponseEntity<Specialty> getSpecialtyByName(@PathVariable String name) {
        Specialty specialty = specialtyService.getSpecialtyByName(name);
        return ResponseEntity.ok(specialty);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Specialty> updateSpecialty(
            @PathVariable Long id,
            @RequestBody Specialty specialty) {
        specialty.setId(id);
        Specialty updatedSpecialty = specialtyService.updateSpecialty(specialty);
        return ResponseEntity.ok(updatedSpecialty);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSpecialty(@PathVariable Long id) {
        specialtyService.deleteSpecialty(id);
        return ResponseEntity.ok("Specialty deleted successfully");
    }
}
