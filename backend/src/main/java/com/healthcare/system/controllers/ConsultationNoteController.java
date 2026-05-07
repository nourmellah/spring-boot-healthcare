package com.healthcare.system.controllers;

import com.healthcare.system.entities.Appointment;
import com.healthcare.system.entities.ConsultationNote;
import com.healthcare.system.repositories.AppointmentRepository;
import com.healthcare.system.repositories.ConsultationNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/consultation-notes")
@CrossOrigin(origins = "*")
public class ConsultationNoteController {

    @Autowired
    private ConsultationNoteRepository consultationNoteRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<ConsultationNote>> getAll() {
        return ResponseEntity.ok(consultationNoteRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ConsultationNote> getById(@PathVariable Long id) {
        return consultationNoteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ConsultationNote> getByAppointment(@PathVariable Long appointmentId) {
        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<ConsultationNote>> getByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(consultationNoteRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<ConsultationNote>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(consultationNoteRepository.findByAppointmentPatientIdOrderByCreatedAtDesc(patientId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ConsultationNote> createOrUpdate(@RequestBody ConsultationNote request) {
        if (request.getAppointment() == null || request.getAppointment().getId() == null) {
            return ResponseEntity.badRequest().build();
        }

        Appointment appointment = appointmentRepository.findById(request.getAppointment().getId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        ConsultationNote note = consultationNoteRepository.findByAppointmentId(appointment.getId())
                .orElseGet(ConsultationNote::new);

        note.setAppointment(appointment);
        note.setDoctor(appointment.getDoctor());
        note.setChiefComplaint(request.getChiefComplaint());
        note.setSymptoms(request.getSymptoms());
        note.setExamination(request.getExamination());
        note.setDiagnosis(request.getDiagnosis());
        note.setTreatment(request.getTreatment());
        note.setFollowUp(request.getFollowUp());

        if (note.getCreatedAt() == null) {
            note.setCreatedAt(LocalDateTime.now());
        }

        ConsultationNote saved = consultationNoteRepository.save(note);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ConsultationNote> update(@PathVariable Long id, @RequestBody ConsultationNote request) {
        return consultationNoteRepository.findById(id)
                .map(existing -> {
                    existing.setChiefComplaint(request.getChiefComplaint());
                    existing.setSymptoms(request.getSymptoms());
                    existing.setExamination(request.getExamination());
                    existing.setDiagnosis(request.getDiagnosis());
                    existing.setTreatment(request.getTreatment());
                    existing.setFollowUp(request.getFollowUp());
                    return ResponseEntity.ok(consultationNoteRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        consultationNoteRepository.deleteById(id);
        return ResponseEntity.ok("Consultation note deleted successfully");
    }
}
