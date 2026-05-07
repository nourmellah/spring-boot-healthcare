package com.healthcare.system.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.system.entities.Patient;
import com.healthcare.system.entities.User;
import com.healthcare.system.config.SecurityConfig;
import com.healthcare.system.security.AuthEntryPointJwt;
import com.healthcare.system.security.JwtUtils;
import com.healthcare.system.security.UserDetailsImpl;
import com.healthcare.system.security.UserDetailsServiceImpl;
import com.healthcare.system.services.IPatientService;
import org.springframework.context.annotation.Import;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link PatientController} using MockMvc.
 *
 * Tests verify that Spring Security's @PreAuthorize rules are enforced correctly:
 * - Unauthenticated requests → 401
 * - Wrong role → 403
 * - Correct role → 200/201
 *
 * Note: POST/DELETE requests include .with(csrf()) because Spring Security's CSRF
 * protection is active in @WebMvcTest by default. Without a CSRF token, mutating
 * requests from unauthenticated clients return 403 (CSRF rejection before auth check).
 */
@WebMvcTest(PatientController.class)
@Import(SecurityConfig.class)
@DisplayName("PatientController Integration Tests")
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IPatientService patientService;

    // Required by the security filter chain loaded in @WebMvcTest
    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    // AuthTokenFilter also autowires AuthEntryPointJwt
    @MockBean
    private AuthEntryPointJwt authEntryPointJwt;

    @org.junit.jupiter.api.BeforeEach
    void configureMocks() throws Exception {
        // Make the mocked AuthEntryPointJwt actually send a 401 response,
        // otherwise unauthenticated requests pass through silently.
        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.http.HttpServletResponse response = invocation.getArgument(1);
            response.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            return null;
        }).when(authEntryPointJwt).commence(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private Patient buildPatient(Long id, String firstName, String lastName) {
        Patient p = new Patient();
        p.setId(id);
        p.setFirstName(firstName);
        p.setLastName(lastName);
        p.setEmail(firstName.toLowerCase() + "@example.com");
        p.setPassword("$2a$10$hash");
        p.setPhone("0612345678");
        p.setRole(User.Role.PATIENT);
        p.setActive(true);
        p.setDateOfBirth(LocalDate.of(1990, 1, 1));
        p.setBloodGroup("O+");
        return p;
    }

    /**
     * Build a UserDetailsImpl with the correct ROLE_ prefixed authority.
     * Spring Security's hasRole/hasAnyRole checks strip the ROLE_ prefix,
     * so the authority must be stored as "ROLE_DOCTOR" etc.
     */
    private UserDetailsImpl doctorPrincipal() {
        return new UserDetailsImpl(
                2L, "Dr", "House", "house@hospital.com", "$2a$10$hash",
                User.Role.DOCTOR, true,
                List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
        );
    }

    private UserDetailsImpl patientPrincipal() {
        return new UserDetailsImpl(
                3L, "Alice", "Smith", "alice@example.com", "$2a$10$hash",
                User.Role.PATIENT, true,
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))
        );
    }

    private UserDetailsImpl adminPrincipal() {
        return new UserDetailsImpl(
                1L, "System", "Admin", "admin@hospital.com", "$2a$10$hash",
                User.Role.ADMIN, true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    // ── GET /api/patients ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/patients")
    class GetAllPatients {

        @Test
        @DisplayName("returns 401 when request has no authentication")
        void returns401WhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/patients"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("returns 200 with patient list when authenticated as DOCTOR")
        void returns200ForDoctorRole() throws Exception {
            List<Patient> patients = List.of(
                    buildPatient(1L, "Alice", "Smith"),
                    buildPatient(2L, "Bob", "Jones")
            );
            given(patientService.getAllPatients()).willReturn(patients);

            mockMvc.perform(get("/api/patients")
                            .with(user(doctorPrincipal())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].firstName").value("Alice"))
                    .andExpect(jsonPath("$[1].firstName").value("Bob"));
        }

        @Test
        @DisplayName("returns 200 with patient list when authenticated as ADMIN")
        void returns200ForAdminRole() throws Exception {
            given(patientService.getAllPatients()).willReturn(List.of(buildPatient(1L, "Alice", "Smith")));

            mockMvc.perform(get("/api/patients")
                            .with(user(adminPrincipal())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        @DisplayName("returns 403 when authenticated as PATIENT (insufficient role)")
        void returns403ForPatientRole() throws Exception {
            mockMvc.perform(get("/api/patients")
                            .with(user(patientPrincipal())))
                    .andExpect(status().isForbidden());
        }
    }

    // ── GET /api/patients/{id} ────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/patients/{id}")
    class GetPatientById {

        @Test
        @DisplayName("returns 200 with patient data when authenticated as DOCTOR")
        void returns200ForDoctorRole() throws Exception {
            Patient patient = buildPatient(1L, "Alice", "Smith");
            given(patientService.getPatientById(1L)).willReturn(patient);

            mockMvc.perform(get("/api/patients/1")
                            .with(user(doctorPrincipal())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.firstName").value("Alice"));
        }

        @Test
        @DisplayName("returns 200 when authenticated as PATIENT (can view own record)")
        void returns200ForPatientRole() throws Exception {
            Patient patient = buildPatient(3L, "Alice", "Smith");
            given(patientService.getPatientById(3L)).willReturn(patient);

            mockMvc.perform(get("/api/patients/3")
                            .with(user(patientPrincipal())))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 401 when unauthenticated")
        void returns401WhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/patients/1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ── POST /api/patients ────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/patients")
    class RegisterPatient {

        @Test
        @DisplayName("returns 201 with created patient when authenticated as ADMIN")
        void returns201ForAdminRole() throws Exception {
            Patient incoming = buildPatient(null, "New", "Patient");
            Patient saved = buildPatient(10L, "New", "Patient");

            given(patientService.registerPatient(any(Patient.class))).willReturn(saved);

            mockMvc.perform(post("/api/patients")
                            .with(user(adminPrincipal()))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(incoming)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(10))
                    .andExpect(jsonPath("$.firstName").value("New"));
        }

        @Test
        @DisplayName("returns 201 when authenticated as PATIENT (self-registration)")
        void returns201ForPatientRole() throws Exception {
            Patient incoming = buildPatient(null, "Self", "Register");
            Patient saved = buildPatient(11L, "Self", "Register");

            given(patientService.registerPatient(any(Patient.class))).willReturn(saved);

            mockMvc.perform(post("/api/patients")
                            .with(user(patientPrincipal()))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(incoming)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("returns 403 when authenticated as DOCTOR (not allowed to register patients)")
        void returns403ForDoctorRole() throws Exception {
            Patient incoming = buildPatient(null, "New", "Patient");

            mockMvc.perform(post("/api/patients")
                            .with(user(doctorPrincipal()))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(incoming)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 401 when unauthenticated (no credentials provided)")
        void returns401WhenUnauthenticated() throws Exception {
            // Without authentication, the security filter chain rejects with 401.
            // Note: SecurityConfig disables CSRF, so the auth check runs first.
            Patient incoming = buildPatient(null, "New", "Patient");

            mockMvc.perform(post("/api/patients")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(incoming)))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ── DELETE /api/patients/{id} ─────────────────────────────────────────────

    @Nested
    @DisplayName("DELETE /api/patients/{id}")
    class DeletePatient {

        @Test
        @DisplayName("returns 200 when authenticated as ADMIN")
        void returns200ForAdminRole() throws Exception {
            mockMvc.perform(delete("/api/patients/1")
                            .with(user(adminPrincipal()))
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("deactivated")));
        }

        @Test
        @DisplayName("returns 403 when authenticated as DOCTOR")
        void returns403ForDoctorRole() throws Exception {
            mockMvc.perform(delete("/api/patients/1")
                            .with(user(doctorPrincipal()))
                            .with(csrf()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 403 when authenticated as PATIENT")
        void returns403ForPatientRole() throws Exception {
            mockMvc.perform(delete("/api/patients/1")
                            .with(user(patientPrincipal()))
                            .with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }
}
