package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {

    // Logger: records all authentication business logic events
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository repo;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public List<User> getAllUsers() {
        return repo.findAll();
    }

    // ── Registration via OTP flow (Step-1): generate OTP for new email ────────
    public void generateRegistrationOtp(String email, String name, String rawPassword) {
        // Check duplicate email
        if (repo.findByEmail(email).isPresent()) {
            log.warn("[AuthService] Registration OTP rejected — email already exists: {}", email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }
        // Validate: must have at least 3 characters before @
        int atIdx = email == null ? -1 : email.indexOf("@");
        if (atIdx < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must have at least 3 characters before @.");
        }

        // Create a pending (unactivated) user to hold the OTP
        User user = repo.findByEmail(email).orElse(new User());
        user.setEmail(email);
        user.setName(name);
        user.setPassword(encoder.encode(rawPassword));
        user.setRole("USER");

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(1)); // 1 minute
        user.setActivated(false); // not yet activated
        repo.save(user);

        log.info("[AuthService] Registration OTP generated for: {}", email);

        // Send via RabbitMQ to notification-service
        String message = email + ":REG:" + otp;
        rabbitTemplate.convertAndSend("otpExchange", "otpRoutingKey", message);
    }

    // ── Registration via OTP flow (Step-2): verify OTP and activate user ──────
    public User registerWithOtp(String email, String otp) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No registration in progress for this email."));

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            log.warn("[AuthService] Registration OTP mismatch for email: {}", email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            log.warn("[AuthService] Registration OTP expired for email: {}", email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new one.");
        }

        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setActivated(true);
        User saved = repo.save(user);
        log.info("[AuthService] User registered and activated — email: {}", email);
        return saved;
    }

    // ── Legacy register (kept for backwards compat) ───────────────────────────
    public User register(User user) {
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            log.warn("[AuthService] Registration failed — name is empty for email: {}", user.getEmail());
            throw new RuntimeException("Name should not be empty");
        }
        if (repo.findByEmail(user.getEmail()).isPresent()) {
            log.warn("[AuthService] Registration failed — email already exists: {}", user.getEmail());
            throw new RuntimeException("Email already exists");
        }
        if (!(user.getEmail().contains("@") && user.getEmail().indexOf("@") >= 3)) {
            log.warn("[AuthService] Registration failed — invalid email format: {}", user.getEmail());
            throw new RuntimeException("Email must have at least 3 characters before @.");
        }
        if (user.getPassword().length() < 8) {
            log.warn("[AuthService] Registration failed — password too short for email: {}", user.getEmail());
            throw new RuntimeException("Password must be at least 8 characters");
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        user.setPassword(encoder.encode(user.getPassword()));
        user.setActivated(true);
        User saved = repo.save(user);
        log.info("[AuthService] User registered successfully — email: {} role: {}", saved.getEmail(), saved.getRole());
        return saved;
    }

    public String login(String email, String password) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("[AuthService] Login failed — user not found: {}", email);
                    return new RuntimeException("User not found");
                });

        // Block unactivated (pending OTP) accounts from logging in
        if (!Boolean.TRUE.equals(user.isActivated())) {
            log.warn("[AuthService] Login rejected — account not activated for: {}", email);
            throw new RuntimeException("Account not activated. Please complete OTP verification.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("[AuthService] Login failed — invalid password for email: {}", email);
            throw new RuntimeException("Invalid password");
        }

        log.info("[AuthService] Login successful — email: {} role: {}", email, user.getRole());
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    public User getUserByEmail(String email) {
        return repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Forgot-password OTP ───────────────────────────────────────────────────
    public void generateOtp(String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(1)); // 1 minute
        repo.save(user);
        log.info("[AuthService] Forgot-password OTP generated and queued via RabbitMQ for email: {}", email);

        String message = email + ":" + otp;
        rabbitTemplate.convertAndSend("otpExchange", "otpRoutingKey", message);
    }

    public boolean validateOtp(String email, String otp) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            log.warn("[AuthService] OTP mismatch for email: {}", email);
            return false;
        }

        if (user.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            log.warn("[AuthService] OTP expired for email: {}", email);
            throw new RuntimeException("OTP has expired");
        }

        log.info("[AuthService] OTP validated successfully for email: {}", email);
        return true;
    }

    public void updatePassword(String email, String newPassword) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (newPassword == null || newPassword.length() < 8) {
            log.warn("[AuthService] Password update rejected — password too short for email: {}", email);
            throw new RuntimeException("Password must be at least 8 characters");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiry(null);
        repo.save(user);
        log.info("[AuthService] Password updated successfully for email: {}", email);
    }
}