package com.healthcare.system.controllers;

import com.healthcare.system.entities.AuditLog;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.AuditLogRepository;
import com.healthcare.system.repositories.UserRepository;
import com.healthcare.system.repositories.PatientRepository;
import com.healthcare.system.repositories.DoctorRepository;
import com.healthcare.system.repositories.AppointmentRepository;
import com.healthcare.system.security.UserDetailsImpl;
import com.healthcare.system.services.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPatients", patientRepository.count());
        stats.put("totalDoctors", doctorRepository.count());
        stats.put("totalAppointments", appointmentRepository.count());
        stats.put("activePatients", patientRepository.countActivePatients());
        stats.put("activeDoctors", doctorRepository.countActiveDoctors());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setActive(true);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);

                    auditLogService.logAction(
                            getCurrentAdminId(),
                            "ADMIN",
                            "ACTIVATE",
                            "User",
                            user.getId(),
                            "User account activated: " + user.getEmail()
                    );

                    return ResponseEntity.ok(message("User activated successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        return safeDeactivateUser(id, "User deactivated successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return safeDeactivateUser(id, "User safely deactivated. Medical/business records were kept.");
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll());
    }

    @GetMapping("/audit-logs/user/{userId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(auditLogRepository.findByUserId(userId));
    }

    @GetMapping("/audit-logs/entity/{entityType}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(@PathVariable String entityType) {
        return ResponseEntity.ok(auditLogRepository.findByEntity(entityType));
    }

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdminUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String phone = request.get("phone");

        if (userRepository.findByEmail(email).isPresent()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email is already in use");
            return ResponseEntity.badRequest().body(error);
        }

        User admin = new User();
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setPhone(phone);
        admin.setRole(User.Role.ADMIN);
        admin.setActive(true);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());

        userRepository.save(admin);

        auditLogService.logAction(
                getCurrentAdminId(),
                "ADMIN",
                "CREATE",
                "User",
                admin.getId(),
                "Admin user created: " + admin.getEmail()
        );

        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin user created successfully");
        response.put("email", admin.getEmail());
        response.put("role", "ADMIN");

        return ResponseEntity.ok(response);
    }

    private ResponseEntity<?> safeDeactivateUser(Long id, String successMessage) {
        return userRepository.findById(id)
                .map(user -> {
                    assertCanDeactivate(user);

                    if (!Boolean.FALSE.equals(user.getActive())) {
                        user.setActive(false);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        auditLogService.logAction(
                                getCurrentAdminId(),
                                "ADMIN",
                                "DEACTIVATE",
                                "User",
                                user.getId(),
                                "User account deactivated safely: " + user.getEmail()
                        );
                    }

                    return ResponseEntity.ok(message(successMessage));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void assertCanDeactivate(User user) {
        Long currentAdminId = getCurrentAdminId();

        if (currentAdminId != null && currentAdminId.equals(user.getId())) {
            throw new RuntimeException("You cannot deactivate your own admin account while logged in");
        }

        if (User.Role.ADMIN.equals(user.getRole())
                && Boolean.TRUE.equals(user.getActive())
                && activeAdminCount() <= 1) {
            throw new RuntimeException("At least one active admin account must remain");
        }
    }

    private long activeAdminCount() {
        return userRepository.findByRole(User.Role.ADMIN)
                .stream()
                .filter(user -> Boolean.TRUE.equals(user.getActive()))
                .count();
    }

    private Long getCurrentAdminId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            return null;
        }

        return userDetails.getId();
    }

    private Map<String, String> message(String value) {
        Map<String, String> response = new HashMap<>();
        response.put("message", value);
        return response;
    }
}