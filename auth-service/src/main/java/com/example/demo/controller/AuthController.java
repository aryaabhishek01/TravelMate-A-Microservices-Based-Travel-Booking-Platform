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
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/auth")
public class AuthController {

    // Logger: records all authentication and user management requests
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService service;

    @Autowired(required = false)
    private RestTemplate restTemplate;

    /** POST /auth/send-otp  ── Step-1 of registration: validate inputs and send OTP */
    @PostMapping("/send-otp")
    public Map<String, String> sendRegistrationOtp(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String name     = body.getOrDefault("name", "");
        String password = body.getOrDefault("password", "");

        log.info("[AuthController] Registration OTP requested for email: {}", email);

        // Validate before generating OTP
        if (name == null || name.trim().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required.");
        if (!name.matches("[a-zA-Z ]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must contain only alphabets and spaces.");
        int atIdx = email == null ? -1 : email.indexOf("@");
        if (atIdx < 3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must have at least 3 characters before @.");
        if (password == null || password.length() < 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters.");

        service.generateRegistrationOtp(email, name, password);
        return Map.of("message", "OTP sent to " + email);
    }

    /** POST /auth/register  ── Step-2: verify OTP and create user */
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody AuthRequestDTO dto) {
        log.info("[AuthController] Register request for email: {}", dto.getEmail());

        // Verify OTP and create user
        User saved = service.registerWithOtp(dto.getEmail(), dto.getOtp());

        log.info("[AuthController] User registered successfully — email: {}", saved.getEmail());

        // Send welcome email asynchronously via notification-service
        try {
            sendWelcomeEmail(saved.getEmail(), saved.getName());
        } catch (Exception e) {
            log.warn("[AuthController] Welcome email failed (non-fatal): {}", e.getMessage());
        }

        return Map.of("message", "Account created successfully!", "email", saved.getEmail());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody AuthRequestDTO dto) {
        log.info("[AuthController] Login attempt for email: {}", dto.getEmail());
        String token = service.login(dto.getEmail(), dto.getPassword());
        User user = service.getUserByEmail(dto.getEmail());
        log.info("[AuthController] Login successful for email: {} role: {}", dto.getEmail(), user.getRole());
        return Map.of("token", token, "role", user.getRole());
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
            log.warn("[AuthController] Forgot-password called without email");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Email is required");
        }
        log.info("[AuthController] Forgot-password OTP requested for email: {}", email);
        service.generateOtp(email);
        return Map.of("message", "OTP sent successfully to " + email);
    }

    @PostMapping("/validate-otp")
    public Map<String, Boolean> validateOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp   = request.get("otp");
        log.info("[AuthController] OTP validation attempt for email: {}", email);
        boolean isValid = service.validateOtp(email, otp);
        log.info("[AuthController] OTP validation result for {}: {}", email, isValid);
        return Map.of("isValid", isValid);
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody Map<String, String> request) {
        String email       = request.get("email");
        String newPassword = request.get("newPassword");
        String otp         = request.get("otp");
        log.info("[AuthController] Password reset requested for email: {}", email);

        if (!service.validateOtp(email, otp)) {
            log.warn("[AuthController] Password reset rejected — invalid OTP for email: {}", email);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid OTP");
        }

        service.updatePassword(email, newPassword);
        log.info("[AuthController] Password reset successful for email: {}", email);
        return Map.of("message", "Password reset successfully");
    }

    // ── Helper: call notification-service to send welcome email ──────────────
    private void sendWelcomeEmail(String email, String name) {
        try {
            RestTemplate rt = (restTemplate != null) ? restTemplate : new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, String> payload = Map.of("email", email, "name", name != null ? name : "Traveller");
            HttpEntity<Map<String, String>> req = new HttpEntity<>(payload, headers);
            rt.postForObject("http://localhost:8083/notify/welcome", req, String.class);
        } catch (Exception e) {
            log.warn("[AuthController] Could not reach notification-service for welcome email: {}", e.getMessage());
        }
    }
}