package com.healthcare.system.config;

import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataBootstrap implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Value("${bootstrap.admin.email}")
    private String adminEmail;
    
    @Value("${bootstrap.admin.password}")
    private String adminPassword;
    
    @Value("${bootstrap.admin.firstName}")
    private String adminFirstName;
    
    @Value("${bootstrap.admin.lastName}")
    private String adminLastName;
    
    @Value("${bootstrap.admin.phone}")
    private String adminPhone;
    
    @Override
    public void run(String... args) throws Exception {
        // Check if admin already exists
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            // Create bootstrap admin user
            User admin = new User();
            admin.setFirstName(adminFirstName);
            admin.setLastName(adminLastName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setPhone(adminPhone);
            admin.setRole(User.Role.ADMIN);
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(admin);
            
            System.out.println("═══════════════════════════════════════════════════════");
            System.out.println("🔐 BOOTSTRAP ADMIN CREATED SUCCESSFULLY");
            System.out.println("═══════════════════════════════════════════════════════");
            System.out.println("📧 Email: " + adminEmail);
            System.out.println("🔑 Password: " + adminPassword);
            System.out.println("👤 Role: ADMIN");
            System.out.println("═══════════════════════════════════════════════════════");
            System.out.println("⚠️  IMPORTANT: Change this password immediately after first login!");
            System.out.println("═══════════════════════════════════════════════════════");
        } else {
            System.out.println("✅ Bootstrap admin already exists. Skipping creation.");
        }
    }
}
