package com.healthcare.system.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class WelcomeController {

    @GetMapping("/")
    public Map<String, Object> welcome() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "🏥 Healthcare Management System API");
        response.put("version", "1.0.0");
        response.put("status", "Running");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("Patients", "/api/patients");
        endpoints.put("Doctors", "/api/doctors");
        endpoints.put("Appointments", "/api/appointments");
        endpoints.put("Prescriptions", "/api/prescriptions");
        endpoints.put("Emergencies", "/api/emergencies");
        endpoints.put("Specialties", "/api/specialties");
        
        response.put("endpoints", endpoints);
        response.put("documentation", "See README.md for complete API documentation");
        
        return response;
    }
    
    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Healthcare Management System");
        return response;
    }
}
