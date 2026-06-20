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

    

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    
    public List<User> getAllUsers() {
        return repo.findAll();
    }
    public User register(User user) {
    	if(user.getName() == null || user.getName().trim().isEmpty()) {
            // Logger: warn on missing name during registration
            log.warn("[AuthService] Registration failed — name is empty for email: {}", user.getEmail());
    		throw new RuntimeException("Name should not be empty");
    	}
        // ✅ email unique
        if (repo.findByEmail(user.getEmail()).isPresent()) {
            // Logger: warn on duplicate email during registration
            log.warn("[AuthService] Registration failed — email already exists: {}", user.getEmail());
            throw new RuntimeException("Email already exists");
        }
        if(!(user.getEmail().contains("@gmail.com"))){
            // Logger: warn on invalid email format
            log.warn("[AuthService] Registration failed — invalid email format: {}", user.getEmail());
        	throw new RuntimeException("Invalid Email ID");
        }
        // ✅ password length
        if (user.getPassword().length() < 8) {
            // Logger: warn on short password
            log.warn("[AuthService] Registration failed — password too short for email: {}", user.getEmail());
            throw new RuntimeException("Password must be at least 8 characters");
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        user.setPassword(encoder.encode(user.getPassword()));
        User saved = repo.save(user);
        // Logger: info on successful user registration
        log.info("[AuthService] User registered successfully — email: {} role: {}", saved.getEmail(), saved.getRole());
        return saved;
    }

    public String login(String email, String password) {

        User user = repo.findByEmail(email)
                .orElseThrow(() -> {
                    // Logger: warn when login is attempted with non-existent email
                    log.warn("[AuthService] Login failed — user not found: {}", email);
                    return new RuntimeException("User not found");
                });

        if (!passwordEncoder.matches(password, user.getPassword())) {
            // Logger: warn on wrong password
            log.warn("[AuthService] Login failed — invalid password for email: {}", email);
            throw new RuntimeException("Invalid password");
        }

        // Logger: info on successful login
        log.info("[AuthService] Login successful — email: {} role: {}", email, user.getRole());
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }
    public User getUserByEmail(String email) {
        return repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Autowired
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public void generateOtp(String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(10)); // valid for 10 minutes
        repo.save(user);
        // Logger: info when OTP is generated and dispatched via RabbitMQ
        log.info("[AuthService] OTP generated and queued via RabbitMQ for email: {}", email);

        // Send OTP via RabbitMQ to notification-service
        String message = email + ":" + otp;
        rabbitTemplate.convertAndSend("otpExchange", "otpRoutingKey", message);
    }

    public boolean validateOtp(String email, String otp) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            // Logger: warn on OTP mismatch
            log.warn("[AuthService] OTP mismatch for email: {}", email);
            return false;
        }

        if (user.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            // Logger: warn on expired OTP
            log.warn("[AuthService] OTP expired for email: {}", email);
            throw new RuntimeException("OTP has expired");
        }

        // Logger: info on valid OTP
        log.info("[AuthService] OTP validated successfully for email: {}", email);
        return true;
    }

    public void updatePassword(String email, String newPassword) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (newPassword == null || newPassword.length() < 8) {
            // Logger: warn on short new password during reset
            log.warn("[AuthService] Password update rejected — password too short for email: {}", email);
            throw new RuntimeException("Password must be at least 8 characters");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setOtp(null); // clear OTP after reset
        user.setOtpExpiry(null);
        repo.save(user);
        // Logger: info on successful password update
        log.info("[AuthService] Password updated successfully for email: {}", email);
    }
}