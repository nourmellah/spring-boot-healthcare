package com.healthcare.system.services;

import com.healthcare.system.entities.Patient;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientService Unit Tests")
class PatientServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private PatientServiceImpl patientService;

    private Patient buildPatient(Long id, String firstName, String lastName, String email) {
        Patient p = new Patient();
        p.setId(id);
        p.setFirstName(firstName);
        p.setLastName(lastName);
        p.setEmail(email);
        p.setPassword("plainPassword");
        p.setPhone("0612345678");
        p.setRole(User.Role.PATIENT);
        p.setActive(true);
        p.setDateOfBirth(LocalDate.of(1990, 5, 15));
        p.setBloodGroup("A+");
        return p;
    }

    @Nested @DisplayName("registerPatient")
    class RegisterPatient {

        @Test @DisplayName("encodes plain-text password before persisting")
        void encodesPassword() {
            Patient patient = buildPatient(null, "Alice", "Smith", "alice@example.com");
            Patient saved = buildPatient(1L, "Alice", "Smith", "alice@example.com");
            saved.setPassword("$2a$10$encodedHash");

            given(passwordEncoder.encode("plainPassword")).willReturn("$2a$10$encodedHash");
            given(patientRepository.save(any(Patient.class))).willReturn(saved);

            Patient result = patientService.registerPatient(patient);

            verify(passwordEncoder).encode("plainPassword");
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test @DisplayName("does not re-encode an already BCrypt-hashed password")
        void skipsEncodingForHashedPassword() {
            Patient patient = buildPatient(null, "Bob", "Jones", "bob@example.com");
            patient.setPassword("$2a$10$alreadyEncoded");
            given(patientRepository.save(any(Patient.class))).willReturn(patient);

            patientService.registerPatient(patient);

            verify(passwordEncoder, never()).encode(anyString());
        }

        @Test @DisplayName("sets active=true and createdAt")
        void setsActiveAndCreatedAt() {
            Patient patient = buildPatient(null, "Carol", "White", "carol@example.com");
            patient.setActive(false);
            Patient saved = buildPatient(3L, "Carol", "White", "carol@example.com");

            given(passwordEncoder.encode(anyString())).willReturn("$2a$10$hash");
            given(patientRepository.save(any(Patient.class))).willReturn(saved);

            patientService.registerPatient(patient);

            ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
            verify(patientRepository).save(captor.capture());
            assertThat(captor.getValue().getActive()).isTrue();
            assertThat(captor.getValue().getCreatedAt()).isNotNull();
        }

        @Test @DisplayName("logs a CREATE audit entry")
        void logsAudit() {
            Patient patient = buildPatient(null, "Dave", "Brown", "dave@example.com");
            Patient saved = buildPatient(4L, "Dave", "Brown", "dave@example.com");

            given(passwordEncoder.encode(anyString())).willReturn("$2a$10$hash");
            given(patientRepository.save(any(Patient.class))).willReturn(saved);

            patientService.registerPatient(patient);

            verify(auditLogService).logAction(eq(4L), eq("PATIENT"), eq("CREATE"), eq("Patient"), eq(4L), anyString());
        }
    }

    @Nested @DisplayName("getPatientById")
    class GetPatientById {

        @Test @DisplayName("returns patient when found")
        void returnsPatient() {
            Patient patient = buildPatient(1L, "Eve", "Green", "eve@example.com");
            given(patientRepository.findById(1L)).willReturn(Optional.of(patient));

            assertThat(patientService.getPatientById(1L).getFirstName()).isEqualTo("Eve");
        }

        @Test @DisplayName("throws RuntimeException when not found")
        void throwsWhenNotFound() {
            given(patientRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> patientService.getPatientById(99L))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("getAllPatients")
    class GetAllPatients {

        @Test @DisplayName("returns all patients")
        void returnsAll() {
            given(patientRepository.findAll()).willReturn(List.of(
                    buildPatient(1L, "Alice", "Smith", "alice@example.com"),
                    buildPatient(2L, "Bob", "Jones", "bob@example.com")
            ));
            assertThat(patientService.getAllPatients()).hasSize(2);
        }

        @Test @DisplayName("returns empty list when none exist")
        void returnsEmpty() {
            given(patientRepository.findAll()).willReturn(List.of());
            assertThat(patientService.getAllPatients()).isEmpty();
        }
    }

    @Nested @DisplayName("updatePatient")
    class UpdatePatient {

        @Test @DisplayName("updates and returns patient")
        void updatesPatient() {
            Patient patient = buildPatient(1L, "Alice", "Updated", "alice@example.com");
            given(patientRepository.existsById(1L)).willReturn(true);
            given(patientRepository.save(any(Patient.class))).willReturn(patient);

            assertThat(patientService.updatePatient(patient).getLastName()).isEqualTo("Updated");
        }

        @Test @DisplayName("throws when patient not found")
        void throwsWhenNotFound() {
            Patient patient = buildPatient(99L, "Ghost", "User", "ghost@example.com");
            given(patientRepository.existsById(99L)).willReturn(false);
            assertThatThrownBy(() -> patientService.updatePatient(patient))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("deletePatient")
    class DeletePatient {

        @Test @DisplayName("soft-deletes by setting active=false")
        void softDeletes() {
            Patient patient = buildPatient(1L, "Alice", "Smith", "alice@example.com");
            given(patientRepository.findById(1L)).willReturn(Optional.of(patient));
            given(patientRepository.save(any(Patient.class))).willReturn(patient);

            patientService.deletePatient(1L);

            ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
            verify(patientRepository).save(captor.capture());
            assertThat(captor.getValue().getActive()).isFalse();
        }

        @Test @DisplayName("throws when patient not found")
        void throwsWhenNotFound() {
            given(patientRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> patientService.deletePatient(99L))
                    .isInstanceOf(RuntimeException.class).hasMessageContaining("99");
        }
    }

    @Nested @DisplayName("searchPatients")
    class SearchPatients {

        @Test @DisplayName("delegates to repository with correct term")
        void delegatesToRepository() {
            given(patientRepository.findByFirstNameContainingOrLastNameContaining("ali", "ali"))
                    .willReturn(List.of(buildPatient(1L, "Alice", "Smith", "alice@example.com")));

            assertThat(patientService.searchPatients("ali")).hasSize(1);
            verify(patientRepository).findByFirstNameContainingOrLastNameContaining("ali", "ali");
        }
    }
}
