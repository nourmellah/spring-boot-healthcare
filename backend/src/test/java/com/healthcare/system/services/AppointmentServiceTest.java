package com.healthcare.system.services;

import com.healthcare.system.entities.Appointment;
import com.healthcare.system.entities.Appointment.AppointmentStatus;
import com.healthcare.system.entities.Doctor;
import com.healthcare.system.entities.Patient;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.AppointmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Unit Tests")
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private AppointmentServiceImpl appointmentService;

    private Patient buildPatient(Long id, String firstName) {
        Patient p = new Patient();
        p.setId(id);
        p.setFirstName(firstName);
        p.setLastName("TestLastName");
        p.setEmail(firstName.toLowerCase() + "@example.com");
        p.setPassword("$2a$10$hash");
        p.setPhone("0600000000");
        p.setRole(User.Role.PATIENT);
        p.setActive(true);
        return p;
    }

    private Doctor buildDoctor(Long id, String lastName) {
        Doctor d = new Doctor();
        d.setId(id);
        d.setFirstName("Dr");
        d.setLastName(lastName);
        d.setEmail("dr." + lastName.toLowerCase() + "@hospital.com");
        d.setPassword("$2a$10$hash");
        d.setPhone("0700000000");
        d.setRole(User.Role.DOCTOR);
        d.setActive(true);
        d.setLicenseNumber("LIC-" + id);
        return d;
    }

    private Appointment buildAppointment(Long id, AppointmentStatus status) {
        Appointment a = new Appointment();
        a.setId(id);
        a.setPatient(buildPatient(10L, "Alice"));
        a.setDoctor(buildDoctor(20L, "House"));
        a.setAppointmentDate(LocalDateTime.now().plusDays(3));
        a.setStatus(status);
        a.setReason("Routine check-up");
        return a;
    }

    @Nested @DisplayName("bookAppointment")
    class BookAppointment {

        @Test @DisplayName("saves appointment with PENDING status")
        void savesWithPendingStatus() {
            Appointment incoming = buildAppointment(null, null);
            Appointment saved = buildAppointment(1L, AppointmentStatus.PENDING);
            given(appointmentRepository.save(any(Appointment.class))).willReturn(saved);

            Appointment result = appointmentService.bookAppointment(incoming);

            ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
            verify(appointmentRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(AppointmentStatus.PENDING);
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test @DisplayName("sends notification to the doctor after booking")
        void sendsNotificationToDoctor() {
            Appointment incoming = buildAppointment(null, null);
            Appointment saved = buildAppointment(1L, AppointmentStatus.PENDING);
            given(appointmentRepository.save(any(Appointment.class))).willReturn(saved);

            appointmentService.bookAppointment(incoming);

            verify(notificationService).sendAppointmentNotification(eq(20L), anyString(), anyString(), eq(1L));
        }

        @Test @DisplayName("logs a CREATE audit entry")
        void logsAudit() {
            Appointment incoming = buildAppointment(null, null);
            Appointment saved = buildAppointment(1L, AppointmentStatus.PENDING);
            given(appointmentRepository.save(any(Appointment.class))).willReturn(saved);

            appointmentService.bookAppointment(incoming);

            verify(auditLogService).logAction(eq(10L), eq("PATIENT"), eq("CREATE"), eq("Appointment"), eq(1L), anyString());
        }
    }

    @Nested @DisplayName("getAppointmentById")
    class GetAppointmentById {

        @Test @DisplayName("returns appointment when found")
        void returnsAppointment() {
            Appointment appointment = buildAppointment(1L, AppointmentStatus.PENDING);
            given(appointmentRepository.findById(1L)).willReturn(Optional.of(appointment));

            assertThat(appointmentService.getAppointmentById(1L).getStatus()).isEqualTo(AppointmentStatus.PENDING);
        }

        @Test @DisplayName("throws RuntimeException when not found")
        void throwsWhenNotFound() {
            given(appointmentRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> appointmentService.getAppointmentById(99L))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("updateAppointmentStatus")
    class UpdateAppointmentStatus {

        @Test @DisplayName("updates status to CONFIRMED")
        void updatesStatus() {
            Appointment existing = buildAppointment(1L, AppointmentStatus.PENDING);
            Appointment updated = buildAppointment(1L, AppointmentStatus.CONFIRMED);
            given(appointmentRepository.findById(1L)).willReturn(Optional.of(existing));
            given(appointmentRepository.save(any(Appointment.class))).willReturn(updated);

            assertThat(appointmentService.updateAppointmentStatus(1L, AppointmentStatus.CONFIRMED).getStatus())
                    .isEqualTo(AppointmentStatus.CONFIRMED);
        }

        @Test @DisplayName("throws when appointment not found")
        void throwsWhenNotFound() {
            given(appointmentRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> appointmentService.updateAppointmentStatus(99L, AppointmentStatus.CONFIRMED))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("cancelAppointment")
    class CancelAppointment {

        @Test @DisplayName("sets status to CANCELLED")
        void setsStatusToCancelled() {
            Appointment appointment = buildAppointment(1L, AppointmentStatus.PENDING);
            given(appointmentRepository.findById(1L)).willReturn(Optional.of(appointment));
            given(appointmentRepository.save(any(Appointment.class))).willReturn(appointment);

            appointmentService.cancelAppointment(1L);

            ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
            verify(appointmentRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        }

        @Test @DisplayName("notifies both patient and doctor")
        void notifiesBothParties() {
            Appointment appointment = buildAppointment(1L, AppointmentStatus.PENDING);
            given(appointmentRepository.findById(1L)).willReturn(Optional.of(appointment));
            given(appointmentRepository.save(any(Appointment.class))).willReturn(appointment);

            appointmentService.cancelAppointment(1L);

            verify(notificationService).sendAppointmentNotification(eq(10L), anyString(), anyString(), eq(1L));
            verify(notificationService).sendAppointmentNotification(eq(20L), anyString(), anyString(), eq(1L));
        }

        @Test @DisplayName("throws when appointment not found")
        void throwsWhenNotFound() {
            given(appointmentRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> appointmentService.cancelAppointment(99L))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }
}
