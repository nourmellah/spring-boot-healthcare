package com.healthcare.system.controllers;

import com.healthcare.system.dto.LoginRequest;
import com.healthcare.system.dto.LoginResponse;
import com.healthcare.system.dto.RegisterRequest;
import com.healthcare.system.entities.User;
import com.healthcare.system.repositories.UserRepository;
import com.healthcare.system.security.JwtUtils;
import com.healthcare.system.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            LoginResponse response = new LoginResponse(
                    jwt,
                    userDetails.getId(),
                    userDetails.getEmail(),
                    userDetails.getFirstName(),
                    userDetails.getLastName(),
                    userDetails.getRole()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid email or password");
            return ResponseEntity.status(401).body(error);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        // Check if email already exists
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email is already in use");
            return ResponseEntity.badRequest().body(error);
        }
        
        // SECURITY: Prevent self-assignment of ADMIN role
        // Only existing admins can create new admin users
        if (registerRequest.getRole() == User.Role.ADMIN) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Cannot self-assign ADMIN role. Contact system administrator.");
            return ResponseEntity.status(403).body(error);
        }
        
        // Create new user
        User user = new User();
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setPhone(registerRequest.getPhone());
        user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : User.Role.PATIENT);
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("email", user.getEmail());
        response.put("role", user.getRole().toString());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", userDetails.getId());
        response.put("email", userDetails.getEmail());
        response.put("firstName", userDetails.getFirstName());
        response.put("lastName", userDetails.getLastName());
        response.put("role", userDetails.getRole());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    // Temporary endpoint to check if a user exists and their password is encoded
    @GetMapping("/check/{email}")
    public ResponseEntity<?> checkUser(@PathVariable String email) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("email", user.getEmail());
                    info.put("role", user.getRole());
                    info.put("active", user.getActive());
                    info.put("passwordEncoded", user.getPassword().startsWith("$2a$"));
                    return ResponseEntity.ok(info);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
