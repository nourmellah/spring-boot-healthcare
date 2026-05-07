package com.healthcare.system.controllers;

import com.healthcare.system.entities.Medicine;
import com.healthcare.system.repositories.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "*")
public class MedicineController {

    @Autowired
    private MedicineRepository medicineRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')")
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        List<Medicine> medicines = medicineRepository.findAll()
            .stream()
            .map(this::sanitize)
            .toList();

        return ResponseEntity.ok(medicines);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')")
    public ResponseEntity<List<Medicine>> getAvailableMedicines() {
        List<Medicine> medicines = medicineRepository.findAvailableMedicines()
            .stream()
            .map(this::sanitize)
            .toList();

        return ResponseEntity.ok(medicines);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        Medicine medicine = medicineRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        return ResponseEntity.ok(sanitize(medicine));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        if (medicine.getName() != null) {
            return medicineRepository.findByName(medicine.getName())
                .map(existingMedicine -> ResponseEntity.ok(sanitize(existingMedicine)))
                .orElseGet(() -> {
                    Medicine savedMedicine = medicineRepository.save(medicine);
                    return new ResponseEntity<>(sanitize(savedMedicine), HttpStatus.CREATED);
                });
        }

        Medicine savedMedicine = medicineRepository.save(medicine);
        return new ResponseEntity<>(sanitize(savedMedicine), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        if (!medicineRepository.existsById(id)) {
            throw new RuntimeException("Medicine not found with ID: " + id);
        }

        medicine.setId(id);
        Medicine updatedMedicine = medicineRepository.save(medicine);
        return ResponseEntity.ok(sanitize(updatedMedicine));
    }

    private Medicine sanitize(Medicine medicine) {
        medicine.setPrescriptionMedicines(null);
        return medicine;
    }
}
