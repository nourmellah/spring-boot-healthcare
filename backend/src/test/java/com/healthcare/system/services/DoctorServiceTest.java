package com.healthcare.system.services;

import com.healthcare.system.entities.Doctor;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.DoctorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DoctorService Unit Tests")
class DoctorServiceTest {

    @Mock private DoctorRepository doctorRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private DoctorServiceImpl doctorService;

    private Doctor buildDoctor(Long id, String firstName, String lastName, String email) {
        Doctor d = new Doctor();
        d.setId(id);
        d.setFirstName(firstName);
        d.setLastName(lastName);
        d.setEmail(email);
        d.setPassword("plainPassword");
        d.setPhone("0698765432");
        d.setRole(User.Role.DOCTOR);
        d.setActive(true);
        d.setLicenseNumber("LIC-" + (id != null ? id : "NEW"));
        d.setYearsOfExperience(10);
        d.setConsultationFee(150.0);
        return d;
    }

    @Nested @DisplayName("registerDoctor")
    class RegisterDoctor {

        @Test @DisplayName("encodes plain-text password before persisting")
        void encodesPassword() {
            Doctor doctor = buildDoctor(null, "John", "Doe", "john@hospital.com");
            Doctor saved = buildDoctor(1L, "John", "Doe", "john@hospital.com");
            saved.setPassword("$2a$10$encodedHash");

            given(passwordEncoder.encode("plainPassword")).willReturn("$2a$10$encodedHash");
            given(doctorRepository.save(any(Doctor.class))).willReturn(saved);

            assertThat(doctorService.registerDoctor(doctor).getId()).isEqualTo(1L);
            verify(passwordEncoder).encode("plainPassword");
        }

        @Test @DisplayName("does not re-encode an already BCrypt-hashed password")
        void skipsEncodingForHashedPassword() {
            Doctor doctor = buildDoctor(null, "Jane", "Smith", "jane@hospital.com");
            doctor.setPassword("$2a$10$alreadyEncoded");
            given(doctorRepository.save(any(Doctor.class))).willReturn(doctor);

            doctorService.registerDoctor(doctor);

            verify(passwordEncoder, never()).encode(anyString());
        }

        @Test @DisplayName("sets active=true and createdAt")
        void setsActiveAndCreatedAt() {
            Doctor doctor = buildDoctor(null, "Mark", "Taylor", "mark@hospital.com");
            doctor.setActive(false);
            Doctor saved = buildDoctor(3L, "Mark", "Taylor", "mark@hospital.com");

            given(passwordEncoder.encode(anyString())).willReturn("$2a$10$hash");
            given(doctorRepository.save(any(Doctor.class))).willReturn(saved);

            doctorService.registerDoctor(doctor);

            ArgumentCaptor<Doctor> captor = ArgumentCaptor.forClass(Doctor.class);
            verify(doctorRepository).save(captor.capture());
            assertThat(captor.getValue().getActive()).isTrue();
            assertThat(captor.getValue().getCreatedAt()).isNotNull();
        }

        @Test @DisplayName("logs a CREATE audit entry")
        void logsAudit() {
            Doctor doctor = buildDoctor(null, "Sara", "Lee", "sara@hospital.com");
            Doctor saved = buildDoctor(4L, "Sara", "Lee", "sara@hospital.com");

            given(passwordEncoder.encode(anyString())).willReturn("$2a$10$hash");
            given(doctorRepository.save(any(Doctor.class))).willReturn(saved);

            doctorService.registerDoctor(doctor);

            verify(auditLogService).logAction(eq(4L), eq("ADMIN"), eq("CREATE"), eq("Doctor"), eq(4L), anyString());
        }
    }

    @Nested @DisplayName("getDoctorById")
    class GetDoctorById {

        @Test @DisplayName("returns doctor when found")
        void returnsDoctor() {
            Doctor doctor = buildDoctor(1L, "John", "Doe", "john@hospital.com");
            given(doctorRepository.findById(1L)).willReturn(Optional.of(doctor));

            assertThat(doctorService.getDoctorById(1L).getFirstName()).isEqualTo("John");
        }

        @Test @DisplayName("throws RuntimeException when not found")
        void throwsWhenNotFound() {
            given(doctorRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> doctorService.getDoctorById(99L))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("getAllDoctors")
    class GetAllDoctors {

        @Test @DisplayName("returns all doctors")
        void returnsAll() {
            given(doctorRepository.findAll()).willReturn(List.of(
                    buildDoctor(1L, "John", "Doe", "john@hospital.com"),
                    buildDoctor(2L, "Jane", "Smith", "jane@hospital.com")
            ));
            assertThat(doctorService.getAllDoctors()).hasSize(2);
        }

        @Test @DisplayName("returns empty list when none exist")
        void returnsEmpty() {
            given(doctorRepository.findAll()).willReturn(List.of());
            assertThat(doctorService.getAllDoctors()).isEmpty();
        }
    }

    @Nested @DisplayName("updateDoctor")
    class UpdateDoctor {

        @Test @DisplayName("updates and returns doctor")
        void updatesDoctor() {
            Doctor doctor = buildDoctor(1L, "John", "Updated", "john@hospital.com");
            given(doctorRepository.existsById(1L)).willReturn(true);
            given(doctorRepository.save(any(Doctor.class))).willReturn(doctor);

            assertThat(doctorService.updateDoctor(doctor).getLastName()).isEqualTo("Updated");
        }

        @Test @DisplayName("throws when doctor not found")
        void throwsWhenNotFound() {
            Doctor doctor = buildDoctor(99L, "Ghost", "Doctor", "ghost@hospital.com");
            given(doctorRepository.existsById(99L)).willReturn(false);
            assertThatThrownBy(() -> doctorService.updateDoctor(doctor))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("deleteDoctor")
    class DeleteDoctor {

        @Test @DisplayName("soft-deletes by setting active=false")
        void softDeletes() {
            Doctor doctor = buildDoctor(1L, "John", "Doe", "john@hospital.com");
            given(doctorRepository.findById(1L)).willReturn(Optional.of(doctor));
            given(doctorRepository.save(any(Doctor.class))).willReturn(doctor);

            doctorService.deleteDoctor(1L);

            ArgumentCaptor<Doctor> captor = ArgumentCaptor.forClass(Doctor.class);
            verify(doctorRepository).save(captor.capture());
            assertThat(captor.getValue().getActive()).isFalse();
        }

        @Test @DisplayName("throws when doctor not found")
        void throwsWhenNotFound() {
            given(doctorRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> doctorService.deleteDoctor(99L))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }
}
