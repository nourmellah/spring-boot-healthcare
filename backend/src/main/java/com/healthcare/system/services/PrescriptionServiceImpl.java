package com.healthcare.system.services;

import com.healthcare.system.entities.Notification.NotificationType;
import com.healthcare.system.entities.Prescription;
import com.healthcare.system.entities.PrescriptionMedicine;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.PrescriptionRepository;
import com.healthcare.system.repositories.PrescriptionMedicineRepository;
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
public class PrescriptionServiceImpl implements IPrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private PrescriptionMedicineRepository prescriptionMedicineRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Override
    @Transactional
    public Prescription createPrescription(Prescription prescription, List<PrescriptionMedicine> medicines) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (User.Role.DOCTOR.equals(currentUser.getRole())) {
            Long requestedDoctorId = prescription.getDoctor() != null ? prescription.getDoctor().getId() : null;
            if (requestedDoctorId == null || !requestedDoctorId.equals(currentUser.getId())) {
                throw new AccessDeniedException("Doctors can only create prescriptions under their own account");
            }
        }

        prescription.setCreatedAt(LocalDateTime.now());
        prescription.setPrescriptionDate(LocalDate.now());

        if (prescription.getValidUntil() == null) {
            prescription.setValidUntil(LocalDate.now().plusDays(30));
        }

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        if (medicines != null && !medicines.isEmpty()) {
            for (PrescriptionMedicine medicine : medicines) {
                medicine.setPrescription(savedPrescription);
                prescriptionMedicineRepository.save(medicine);
            }
        }

        notificationService.sendPrescriptionNotification(
                savedPrescription.getPatient().getId(),
                "New Prescription",
                "Dr. " + savedPrescription.getDoctor().getLastName() + " has created a new prescription for you",
                savedPrescription.getId()
        );

        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "CREATE",
                "Prescription",
                savedPrescription.getId(),
                "Prescription created for patient: " + savedPrescription.getPatient().getFirstName()
        );

        return savedPrescription;
    }

    @Override
    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));
    }

    @Override
    public List<Prescription> getPatientPrescriptions(Long patientId) {
        return prescriptionRepository.findPatientPrescriptionsOrderedByDate(patientId);
    }

    @Override
    public List<Prescription> getDoctorPrescriptions(Long doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }

    @Override
    public List<Prescription> getValidPrescriptions() {
        return prescriptionRepository.findValidPrescriptions(LocalDate.now());
    }

    @Override
    @Transactional
    public Prescription updatePrescription(Prescription prescription) {
        Prescription existing = getPrescriptionById(prescription.getId());
        assertCanManage(existing);

        if (prescription.getDiagnosis() != null) {
            existing.setDiagnosis(prescription.getDiagnosis());
        }
        if (prescription.getInstructions() != null) {
            existing.setInstructions(prescription.getInstructions());
        }
        if (prescription.getValidUntil() != null) {
            existing.setValidUntil(prescription.getValidUntil());
        }

        Prescription updatedPrescription = prescriptionRepository.save(existing);
        UserDetailsImpl currentUser = getCurrentUser();

        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "UPDATE",
                "Prescription",
                updatedPrescription.getId(),
                "Prescription details updated"
        );

        notificationService.createNotification(
                updatedPrescription.getPatient().getId(),
                "Prescription Updated",
                "Your prescription details have been updated",
                NotificationType.GENERAL,
                "Prescription",
                updatedPrescription.getId()
        );

        return updatedPrescription;
    }

    @Override
    @Transactional
    public void deletePrescription(Long prescriptionId) {
        Prescription prescription = getPrescriptionById(prescriptionId);
        assertCanManage(prescription);

        UserDetailsImpl currentUser = getCurrentUser();
        Long patientId = prescription.getPatient() != null ? prescription.getPatient().getId() : null;
        String patientName = prescription.getPatient() != null ? prescription.getPatient().getFirstName() : "unknown patient";

        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "DELETE",
                "Prescription",
                prescriptionId,
                "Prescription deleted for patient: " + patientName
        );

        prescriptionRepository.delete(prescription);

        if (patientId != null) {
            notificationService.createNotification(
                    patientId,
                    "Prescription Removed",
                    "A prescription was removed from your treatment plan",
                    NotificationType.GENERAL,
                    "Prescription",
                    prescriptionId
            );
        }
    }

    @Override
    @Transactional
    public void addMedicineToPrescription(Long prescriptionId, PrescriptionMedicine medicine) {
        Prescription prescription = getPrescriptionById(prescriptionId);
        assertCanManage(prescription);

        medicine.setPrescription(prescription);
        prescriptionMedicineRepository.save(medicine);

        UserDetailsImpl currentUser = getCurrentUser();
        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "UPDATE",
                "Prescription",
                prescriptionId,
                "Medicine added to prescription"
        );
    }

    @Override
    @Transactional
    public PrescriptionMedicine updatePrescriptionMedicine(Long prescriptionId, Long prescriptionMedicineId, PrescriptionMedicine medicine) {
        Prescription prescription = getPrescriptionById(prescriptionId);
        assertCanManage(prescription);

        PrescriptionMedicine existing = prescriptionMedicineRepository.findById(prescriptionMedicineId)
                .orElseThrow(() -> new RuntimeException("Prescription medicine not found with ID: " + prescriptionMedicineId));

        if (existing.getPrescription() == null
                || existing.getPrescription().getId() == null
                || !existing.getPrescription().getId().equals(prescriptionId)) {
            throw new AccessDeniedException("This medicine line does not belong to the selected prescription");
        }

        if (medicine.getMedicine() != null && medicine.getMedicine().getId() != null) {
            existing.setMedicine(medicine.getMedicine());
        }
        if (medicine.getDosage() != null) {
            existing.setDosage(medicine.getDosage());
        }
        if (medicine.getFrequency() != null) {
            existing.setFrequency(medicine.getFrequency());
        }
        if (medicine.getDuration() != null) {
            existing.setDuration(medicine.getDuration());
        }
        if (medicine.getInstructions() != null) {
            existing.setInstructions(medicine.getInstructions());
        }
        if (medicine.getQuantity() != null) {
            existing.setQuantity(medicine.getQuantity());
        }

        PrescriptionMedicine updatedMedicine = prescriptionMedicineRepository.save(existing);
        UserDetailsImpl currentUser = getCurrentUser();
        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "UPDATE",
                "PrescriptionMedicine",
                prescriptionMedicineId,
                "Medicine line updated in prescription " + prescriptionId
        );

        return updatedMedicine;
    }

    @Override
    @Transactional
    public void removeMedicineFromPrescription(Long prescriptionId, Long prescriptionMedicineId) {
        Prescription prescription = getPrescriptionById(prescriptionId);
        assertCanManage(prescription);

        PrescriptionMedicine existing = prescriptionMedicineRepository.findById(prescriptionMedicineId)
                .orElseThrow(() -> new RuntimeException("Prescription medicine not found with ID: " + prescriptionMedicineId));

        if (existing.getPrescription() == null
                || existing.getPrescription().getId() == null
                || !existing.getPrescription().getId().equals(prescriptionId)) {
            throw new AccessDeniedException("This medicine line does not belong to the selected prescription");
        }

        prescriptionMedicineRepository.delete(existing);

        UserDetailsImpl currentUser = getCurrentUser();
        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "DELETE",
                "PrescriptionMedicine",
                prescriptionMedicineId,
                "Medicine line removed from prescription " + prescriptionId
        );
    }

    @Override
    public List<PrescriptionMedicine> getPrescriptionMedicines(Long prescriptionId) {
        return prescriptionMedicineRepository.findByPrescriptionId(prescriptionId);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new AccessDeniedException("Authenticated user details were not found");
        }
        return userDetails;
    }

    private void assertCanManage(Prescription prescription) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (User.Role.ADMIN.equals(currentUser.getRole())) {
            return;
        }

        if (User.Role.DOCTOR.equals(currentUser.getRole())
                && prescription.getDoctor() != null
                && prescription.getDoctor().getId() != null
                && prescription.getDoctor().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You can only edit or delete prescriptions that you created");
    }
}