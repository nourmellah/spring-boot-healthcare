package com.healthcare.system.controllers;

import com.healthcare.system.entities.Medicine;
import com.healthcare.system.repositories.MedicineRepository;
import com.healthcare.system.repositories.PrescriptionMedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    @Autowired
    private PrescriptionMedicineRepository prescriptionMedicineRepository;

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
            String normalizedName = medicine.getName().trim();
            medicine.setName(normalizedName);

            return medicineRepository.findByName(normalizedName)
                    .map(existingMedicine -> ResponseEntity.ok(sanitize(existingMedicine)))
                    .orElseGet(() -> {
                        applyDefaults(medicine);
                        Medicine savedMedicine = medicineRepository.save(medicine);
                        return new ResponseEntity<>(sanitize(savedMedicine), HttpStatus.CREATED);
                    });
        }

        applyDefaults(medicine);
        Medicine savedMedicine = medicineRepository.save(medicine);
        return new ResponseEntity<>(sanitize(savedMedicine), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        Medicine existing = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        if (medicine.getName() != null) {
            String normalizedName = medicine.getName().trim();
            medicineRepository.findByName(normalizedName)
                    .filter(found -> !found.getId().equals(id))
                    .ifPresent(found -> {
                        throw new RuntimeException("Another medicine already uses this name");
                    });
            existing.setName(normalizedName);
        }

        if (medicine.getDescription() != null) {
            existing.setDescription(medicine.getDescription());
        }
        if (medicine.getManufacturer() != null) {
            existing.setManufacturer(medicine.getManufacturer());
        }
        if (medicine.getType() != null) {
            existing.setType(medicine.getType());
        }
        if (medicine.getStockQuantity() != null) {
            existing.setStockQuantity(Math.max(0, medicine.getStockQuantity()));
        }
        if (medicine.getUnitPrice() != null) {
            existing.setUnitPrice(Math.max(0, medicine.getUnitPrice()));
        }
        if (medicine.getRequiresPrescription() != null) {
            existing.setRequiresPrescription(medicine.getRequiresPrescription());
        }

        applyDefaults(existing);
        Medicine updatedMedicine = medicineRepository.save(existing);
        return ResponseEntity.ok(sanitize(updatedMedicine));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<String> deleteMedicine(@PathVariable Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        if (!prescriptionMedicineRepository.findByMedicineId(id).isEmpty()) {
            throw new RuntimeException("Medicine is used in prescriptions and cannot be deleted. Remove related medication lines first.");
        }

        medicineRepository.delete(medicine);
        return ResponseEntity.ok("Medicine deleted successfully");
    }

    private void applyDefaults(Medicine medicine) {
        if (medicine.getManufacturer() == null || medicine.getManufacturer().isBlank()) {
            medicine.setManufacturer("Generic");
        }
        if (medicine.getType() == null) {
            medicine.setType(Medicine.MedicineType.OTHER);
        }
        if (medicine.getStockQuantity() == null) {
            medicine.setStockQuantity(0);
        }
        if (medicine.getUnitPrice() == null) {
            medicine.setUnitPrice(0.0);
        }
        if (medicine.getRequiresPrescription() == null) {
            medicine.setRequiresPrescription(true);
        }
    }

    private Medicine sanitize(Medicine medicine) {
        medicine.setPrescriptionMedicines(null);
        return medicine;
    }
}