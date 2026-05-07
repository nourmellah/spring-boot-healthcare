package com.healthcare.system.services;

import com.healthcare.system.entities.LabResult;
import com.healthcare.system.entities.LabResult.LabStatus;
import com.healthcare.system.repositories.LabResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LabResultService {

    @Autowired
    private LabResultRepository labResultRepository;

    @Transactional
    public LabResult upload(LabResult labResult) {
        labResult.setCreatedAt(LocalDateTime.now());
        if (labResult.getTestDate() == null) {
            labResult.setTestDate(LocalDate.now());
        }
        if (labResult.getStatus() == null) {
            labResult.setStatus(LabStatus.PENDING);
        }
        return labResultRepository.save(labResult);
    }

    public LabResult getById(Long id) {
        return labResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab result not found with ID: " + id));
    }

    public List<LabResult> getAll() {
        return labResultRepository.findAll();
    }

    public List<LabResult> getByPatientId(Long patientId) {
        return labResultRepository.findPatientLabResultsOrderedByDate(patientId);
    }

    public List<LabResult> getByDoctorId(Long doctorId) {
        return labResultRepository.findByDoctorId(doctorId);
    }

    public List<LabResult> getByStatus(LabStatus status) {
        return labResultRepository.findByStatus(status);
    }

    @Transactional
    public LabResult update(Long id, LabResult updated) {
        LabResult existing = getById(id);
        existing.setResults(updated.getResults());
        existing.setRemarks(updated.getRemarks());
        existing.setStatus(updated.getStatus());
        existing.setFilePath(updated.getFilePath());
        return labResultRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        labResultRepository.deleteById(id);
    }
}
