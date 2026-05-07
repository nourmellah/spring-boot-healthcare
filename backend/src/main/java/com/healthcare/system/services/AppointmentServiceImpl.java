package com.healthcare.system.services;

import com.healthcare.system.entities.Appointment;
import com.healthcare.system.entities.Appointment.AppointmentStatus;
import com.healthcare.system.repositories.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Send notification to doctor
        notificationService.sendAppointmentNotification(
            savedAppointment.getDoctor().getId(),
            "New Appointment Request",
            "New appointment request from " + savedAppointment.getPatient().getFirstName(),
            savedAppointment.getId()
        );
        
        // Log the action
        auditLogService.logAction(
            savedAppointment.getPatient().getId(),
            "PATIENT",
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
        appointment.setStatus(status);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Send notification to patient
        String message = status == AppointmentStatus.CONFIRMED 
            ? "Your appointment has been confirmed" 
            : "Your appointment status has been updated to " + status;
            
        notificationService.sendAppointmentNotification(
            updatedAppointment.getPatient().getId(),
            "Appointment Status Update",
            message,
            appointmentId
        );
        
        // Log the action
        auditLogService.logAction(
            updatedAppointment.getDoctor().getId(),
            "DOCTOR",
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
        if (!appointmentRepository.existsById(appointment.getId())) {
            throw new RuntimeException("Appointment not found with ID: " + appointment.getId());
        }
        
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }
    
    @Override
    @Transactional
    public void cancelAppointment(Long appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);
        
        // Notify both patient and doctor
        notificationService.sendAppointmentNotification(
            appointment.getPatient().getId(),
            "Appointment Cancelled",
            "Your appointment has been cancelled",
            appointmentId
        );
        
        notificationService.sendAppointmentNotification(
            appointment.getDoctor().getId(),
            "Appointment Cancelled",
            "Appointment with " + appointment.getPatient().getFirstName() + " has been cancelled",
            appointmentId
        );
        
        // Log the action
        auditLogService.logAction(
            appointment.getPatient().getId(),
            "PATIENT",
            "UPDATE",
            "Appointment",
            appointmentId,
            "Appointment cancelled"
        );
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
}
