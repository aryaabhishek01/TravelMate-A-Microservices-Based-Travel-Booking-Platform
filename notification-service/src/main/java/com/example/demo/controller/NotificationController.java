package com.example.demo.controller;

import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notify")
public class NotificationController {

    @Autowired
    private EmailService service;

    /** Generic branded notification email — used by admin "Notify" tab */
    @PostMapping("/send")
    public ResponseEntity<String> send(@RequestParam String email,
                                       @RequestParam String subject,
                                       @RequestParam String message) {
        try {
            service.sendNotificationEmail(email, subject, message);
            return ResponseEntity.ok("Email Sent ✅");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to send email: " + e.getMessage());
        }
    }

    /** OTP for registration — called by auth-service via HTTP after creating temp user */
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp   = body.get("otp");
            String label = body.getOrDefault("label", "registration");
            service.sendOtpEmail(email, otp, label);
            return ResponseEntity.ok("OTP email sent ✅");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to send OTP email: " + e.getMessage());
        }
    }

    /** Welcome email — called after successful registration */
    @PostMapping("/welcome")
    public ResponseEntity<String> welcome(@RequestBody Map<String, String> body) {
        try {
            service.sendWelcomeEmail(body.get("email"), body.getOrDefault("name", "Traveller"));
            return ResponseEntity.ok("Welcome email sent ✅");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to send welcome email: " + e.getMessage());
        }
    }
}