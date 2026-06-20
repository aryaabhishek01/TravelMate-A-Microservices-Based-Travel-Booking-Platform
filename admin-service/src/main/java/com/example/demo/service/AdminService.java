package com.example.demo.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.client.AuthClient;
import com.example.demo.client.BookingClient;
import com.example.demo.client.TripClient;
import com.example.demo.dto.PackageDTO;

@Service
public class AdminService {

    @Autowired
    private AuthClient authClient;

    @Autowired
    private TripClient tripClient;

    @Autowired
    private BookingClient bookingClient;

    // ── Package management ─────────────────────────────────────
    public Object addPackage(PackageDTO dto) {
        return tripClient.addPackage(dto);
    }

    public List<Object> getAllPackages() {
        return tripClient.getAllPackages();
    }

    public Object updatePackage(Long id, PackageDTO dto) {
        return tripClient.updatePackage(id, dto);
    }

    public String deletePackage(Long id) {
        return tripClient.deletePackage(id);
    }

    // ── Bookings ───────────────────────────────────────────────
    public String cancelBooking(Long id) {
        return bookingClient.cancelBooking(id);
    }

    // ── Users / Bookings data ─────────────────────────────────
    public Object getAllUsers() {
        return authClient.getAllUsers();
    }

    public Object getAllBookings() {
        return bookingClient.getAllBookings();
    }

    public Map<String, Object> getFullDetails() {
        return Map.of(
                "users",    getAllUsers(),
                "bookings", getAllBookings()
        );
    }

    public Object getUserBookings(String email) {
        return bookingClient.getBookingsByUser(email);
    }
}