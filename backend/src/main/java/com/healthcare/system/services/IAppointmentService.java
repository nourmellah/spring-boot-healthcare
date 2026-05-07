package com.healthcare.system.services;

import com.healthcare.system.entities.Appointment;
import com.healthcare.system.entities.Appointment.AppointmentStatus;
import java.time.LocalDateTime;
import java.util.List;

public interface IAppointmentService {
    
    Appointment bookAppointment(Appointment appointment);
    
    Appointment getAppointmentById(Long id);
    
    List<Appointment> getAllAppointments();
    
    List<Appointment> getPatientAppointments(Long patientId);
    
    List<Appointment> getDoctorAppointments(Long doctorId);
    
    Appointment updateAppointmentStatus(Long appointmentId, AppointmentStatus status);
    
    Appointment updateAppointment(Appointment appointment);
    
    void cancelAppointment(Long appointmentId);
    
    List<Appointment> getAppointmentsByStatus(AppointmentStatus status);
    
    List<Appointment> getDoctorAppointmentsBetweenDates(Long doctorId, LocalDateTime startDate, LocalDateTime endDate);
    
    Long getPendingAppointmentsCount();
}
