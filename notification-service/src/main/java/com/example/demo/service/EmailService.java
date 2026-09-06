package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    // Logger: records all email/notification events (OTP delivery, booking confirmations)
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ─── Shared HTML email template ───────────────────────────────────────────
    private String buildHtmlEmail(String bodyContent) {
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'>" +
            "<style>" +
            "  body { margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI',Arial,sans-serif; }" +
            "  .wrapper { max-width:600px; margin:40px auto; border-radius:16px; overflow:hidden; " +
            "             box-shadow:0 8px 32px rgba(0,0,0,0.18); }" +
            "  .header { background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); " +
            "             padding:36px 40px 28px; text-align:center; }" +
            "  .header .logo { font-size:28px; font-weight:800; color:#fff; letter-spacing:0.5px; }" +
            "  .header .logo span { font-size:26px; margin-right:8px; }" +
            "  .header .tagline { color:rgba(255,255,255,0.85); font-size:13px; margin-top:4px; }" +
            "  .body { background:#1a1f2e; padding:36px 40px; color:#c8d3e6; font-size:15px; line-height:1.7; }" +
            "  .body p { margin:0 0 16px; }" +
            "  .otp-box { background:#252d42; border:1px solid rgba(99,102,241,0.4); border-radius:10px; " +
            "              padding:16px 24px; margin:20px 0; text-align:center; }" +
            "  .otp-box .otp { font-size:32px; font-weight:800; letter-spacing:8px; color:#818cf8; " +
            "                   font-family:'Courier New',monospace; }" +
            "  .info-box { background:#252d42; border-left:3px solid #6366f1; border-radius:6px; " +
            "               padding:12px 16px; margin:12px 0; font-size:14px; color:#94a3b8; }" +
            "  .highlight { color:#f59e0b; font-weight:600; }" +
            "  .footer { background:#12161f; padding:20px 40px; text-align:center; " +
            "             font-size:12px; color:#4b5563; }" +
            "  .footer a { color:#6366f1; text-decoration:none; }" +
            "  .divider { border:none; border-top:1px solid rgba(255,255,255,0.06); margin:20px 0; }" +
            "  .signature { color:#64748b; font-style:italic; font-size:14px; }" +
            "</style></head><body>" +
            "<div class='wrapper'>" +
            "  <div class='header'>" +
            "    <div class='logo'><span>✈️</span> TravelMate</div>" +
            "    <div class='tagline'>Your Travel Companion</div>" +
            "  </div>" +
            "  <div class='body'>" +
            bodyContent +
            "    <hr class='divider' />" +
            "    <p class='signature'>– TravelMate Team</p>" +
            "  </div>" +
            "  <div class='footer'>" +
            "    © 2026 TravelMate · <a href='#'>Visit Platform</a> · This is an automated email, please do not reply." +
            "  </div>" +
            "</div>" +
            "</body></html>";
    }

    // ─── Send a generic styled HTML email ─────────────────────────────────────
    public void sendEmail(String to, String subject, String bodyHtml) {
        log.info("[EmailService] Sending HTML email to: {} subject: {}", to, subject);
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            // Wrap plain-text messages in the branded template automatically
            String fullHtml = bodyHtml.startsWith("<!DOCTYPE") ? bodyHtml : buildHtmlEmail(
                "<p>Dear Traveller,</p><p>" + bodyHtml.replace("\n", "<br/>") + "</p>"
            );
            helper.setText(fullHtml, true);
            mailSender.send(mime);
            log.info("[EmailService] HTML email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("[EmailService] Failed to send HTML email to: {} — {}", to, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }

    // ─── OTP email (registration or forgot-password) ─────────────────────────
    public void sendOtpEmail(String to, String otp, String purposeLabel) {
        String subject = "Your TravelMate Verification OTP";
        String body = buildHtmlEmail(
            "<p>Dear Traveller,</p>" +
            "<p>Welcome to TravelMate! 🌍</p>" +
            "<p>Your email verification OTP is:</p>" +
            "<div class='otp-box'><div class='otp'>" + otp + "</div></div>" +
            "<div class='info-box'>This OTP is valid for <span class='highlight'>1 minute</span>.<br/>" +
            "Please enter it on the " + purposeLabel + " page to complete your account setup.</div>" +
            "<p>If you did not request this, please ignore this email.</p>"
        );
        sendEmail(to, subject, body);
    }

    // ─── Welcome email after successful registration ──────────────────────────
    public void sendWelcomeEmail(String to, String name) {
        String subject = "Welcome to TravelMate 🌍 — Your Journey Starts Here!";
        String body = buildHtmlEmail(
            "<p>Dear <span class='highlight'>" + name + "</span>,</p>" +
            "<p>Welcome to <strong>TravelMate</strong>! 🌏</p>" +
            "<p>Your account has been created successfully. We are thrilled to have you on board!</p>" +
            "<div class='info-box'>" +
            "  <strong>What you can do now:</strong><br/>" +
            "  ✈️ &nbsp;Browse and book curated travel packages<br/>" +
            "  ✨ &nbsp;Create your own custom trip itineraries<br/>" +
            "  📅 &nbsp;Manage your bookings and trip dates<br/>" +
            "  🔁 &nbsp;Extend trips, track refunds, and much more" +
            "</div>" +
            "<p>Start exploring from your dashboard and let TravelMate handle the details.</p>" +
            "<p>Safe travels and happy adventuring! 🧳</p>"
        );
        sendEmail(to, subject, body);
    }

    // ─── Booking confirmation email ───────────────────────────────────────────
    public void sendBookingConfirmationEmail(String to, String destination, int days, int people, String startDate, double totalAmount) {
        String subject = "Booking Confirmed — " + destination + " 🎉";
        String body = buildHtmlEmail(
            "<p>Dear Traveller,</p>" +
            "<p>Your booking has been <strong>confirmed</strong>! 🎉</p>" +
            "<div class='info-box'>" +
            "  <strong>Booking Summary:</strong><br/>" +
            "  📍 &nbsp;Destination: <span class='highlight'>" + destination + "</span><br/>" +
            "  📅 &nbsp;Start Date: " + startDate + "<br/>" +
            "  🗓 &nbsp;Duration: " + days + " days<br/>" +
            "  👥 &nbsp;Travellers: " + people + "<br/>" +
            "  💰 &nbsp;Total Amount: ₹" + String.format("%,.0f", totalAmount) +
            "</div>" +
            "<p>Your detailed itinerary is available in your dashboard. We hope you have an amazing trip!</p>"
        );
        sendEmail(to, subject, body);
    }

    // ─── Generic notification (called by /notify/send) ───────────────────────
    public void sendNotificationEmail(String to, String subject, String message) {
        String body = buildHtmlEmail(
            "<p>Dear Traveller,</p>" +
            "<p>" + message.replace("\n", "<br/>") + "</p>"
        );
        sendEmail(to, subject, body);
    }

    // ─── RabbitMQ listener for forgot-password OTP ───────────────────────────
    @org.springframework.amqp.rabbit.annotation.RabbitListener(queues = "otpQueue")
    public void receiveOtpMessage(String message) {
        log.info("[EmailService] OTP message received from RabbitMQ queue: {}", message);
        String[] parts = message.split(":");
        if (parts.length == 3 && "REG".equals(parts[1])) {
            String email = parts[0];
            String otp = parts[2];
            log.debug("[EmailService] Routing registration OTP email to: {}", email);
            sendOtpEmail(email, otp, "registration");
        } else if (parts.length == 2) {
            String email = parts[0];
            String otp = parts[1];
            log.debug("[EmailService] Routing password reset OTP email to: {}", email);
            sendOtpEmail(email, otp, "password reset");
        } else {
            log.warn("[EmailService] Unexpected OTP message format received: {}", message);
        }
    }
}