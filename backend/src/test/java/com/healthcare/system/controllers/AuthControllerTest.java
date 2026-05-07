package com.healthcare.system.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.system.config.SecurityConfig;
import com.healthcare.system.dto.LoginRequest;
import com.healthcare.system.dto.RegisterRequest;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.UserRepository;
import com.healthcare.system.security.AuthEntryPointJwt;
import com.healthcare.system.security.JwtUtils;
import com.healthcare.system.security.UserDetailsImpl;
import com.healthcare.system.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link AuthController} using MockMvc.
 *
 * /api/auth/** is permitAll in SecurityConfig, so these tests focus on
 * the controller's own logic (credential validation, role guard, etc.).
 *
 * All POST requests include .with(csrf()) because Spring Security's CSRF
 * protection is active in @WebMvcTest by default.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ── Beans required by the security filter chain ───────────────────────────
    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtUtils jwtUtils;

    // AuthTokenFilter autowires these directly — must be mocked in @WebMvcTest
    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private AuthEntryPointJwt authEntryPointJwt;

    // ── Shared helpers ────────────────────────────────────────────────────────

    private UserDetailsImpl buildUserDetails(Long id, String email, User.Role role) {
        return new UserDetailsImpl(
                id, "First", "Last", email, "$2a$10$hash", role, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
        );
    }

    private Authentication buildAuthentication(UserDetailsImpl userDetails) {
        return new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 with JWT token for valid credentials")
        void returnsTokenForValidCredentials() throws Exception {
            LoginRequest request = new LoginRequest("doctor@hospital.com", "password123");
            UserDetailsImpl userDetails = buildUserDetails(1L, "doctor@hospital.com", User.Role.DOCTOR);
            Authentication auth = buildAuthentication(userDetails);

            given(authenticationManager.authenticate(any())).willReturn(auth);
            given(jwtUtils.generateJwtToken(auth)).willReturn("mocked.jwt.token");

            mockMvc.perform(post("/api/auth/login")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                    .andExpect(jsonPath("$.email").value("doctor@hospital.com"))
                    .andExpect(jsonPath("$.role").value("DOCTOR"))
                    .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        @DisplayName("returns 401 with error message for invalid credentials")
        void returns401ForInvalidCredentials() throws Exception {
            LoginRequest request = new LoginRequest("wrong@example.com", "wrongpassword");

            given(authenticationManager.authenticate(any()))
                    .willThrow(new BadCredentialsException("Bad credentials"));

            mockMvc.perform(post("/api/auth/login")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Invalid email or password"));
        }

        @Test
        @DisplayName("returns 401 when authentication manager throws any exception")
        void returns401ForAnyAuthException() throws Exception {
            LoginRequest request = new LoginRequest("user@example.com", "anypassword");

            given(authenticationManager.authenticate(any()))
                    .willThrow(new RuntimeException("User account is locked"));

            mockMvc.perform(post("/api/auth/login")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").exists());
        }
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("returns 200 with success message for valid PATIENT registration")
        void returnsSuccessForValidPatientRegistration() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "Alice", "Smith", "alice@example.com", "Password1!", "0612345678", User.Role.PATIENT
            );

            given(userRepository.findByEmail("alice@example.com")).willReturn(Optional.empty());
            given(passwordEncoder.encode("Password1!")).willReturn("$2a$10$encodedHash");
            given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));

            mockMvc.perform(post("/api/auth/register")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("User registered successfully"))
                    .andExpect(jsonPath("$.email").value("alice@example.com"))
                    .andExpect(jsonPath("$.role").value("PATIENT"));
        }

        @Test
        @DisplayName("returns 400 when email is already in use")
        void returns400WhenEmailAlreadyExists() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "Bob", "Jones", "existing@example.com", "Password1!", "0612345678", User.Role.PATIENT
            );

            User existingUser = new User();
            existingUser.setEmail("existing@example.com");
            given(userRepository.findByEmail("existing@example.com"))
                    .willReturn(Optional.of(existingUser));

            mockMvc.perform(post("/api/auth/register")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Email is already in use"));
        }

        @Test
        @DisplayName("returns 403 when attempting to self-assign ADMIN role")
        void returns403WhenRegisteringAsAdmin() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "Evil", "Hacker", "hacker@example.com", "Password1!", "0612345678", User.Role.ADMIN
            );

            given(userRepository.findByEmail("hacker@example.com")).willReturn(Optional.empty());

            mockMvc.perform(post("/api/auth/register")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.error").value(
                            containsString("Cannot self-assign ADMIN role")));
        }

        @Test
        @DisplayName("defaults to PATIENT role when no role is specified")
        void defaultsToPatientRoleWhenRoleIsNull() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "Carol", "White", "carol@example.com", "Password1!", "0612345678", null
            );

            given(userRepository.findByEmail("carol@example.com")).willReturn(Optional.empty());
            given(passwordEncoder.encode(anyString())).willReturn("$2a$10$hash");
            given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));

            mockMvc.perform(post("/api/auth/register")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("PATIENT"));
        }
    }
}
