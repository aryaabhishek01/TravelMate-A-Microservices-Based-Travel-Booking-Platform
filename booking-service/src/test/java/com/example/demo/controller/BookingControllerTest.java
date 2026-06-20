package com.example.demo.controller;

import com.example.demo.dto.BookingRequestDTO;
import com.example.demo.entity.Booking;
import com.example.demo.service.BookingService;
import com.example.demo.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BookingService service;

    @MockitoBean
    private PaymentService paymentService;

    @Test
    void testCreateBooking() throws Exception {
        BookingRequestDTO dto = new BookingRequestDTO();
        Booking mockBooking = new Booking();
        mockBooking.setId(1L);
        mockBooking.setDestination("Paris");

        when(service.createBooking(any(BookingRequestDTO.class))).thenReturn(mockBooking);

        mockMvc.perform(post("/booking/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.destination").value("Paris"));
    }

    @Test
    void testCreateOrder() throws Exception {
        Map<String, Object> mockOrder = Map.of("id", "order_123", "amount", 500000);
        when(paymentService.createOrder(anyDouble())).thenReturn(mockOrder);

        mockMvc.perform(post("/booking/create-order")
                .param("amount", "5000.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("order_123"));
    }

    @Test
    void testCancelInfo() throws Exception {
        Map<String, Object> mockInfo = Map.of("refundAmount", 3000.0);
        when(service.getCancelInfo(1L)).thenReturn(mockInfo);

        mockMvc.perform(get("/booking/cancel-info/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refundAmount").value(3000.0));
    }

    @Test
    void testCancelBooking_Post() throws Exception {
        when(service.cancelBooking(1L)).thenReturn("Cancelled");

        mockMvc.perform(post("/booking/cancel/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Cancelled"));
    }

    @Test
    void testCancelBooking_Delete() throws Exception {
        when(service.cancelBooking(1L)).thenReturn("Cancelled");

        mockMvc.perform(delete("/booking/cancel/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Cancelled"));
    }

    @Test
    void testPayRemaining_Post() throws Exception {
        Booking mockBooking = new Booking();
        mockBooking.setFullPaid(true);

        when(service.payRemaining(1L)).thenReturn(mockBooking);

        mockMvc.perform(post("/booking/pay/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullPaid").value(true));
    }

    @Test
    void testPayRemaining_Put() throws Exception {
        Booking mockBooking = new Booking();
        mockBooking.setFullPaid(true);

        when(service.payRemaining(1L)).thenReturn(mockBooking);

        mockMvc.perform(put("/booking/pay/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullPaid").value(true));
    }

    @Test
    void testExtendTrip() throws Exception {
        Booking extendedBooking = new Booking();
        extendedBooking.setDays(10);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("bookingId", 1);
        requestBody.put("extraDays", 3);
        requestBody.put("extraCost", 1500.0);

        when(service.extendTrip(anyLong(), anyInt(), anyDouble())).thenReturn(extendedBooking);

        mockMvc.perform(post("/booking/extend")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(10));
    }

    @Test
    void testVerifyPayment_Valid() throws Exception {
        when(paymentService.verifyPayment(anyString(), anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/booking/verify")
                .param("orderId", "order_123")
                .param("paymentId", "pay_456")
                .param("signature", "sig_789"))
                .andExpect(status().isOk())
                .andExpect(content().string("Payment Verified ✅"));
    }

    @Test
    void testVerifyPayment_Invalid() throws Exception {
        when(paymentService.verifyPayment(anyString(), anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/booking/verify")
                .param("orderId", "order_123")
                .param("paymentId", "pay_456")
                .param("signature", "bad_sig"))
                .andExpect(status().isOk())
                .andExpect(content().string("Invalid Payment ❌"));
    }

    @Test
    void testGetByUser() throws Exception {
        when(service.getBookingsByUser(anyString())).thenReturn(List.of(new Booking()));

        mockMvc.perform(get("/booking/user")
                .param("email", "test@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAllBookings()).thenReturn(List.of(new Booking()));

        mockMvc.perform(get("/booking/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/booking/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Booking Service Working ✅"));
    }
}