package com.healthcare.system.services;

import com.healthcare.system.entities.Appointment;
import com.healthcare.system.entities.Appointment.AppointmentStatus;
import com.healthcare.system.entities.Notification.NotificationType;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.AppointmentRepository;
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
public class AppointmentServiceImpl implements IAppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Override
    @Transactional
    public Appointment bookAppointment(Appointment appointment) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (User.Role.PATIENT.equals(currentUser.getRole())) {
            Long requestedPatientId = appointment.getPatient() != null ? appointment.getPatient().getId() : null;
            if (requestedPatientId == null || !requestedPatientId.equals(currentUser.getId())) {
                throw new AccessDeniedException("Patients can only book appointments for themselves");
            }
        }

        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment savedAppointment = appointmentRepository.save(appointment);

        notificationService.sendAppointmentNotification(
                savedAppointment.getDoctor().getId(),
                "New Appointment Request",
                "New appointment request from " + savedAppointment.getPatient().getFirstName(),
                savedAppointment.getId()
        );

        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "CREATE",
                "Appointment",
                savedAppointment.getId(),
                "Appointment booked with Dr. " + savedAppointment.getDoctor().getLastName()
        );

        return savedAppointment;
    }

    @Override
    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));
    }

    @Override
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Override
    public List<Appointment> getPatientAppointments(Long patientId) {
        return appointmentRepository.findPatientAppointmentsOrderedByDate(patientId);
    }

    @Override
    public List<Appointment> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    @Override
    @Transactional
    public Appointment updateAppointmentStatus(Long appointmentId, AppointmentStatus status) {
        Appointment appointment = getAppointmentById(appointmentId);
        assertCanUpdateStatus(appointment, status);

        appointment.setStatus(status);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment updatedAppointment = appointmentRepository.save(appointment);

        String message = status == AppointmentStatus.CONFIRMED
                ? "Your appointment has been confirmed"
                : "Your appointment status has been updated to " + status;

        notificationService.sendAppointmentNotification(
                updatedAppointment.getPatient().getId(),
                "Appointment Status Update",
                message,
                appointmentId
        );

        UserDetailsImpl currentUser = getCurrentUser();
        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "UPDATE",
                "Appointment",
                appointmentId,
                "Appointment status changed to " + status
        );

        return updatedAppointment;
    }

    @Override
    @Transactional
    public Appointment updateAppointment(Appointment appointment) {
        Appointment existing = getAppointmentById(appointment.getId());
        assertCanEdit(existing);

        if (appointment.getAppointmentDate() != null) {
            existing.setAppointmentDate(appointment.getAppointmentDate());
        }
        if (appointment.getReason() != null) {
            existing.setReason(appointment.getReason());
        }
        if (appointment.getNotes() != null) {
            existing.setNotes(appointment.getNotes());
        }

        existing.setUpdatedAt(LocalDateTime.now());
        Appointment updatedAppointment = appointmentRepository.save(existing);

        UserDetailsImpl currentUser = getCurrentUser();
        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "UPDATE",
                "Appointment",
                updatedAppointment.getId(),
                "Appointment details updated"
        );

        notifyAppointmentEdited(updatedAppointment, currentUser);

        return updatedAppointment;
    }

    @Override
    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);
        assertCanCancel(appointment);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            return appointment;
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment cancelledAppointment = appointmentRepository.save(appointment);

        notificationService.createNotification(
                appointment.getPatient().getId(),
                "Appointment Cancelled",
                "Your appointment has been cancelled",
                NotificationType.APPOINTMENT_CANCELLED,
                "Appointment",
                appointmentId
        );

        notificationService.createNotification(
                appointment.getDoctor().getId(),
                "Appointment Cancelled",
                "Appointment with " + appointment.getPatient().getFirstName() + " has been cancelled",
                NotificationType.APPOINTMENT_CANCELLED,
                "Appointment",
                appointmentId
        );

        UserDetailsImpl currentUser = getCurrentUser();
        auditLogService.logAction(
                currentUser.getId(),
                currentUser.getRole().name(),
                "UPDATE",
                "Appointment",
                appointmentId,
                "Appointment cancelled"
        );

        return cancelledAppointment;
    }

    @Override
    public List<Appointment> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status);
    }

    @Override
    public List<Appointment> getDoctorAppointmentsBetweenDates(Long doctorId, LocalDateTime startDate, LocalDateTime endDate) {
        return appointmentRepository.findDoctorAppointmentsBetweenDates(doctorId, startDate, endDate);
    }

    @Override
    public Long getPendingAppointmentsCount() {
        return appointmentRepository.countByStatus(AppointmentStatus.PENDING);
    }

    private void notifyAppointmentEdited(Appointment appointment, UserDetailsImpl currentUser) {
        if (User.Role.PATIENT.equals(currentUser.getRole())) {
            notificationService.createNotification(
                    appointment.getDoctor().getId(),
                    "Appointment Updated",
                    "Appointment details were updated by " + appointment.getPatient().getFirstName(),
                    NotificationType.GENERAL,
                    "Appointment",
                    appointment.getId()
            );
            return;
        }

        notificationService.createNotification(
                appointment.getPatient().getId(),
                "Appointment Updated",
                "Your appointment details have been updated",
                NotificationType.GENERAL,
                "Appointment",
                appointment.getId()
        );
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new AccessDeniedException("Authenticated user details were not found");
        }
        return userDetails;
    }

    private void assertCanUpdateStatus(Appointment appointment, AppointmentStatus targetStatus) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (appointment.getStatus() == AppointmentStatus.CANCELLED && targetStatus != AppointmentStatus.CANCELLED) {
            throw new AccessDeniedException("Cancelled appointments cannot be reopened from the status action");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED && targetStatus != AppointmentStatus.COMPLETED) {
            throw new AccessDeniedException("Completed appointments cannot be reopened from the status action");
        }

        if (User.Role.ADMIN.equals(currentUser.getRole())) {
            return;
        }

        if (User.Role.DOCTOR.equals(currentUser.getRole()) && isAssignedDoctor(appointment, currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to update this appointment status");
    }

    private void assertCanEdit(Appointment appointment) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new AccessDeniedException("Completed or cancelled appointments cannot be edited");
        }

        if (User.Role.ADMIN.equals(currentUser.getRole())) {
            return;
        }

        if (User.Role.DOCTOR.equals(currentUser.getRole()) && isAssignedDoctor(appointment, currentUser.getId())) {
            return;
        }

        if (User.Role.PATIENT.equals(currentUser.getRole())
                && isOwnerPatient(appointment, currentUser.getId())
                && appointment.getStatus() == AppointmentStatus.PENDING) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to edit this appointment");
    }

    private void assertCanCancel(Appointment appointment) {
        UserDetailsImpl currentUser = getCurrentUser();

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new AccessDeniedException("Completed appointments cannot be cancelled");
        }

        if (User.Role.ADMIN.equals(currentUser.getRole())) {
            return;
        }

        if (User.Role.DOCTOR.equals(currentUser.getRole()) && isAssignedDoctor(appointment, currentUser.getId())) {
            return;
        }

        if (User.Role.PATIENT.equals(currentUser.getRole()) && isOwnerPatient(appointment, currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to cancel this appointment");
    }

    private boolean isAssignedDoctor(Appointment appointment, Long userId) {
        return appointment.getDoctor() != null
                && appointment.getDoctor().getId() != null
                && appointment.getDoctor().getId().equals(userId);
    }

    private boolean isOwnerPatient(Appointment appointment, Long userId) {
        return appointment.getPatient() != null
                && appointment.getPatient().getId() != null
                && appointment.getPatient().getId().equals(userId);
    }
}