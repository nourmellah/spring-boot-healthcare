package com.healthcare.system.services;

import com.healthcare.system.entities.LabResult;
import com.healthcare.system.entities.LabResult.LabStatus;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.LabResultRepository;
import com.healthcare.system.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
        if (labResult.getUploadedBy() == null) {
            labResult.setUploadedBy(getCurrentUser().getId());
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

    public List<LabResult> getCurrentUserUploads() {
        return labResultRepository.findByUploadedByOrderByCreatedAtDesc(getCurrentUser().getId());
    }

    @Transactional
    public LabResult update(Long id, LabResult updated) {
        LabResult existing = getById(id);
        assertCanManage(existing);

        if (updated.getTestName() != null) {
            existing.setTestName(updated.getTestName());
        }
        if (updated.getTestDate() != null) {
            existing.setTestDate(updated.getTestDate());
        }
        if (updated.getResults() != null) {
            existing.setResults(updated.getResults());
        }
        if (updated.getRemarks() != null) {
            existing.setRemarks(updated.getRemarks());
        }
        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }
        if (updated.getFilePath() != null) {
            existing.setFilePath(updated.getFilePath());
        }

        return labResultRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        LabResult existing = getById(id);
        assertCanManage(existing);
        labResultRepository.delete(existing);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new AccessDeniedException("Authenticated user details were not found");
        }
        return userDetails;
    }

    private void assertCanManage(LabResult labResult) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (User.Role.ADMIN.equals(currentUser.getRole())) {
            return;
        }

        if (User.Role.LAB_TECHNICIAN.equals(currentUser.getRole())
                && labResult.getUploadedBy() != null
                && labResult.getUploadedBy().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You can only edit or delete lab results that you uploaded");
    }
}
