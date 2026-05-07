package com.healthcare.system.services;

import com.healthcare.system.entities.User;
import com.healthcare.system.entities.VitalSign;
import com.healthcare.system.repositories.VitalSignRepository;
import com.healthcare.system.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class VitalSignService {

    @Autowired
    private VitalSignRepository vitalSignRepository;

    @Transactional
    public VitalSign addVitalSign(VitalSign vitalSign) {
        if (vitalSign.getRecordedAt() == null) {
            vitalSign.setRecordedAt(LocalDateTime.now());
        }
        vitalSign.setRecordedBy(getCurrentUser().getId());
        return vitalSignRepository.save(vitalSign);
    }

    public VitalSign getById(Long id) {
        return vitalSignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vital sign not found with ID: " + id));
    }

    public List<VitalSign> getByPatientId(Long patientId) {
        return vitalSignRepository.findPatientVitalSignsOrderedByDate(patientId);
    }

    public VitalSign getLatestForPatient(Long patientId) {
        return vitalSignRepository.findLatestVitalSignForPatient(patientId);
    }

    public List<VitalSign> getAll() {
        return vitalSignRepository.findAll();
    }

    @Transactional
    public VitalSign update(Long id, VitalSign updated) {
        VitalSign existing = getById(id);
        assertCanManage(existing);

        if (updated.getBloodPressure() != null) {
            existing.setBloodPressure(updated.getBloodPressure());
        }
        if (updated.getHeartRate() != null) {
            existing.setHeartRate(updated.getHeartRate());
        }
        if (updated.getTemperature() != null) {
            existing.setTemperature(updated.getTemperature());
        }
        if (updated.getWeight() != null) {
            existing.setWeight(updated.getWeight());
        }
        if (updated.getHeight() != null) {
            existing.setHeight(updated.getHeight());
        }
        if (updated.getOxygenSaturation() != null) {
            existing.setOxygenSaturation(updated.getOxygenSaturation());
        }
        if (updated.getRespiratoryRate() != null) {
            existing.setRespiratoryRate(updated.getRespiratoryRate());
        }
        if (updated.getNotes() != null) {
            existing.setNotes(updated.getNotes());
        }

        return vitalSignRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        VitalSign existing = getById(id);
        assertCanManage(existing);
        vitalSignRepository.delete(existing);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new AccessDeniedException("Authenticated user details were not found");
        }
        return userDetails;
    }

    private void assertCanManage(VitalSign vitalSign) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (User.Role.ADMIN.equals(currentUser.getRole())) {
            return;
        }

        if (User.Role.DOCTOR.equals(currentUser.getRole())
                && vitalSign.getRecordedBy() != null
                && vitalSign.getRecordedBy().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You can only edit or delete vital signs that you recorded");
    }
}