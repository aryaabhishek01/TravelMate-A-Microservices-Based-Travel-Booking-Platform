package com.example.demo.controller;

import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notify")
public class NotificationController {

    @Autowired
    private EmailService service;

    @PostMapping("/send")
    public ResponseEntity<String> send(@RequestParam String email,
                                       @RequestParam String subject,
                                       @RequestParam String message) {
        try {
            service.sendEmail(email, subject, message);
            return ResponseEntity.ok("Email Sent ✅");
        } catch (Exception e) {
            // Return 500 with a readable message instead of a blank error
            return ResponseEntity
                    .internalServerError()
                    .body("Failed to send email: " + e.getMessage());
        }
    }
}