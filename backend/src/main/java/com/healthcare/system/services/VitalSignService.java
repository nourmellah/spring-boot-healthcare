package com.healthcare.system.services;

import com.healthcare.system.entities.VitalSign;
import com.healthcare.system.repositories.VitalSignRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        vitalSign.setRecordedAt(LocalDateTime.now());
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
        existing.setBloodPressure(updated.getBloodPressure());
        existing.setHeartRate(updated.getHeartRate());
        existing.setTemperature(updated.getTemperature());
        existing.setWeight(updated.getWeight());
        existing.setHeight(updated.getHeight());
        existing.setOxygenSaturation(updated.getOxygenSaturation());
        existing.setRespiratoryRate(updated.getRespiratoryRate());
        existing.setNotes(updated.getNotes());
        return vitalSignRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        vitalSignRepository.deleteById(id);
    }
}
