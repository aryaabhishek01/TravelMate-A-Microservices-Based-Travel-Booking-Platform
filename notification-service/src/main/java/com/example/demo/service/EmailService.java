package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    // Logger: records all email/notification events (OTP delivery, booking confirmations)
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        // Logger: info when an email is being dispatched
        log.info("[EmailService] Sending email to: {} subject: {}", to, subject);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);   // ← FIX: explicitly set From address
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        // Logger: info on successful email dispatch
        log.info("[EmailService] Email sent successfully to: {}", to);
    }

    @org.springframework.amqp.rabbit.annotation.RabbitListener(queues = "otpQueue")
    public void receiveOtpMessage(String message) {
        // Logger: info when OTP message is received from RabbitMQ
        log.info("[EmailService] OTP message received from RabbitMQ queue");
        System.out.println("Received OTP message: " + message);
        String[] parts = message.split(":");
        if (parts.length == 2) {
            String email = parts[0];
            String otp = parts[1];
            // Logger: debug - routing OTP email to recipient
            log.debug("[EmailService] Routing OTP email to: {}", email);
            String subject = "Your TravelMate Password Reset OTP";
            String body = "Your OTP for password reset is: " + otp + "\nThis OTP is valid for 10 minutes.";
            sendEmail(email, subject, body);
        } else {
            // Logger: warn on unexpected OTP message format
            log.warn("[EmailService] Unexpected OTP message format received: {}", message);
        }
    }
}