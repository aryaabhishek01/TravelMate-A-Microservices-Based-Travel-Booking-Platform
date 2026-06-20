package com.example.demo.controller;

import com.example.demo.dto.AuthRequestDTO;
import com.example.demo.entity.User;
import com.example.demo.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService service;

    // -----------------------------------------------------------------------
    // 1. REGISTER
    // -----------------------------------------------------------------------
    @Test
    void testRegister() throws Exception {
        AuthRequestDTO dto = new AuthRequestDTO();
        dto.setName("User");
        dto.setEmail("test@gmail.com");
        dto.setPassword("pass1234");
        dto.setRole("USER");

        User mockUser = new User();
        mockUser.setEmail("test@gmail.com");

        when(service.register(any(User.class))).thenReturn(mockUser);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@gmail.com"));
    }

    // -----------------------------------------------------------------------
    // 2. LOGIN
    // -----------------------------------------------------------------------
    @Test
    void testLogin() throws Exception {
        AuthRequestDTO dto = new AuthRequestDTO();
        dto.setEmail("login@test.com");
        dto.setPassword("password");

        User mockUser = new User();
        mockUser.setRole("ADMIN");

        when(service.login(anyString(), anyString())).thenReturn("mock-jwt-token");
        when(service.getUserByEmail("login@test.com")).thenReturn(mockUser);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    // -----------------------------------------------------------------------
    // 3. FORGOT PASSWORD (Success & Warn Branches)
    // -----------------------------------------------------------------------
    @Test
    void testForgotPassword_Success() throws Exception {
        Map<String, String> request = Map.of("email", "reset@test.com");

        mockMvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("OTP sent successfully")));

        verify(service, times(1)).generateOtp("reset@test.com");
    }

    @Test
    void testForgotPassword_MissingEmail() throws Exception {
        // This triggers the log.warn branch and RuntimeException
        Map<String, String> request = new HashMap<>();
        request.put("email", ""); 

        mockMvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    // -----------------------------------------------------------------------
    // 4. VALIDATE OTP
    // -----------------------------------------------------------------------
    @Test
    void testValidateOtp() throws Exception {
        Map<String, String> request = Map.of("email", "test@test.com", "otp", "123456");
        when(service.validateOtp("test@test.com", "123456")).thenReturn(true);

        mockMvc.perform(post("/auth/validate-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isValid").value(true));
    }

    // -----------------------------------------------------------------------
    // 5. RESET PASSWORD (Success & Invalid OTP Branches)
    // -----------------------------------------------------------------------
    @Test
    void testResetPassword_Success() throws Exception {
        Map<String, String> request = Map.of(
                "email", "user@test.com",
                "newPassword", "newSecurePass",
                "otp", "654321"
        );
        when(service.validateOtp("user@test.com", "654321")).thenReturn(true);

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));

        verify(service).updatePassword(eq("user@test.com"), anyString());
    }

    @Test
    void testResetPassword_InvalidOtp() throws Exception {
        // This triggers the log.warn branch for invalid OTP reset
        Map<String, String> request = Map.of(
                "email", "user@test.com",
                "otp", "000000"
        );
        when(service.validateOtp("user@test.com", "000000")).thenReturn(false);

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    // -----------------------------------------------------------------------
    // 6. UTILITY ENDPOINTS
    // -----------------------------------------------------------------------
    @Test
    void testGetAllUsers() throws Exception {
        when(service.getAllUsers()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/auth/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/auth/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Auth Service Working ✅"));
    }
}