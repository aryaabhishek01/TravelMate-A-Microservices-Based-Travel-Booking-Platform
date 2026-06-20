package com.example.demo.service;

import com.example.demo.client.AuthClient;
import com.example.demo.client.BookingClient;
import com.example.demo.client.TripClient;
import com.example.demo.dto.PackageDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private TripClient tripClient;

    @Mock
    private BookingClient bookingClient;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private AdminService adminService;

    // ================================
    // ✅ PACKAGE MANAGEMENT
    // ================================

    @Test
    void testAddPackage() {
        PackageDTO dto = new PackageDTO();
        dto.setName("Beach Paradise");
        Object mockResponse = new Object();
        when(tripClient.addPackage(any(PackageDTO.class))).thenReturn(mockResponse);

        Object result = adminService.addPackage(dto);

        assertNotNull(result);
        verify(tripClient).addPackage(any(PackageDTO.class));
    }

    @Test
    void testGetAllPackages() {
        List<Object> mockPackages = Arrays.asList("Package1", "Package2");
        when(tripClient.getAllPackages()).thenReturn(mockPackages);

        List<Object> result = adminService.getAllPackages();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(tripClient).getAllPackages();
    }

    @Test
    void testUpdatePackage() {
        Long id = 1L;
        PackageDTO dto = new PackageDTO();
        dto.setName("Updated Package");
        Object mockResponse = "Updated";
        when(tripClient.updatePackage(eq(id), any(PackageDTO.class))).thenReturn(mockResponse);

        Object result = adminService.updatePackage(id, dto);

        assertEquals("Updated", result);
        verify(tripClient).updatePackage(eq(id), any(PackageDTO.class));
    }

    @Test
    void testDeletePackage() {
        Long id = 1L;
        when(tripClient.deletePackage(id)).thenReturn("Deleted");

        String result = adminService.deletePackage(id);

        assertEquals("Deleted", result);
        verify(tripClient).deletePackage(id);
    }

    // ================================
    // ✅ BOOKING MANAGEMENT
    // ================================

    @Test
    void testCancelBooking() {
        when(bookingClient.cancelBooking(1L)).thenReturn("Cancelled");

        String result = adminService.cancelBooking(1L);

        assertEquals("Cancelled", result);
        verify(bookingClient).cancelBooking(1L);
    }

    // ================================
    // ✅ USER & BOOKING DATA
    // ================================

    @Test
    void testGetAllUsers() {
        List<Object> mockUsers = Collections.singletonList("user@gmail.com");
        when(authClient.getAllUsers()).thenReturn(mockUsers);

        Object result = adminService.getAllUsers();

        assertNotNull(result);
        verify(authClient).getAllUsers();
    }

    @Test
    void testGetAllBookings() {
        List<Object> mockBookings = Collections.singletonList("booking1");
        when(bookingClient.getAllBookings()).thenReturn(mockBookings);

        Object result = adminService.getAllBookings();

        assertNotNull(result);
        verify(bookingClient).getAllBookings();
    }

    @Test
    void testGetFullDetails() {
        List<Object> mockUsers = Collections.singletonList("user1");
        List<Object> mockBookings = Collections.singletonList("booking1");

        when(authClient.getAllUsers()).thenReturn(mockUsers);
        when(bookingClient.getAllBookings()).thenReturn(mockBookings);

        Map<String, Object> details = adminService.getFullDetails();

        assertNotNull(details);
        assertEquals(mockUsers, details.get("users"));
        assertEquals(mockBookings, details.get("bookings"));
    }

    @Test
    void testGetUserBookings() {
        String email = "test@gmail.com";
        List<Object> mockUserBookings = Collections.singletonList("booking1");
        when(bookingClient.getBookingsByUser(email)).thenReturn(mockUserBookings);

        Object result = adminService.getUserBookings(email);

        assertNotNull(result);
        verify(bookingClient).getBookingsByUser(email);
    }
}