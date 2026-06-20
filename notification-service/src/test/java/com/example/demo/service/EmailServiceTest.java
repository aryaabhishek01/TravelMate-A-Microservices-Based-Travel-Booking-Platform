package com.example.demo.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    // ================================
    // ✅ SEND EMAIL
    // ================================

    @Test
    void testSendEmail_Success() {
        // Inject the fromEmail @Value field
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@travelmate.com");

        String to = "test@example.com";
        String subject = "Test Subject";
        String body = "Test Body";

        emailService.sendEmail(to, subject, body);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertEquals(to, capturedMessage.getTo()[0]);
        assertEquals(subject, capturedMessage.getSubject());
        assertEquals(body, capturedMessage.getText());
        assertEquals("noreply@travelmate.com", capturedMessage.getFrom());
    }

    @Test
    void testSendEmail_VerifiesMailSenderCalled() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@test.com");

        emailService.sendEmail("recipient@test.com", "Subject", "Message");

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    // ================================
    // ✅ RECEIVE OTP MESSAGE (RabbitMQ listener)
    // ================================

    @Test
    void testReceiveOtpMessage_ValidFormat_SendsEmail() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@travelmate.com");

        // Valid format: "email:otp"
        emailService.receiveOtpMessage("user@example.com:123456");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();
        assertEquals("user@example.com", msg.getTo()[0]);
        assertEquals("Your TravelMate Password Reset OTP", msg.getSubject());
        assertTrue(msg.getText().contains("123456"));
    }

    @Test
    void testReceiveOtpMessage_InvalidFormat_DoesNotSendEmail() {
        // Invalid format (only one part, no colon separator giving 2 parts)
        emailService.receiveOtpMessage("invalid-message-without-colon-at-all");

        // Should NOT send email — falls into the else branch
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void testReceiveOtpMessage_ThreeParts_DoesNotSendEmail() {
        // More than 2 parts split by ":" — parts.length != 2
        emailService.receiveOtpMessage("user@example.com:123456:extrapart");

        // parts.length == 3, which is != 2, so should not send email
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void testReceiveOtpMessage_OtpBodyContainsCode() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@travelmate.com");

        emailService.receiveOtpMessage("arya@gmail.com:654321");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        String body = captor.getValue().getText();
        assertTrue(body.contains("654321"));
        assertTrue(body.contains("10 minutes"));
    }
}