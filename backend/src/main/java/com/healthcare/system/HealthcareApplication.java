package com.healthcare.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HealthcareApplication {

    public static void main(String[] args) {
        SpringApplication.run(HealthcareApplication.class, args);
        System.out.println("🏥 Healthcare Management System Started Successfully!");
        System.out.println("📍 Server running on: http://localhost:8080");
        System.out.println("🔐 Security: ENABLED with JWT Authentication");
        System.out.println("📚 API Documentation: http://localhost:8080/api");
    }
}
