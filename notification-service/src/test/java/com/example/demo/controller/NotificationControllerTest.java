package com.example.demo.controller;

import com.example.demo.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmailService service;

    @Test
    void testSendEmail_Success() throws Exception {
        // Success path: service.sendEmail completes normally
        mockMvc.perform(post("/notify/send")
                .param("email", "test@gmail.com")
                .param("subject", "Trip Confirmed")
                .param("message", "Pack your bags!"))
                .andExpect(status().isOk())
                .andExpect(content().string("Email Sent ✅"));
    }

    @Test
    void testSendEmail_Failure() throws Exception {
        // Failure path: service.sendEmail throws an exception
        // We use doThrow because sendEmail is a 'void' return type
        doThrow(new RuntimeException("SMTP Server Down"))
                .when(service).sendEmail(anyString(), anyString(), anyString());

        mockMvc.perform(post("/notify/send")
                .param("email", "test@gmail.com")
                .param("subject", "Trip Confirmed")
                .param("message", "Pack your bags!"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("Failed to send email: SMTP Server Down"));
    }
}