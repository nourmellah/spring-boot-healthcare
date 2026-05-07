package com.healthcare.system.controllers;

import com.healthcare.system.entities.AuditLog;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.AuditLogRepository;
import com.healthcare.system.repositories.UserRepository;
import com.healthcare.system.repositories.PatientRepository;
import com.healthcare.system.repositories.DoctorRepository;
import com.healthcare.system.repositories.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
                    userRepository.save(user);
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "User activated successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setActive(false);
                    userRepository.save(user);
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "User deactivated successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "User deleted successfully");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }
    
    @GetMapping("/audit-logs/user/{userId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(auditLogRepository.findByUserIdOrderByTimestampDesc(userId));
    }
    
    @GetMapping("/audit-logs/entity/{entityType}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(@PathVariable String entityType) {
        return ResponseEntity.ok(auditLogRepository.findByEntityOrderByTimestampDesc(entityType));
    }
    
    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdminUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String phone = request.get("phone");
        
        // Check if email already exists
        if (userRepository.findByEmail(email).isPresent()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email is already in use");
            return ResponseEntity.badRequest().body(error);
        }
        
        // Create new admin user
        User admin = new User();
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password)); // Encode password
        admin.setPhone(phone);
        admin.setRole(User.Role.ADMIN);
        admin.setActive(true);
        admin.setCreatedAt(java.time.LocalDateTime.now());
        admin.setUpdatedAt(java.time.LocalDateTime.now());
        
        userRepository.save(admin);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin user created successfully");
        response.put("email", admin.getEmail());
        response.put("role", "ADMIN");
        
        return ResponseEntity.ok(response);
    }
}
