package com.example.demo.controller;

import com.example.demo.dto.CustomTripDTO;
import com.example.demo.dto.TripRequestDTO;
import com.example.demo.entity.Package;
import com.example.demo.service.TripService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TripController.class)
class TripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TripService service;

    @Test
    void testAddPackage() throws Exception {
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("Paris Trip");

        Package pkg = new Package();
        pkg.setName("Paris Trip");

        when(service.addPackage(any(TripRequestDTO.class))).thenReturn(pkg);

        mockMvc.perform(post("/trips/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Paris Trip"));
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAllPackages()).thenReturn(List.of(new Package()));

        mockMvc.perform(get("/trips/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetForUser() throws Exception {
        when(service.getPackagesForUser(anyString())).thenReturn(List.of(new Package()));

        mockMvc.perform(get("/trips/for-user")
                .param("email", "test@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetDetails() throws Exception {
        when(service.getPackageDetails(1L)).thenReturn(Map.of("name", "Bali"));

        mockMvc.perform(get("/trips/details/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bali"));
    }

    @Test
    void testCreateCustomTrip() throws Exception {
        CustomTripDTO dto = new CustomTripDTO();
        dto.setDestination("Dubai");

        when(service.generateCustomTrip(any())).thenReturn(Map.of("price", 15000));

        mockMvc.perform(post("/trips/custom")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(15000));
    }

    @Test
    void testSaveCustomPackage() throws Exception {
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("My Custom Trip");

        Package pkg = new Package();
        pkg.setName("My Custom Trip");

        when(service.addCustomPackage(any(TripRequestDTO.class))).thenReturn(pkg);

        mockMvc.perform(post("/trips/custom-package")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Custom Trip"));
    }

    @Test
    void testBookSlot_WithStartDate() throws Exception {
        Package pkg = new Package();
        pkg.setBookedSlots(1);

        when(service.bookSlot(anyLong(), anyString())).thenReturn(pkg);

        mockMvc.perform(post("/trips/slot/book/1")
                .param("startDate", "2026-05-28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookedSlots").value(1));
    }

    @Test
    void testBookSlot_WithoutStartDate() throws Exception {
        Package pkg = new Package();
        pkg.setBookedSlots(2);

        // When startDate param is not provided (required = false), it should still work
        when(service.bookSlot(anyLong(), isNull())).thenReturn(pkg);

        mockMvc.perform(post("/trips/slot/book/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testReleaseSlot_WithStartDate() throws Exception {
        Package pkg = new Package();
        pkg.setBookedSlots(0);

        when(service.releaseSlot(anyLong(), anyString())).thenReturn(pkg);

        mockMvc.perform(post("/trips/slot/release/1")
                .param("startDate", "2026-05-28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookedSlots").value(0));
    }

    @Test
    void testReleaseSlot_WithoutStartDate() throws Exception {
        Package pkg = new Package();
        pkg.setBookedSlots(0);

        when(service.releaseSlot(anyLong(), isNull())).thenReturn(pkg);

        mockMvc.perform(post("/trips/slot/release/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdatePackage() throws Exception {
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("Updated Package");

        Package pkg = new Package();
        pkg.setName("Updated Package");

        when(service.updatePackage(anyLong(), any(TripRequestDTO.class))).thenReturn(pkg);

        mockMvc.perform(put("/trips/update/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Package"));
    }

    @Test
    void testDeletePackage() throws Exception {
        doNothing().when(service).deletePackage(1L);

        mockMvc.perform(delete("/trips/delete/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Package deleted."));
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/trips/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Trip Service Working ✅"));
    }
}