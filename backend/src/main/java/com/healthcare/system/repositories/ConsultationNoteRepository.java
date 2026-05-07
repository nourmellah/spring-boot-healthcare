package com.healthcare.system.repositories;

import com.healthcare.system.entities.ConsultationNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationNoteRepository extends JpaRepository<ConsultationNote, Long> {

    Optional<ConsultationNote> findByAppointmentId(Long appointmentId);

    List<ConsultationNote> findByDoctorId(Long doctorId);

    List<ConsultationNote> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<ConsultationNote> findByAppointmentPatientIdOrderByCreatedAtDesc(Long patientId);
}
