package com.example.demo.controller;

import com.example.demo.dto.PackageDTO;
import com.example.demo.service.AdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService service;

    @Test
    void testAddPackage() throws Exception {
        PackageDTO dto = new PackageDTO();
        dto.setName("Beach Paradise");

        when(service.addPackage(any(PackageDTO.class))).thenReturn("Created Successfully");

        mockMvc.perform(post("/admin/add-package")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Created Successfully"));
    }

    @Test
    void testGetPackages() throws Exception {
        List<Object> mockPackages = Arrays.asList("package1", "package2");
        when(service.getAllPackages()).thenReturn(mockPackages);

        mockMvc.perform(get("/admin/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testUpdatePackage() throws Exception {
        PackageDTO dto = new PackageDTO();
        dto.setName("Updated Hill Station");

        when(service.updatePackage(anyLong(), any(PackageDTO.class))).thenReturn("Updated");

        mockMvc.perform(put("/admin/update-package/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Updated"));
    }

    @Test
    void testDeletePackage() throws Exception {
        when(service.deletePackage(1L)).thenReturn("Deleted");

        mockMvc.perform(delete("/admin/delete-package/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Deleted"));
    }

    @Test
    void testCancelBooking() throws Exception {
        when(service.cancelBooking(anyLong())).thenReturn("Cancelled");

        mockMvc.perform(post("/admin/cancel-booking/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Cancelled"));
    }

    @Test
    void testGetUsers() throws Exception {
        when(service.getAllUsers()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetBookings() throws Exception {
        when(service.getAllBookings()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/admin/bookings"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetFullDetails() throws Exception {
        Map<String, Object> details = new HashMap<>();
        details.put("status", "success");
        details.put("users", Collections.emptyList());
        details.put("bookings", Collections.emptyList());

        when(service.getFullDetails()).thenReturn(details);

        mockMvc.perform(get("/admin/full-details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    void testGetUserBookings() throws Exception {
        when(service.getUserBookings(anyString())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/admin/user-bookings")
                .param("email", "test@example.com"))
                .andExpect(status().isOk());
    }
}
