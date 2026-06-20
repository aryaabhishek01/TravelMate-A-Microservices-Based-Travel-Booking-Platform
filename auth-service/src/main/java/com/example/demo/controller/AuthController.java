package com.example.demo.controller;

import com.example.demo.dto.AuthRequestDTO;
import com.example.demo.entity.User;
import com.example.demo.service.AuthService;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/auth")
public class AuthController {

    // Logger: records all authentication and user management requests
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService service;

    @PostMapping("/register")
    public User register(@RequestBody AuthRequestDTO dto) {
        // Logger: info on new user registration request
        log.info("[AuthController] Register request for email: {} role: {}", dto.getEmail(), dto.getRole());
        // You can map the DTO to an Entity here or inside the Service
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());
        
        return service.register(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody AuthRequestDTO dto) {
        // Logger: info on login attempt
        log.info("[AuthController] Login attempt for email: {}", dto.getEmail());

        String token = service.login(dto.getEmail(), dto.getPassword());

        // 🔥 get user again to fetch role
        User user = service.getUserByEmail(dto.getEmail());
        // Logger: info on successful login with user role
        log.info("[AuthController] Login successful for email: {} role: {}", dto.getEmail(), user.getRole());

        return Map.of(
            "token", token,
            "role", user.getRole()
        );
    }

    @GetMapping("/test")
    public String test() {
        return "Auth Service Working ✅";
    }
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return service.getAllUsers();
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            // Logger: warn on missing email in forgot-password request
            log.warn("[AuthController] Forgot-password called without email");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Email is required");
        }
        // Logger: info on OTP generation initiation
        log.info("[AuthController] Forgot-password OTP requested for email: {}", email);
        service.generateOtp(email);
        return Map.of("message", "OTP sent successfully to " + email);
    }

    @PostMapping("/validate-otp")
    public Map<String, Boolean> validateOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        // Logger: info when OTP validation is attempted
        log.info("[AuthController] OTP validation attempt for email: {}", email);
        boolean isValid = service.validateOtp(email, otp);
        // Logger: info on OTP validation result
        log.info("[AuthController] OTP validation result for {}: {}", email, isValid);
        return Map.of("isValid", isValid);
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");
        String otp = request.get("otp");
        // Logger: info on password reset request
        log.info("[AuthController] Password reset requested for email: {}", email);
        
        // Final validation before resetting
        if (!service.validateOtp(email, otp)) {
            // Logger: warn on invalid OTP during reset
            log.warn("[AuthController] Password reset rejected — invalid OTP for email: {}", email);
             throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid OTP");
        }

        service.updatePassword(email, newPassword);
        // Logger: info on successful password reset
        log.info("[AuthController] Password reset successful for email: {}", email);
        return Map.of("message", "Password reset successfully");
    }
}