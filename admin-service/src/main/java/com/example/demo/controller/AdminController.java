package com.example.demo.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.PackageDTO;
import com.example.demo.service.AdminService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    // Logger: records all admin operations (package management, user/booking views)
    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private AdminService service;

    // ── Package CRUD ───────────────────────────────────────────
    @PostMapping("/add-package")
    public Object addPackage(@RequestBody PackageDTO dto) {
        // Logger: info when admin creates a new travel package
        log.info("[AdminController] Add package request");
        return service.addPackage(dto);
    }

    @GetMapping("/packages")
    public Object getPackages() {
        // Logger: info when admin fetches all packages
        log.info("[AdminController] Get all packages requested");
        return service.getAllPackages();
    }

    @PutMapping("/update-package/{id}")
    public Object updatePackage(@PathVariable Long id, @RequestBody PackageDTO dto) {
        // Logger: info when admin updates an existing package
        log.info("[AdminController] Update package id: {}", id);
        return service.updatePackage(id, dto);
    }

    @DeleteMapping("/delete-package/{id}")
    public String deletePackage(@PathVariable Long id) {
        // Logger: info when admin deletes a package
        log.info("[AdminController] Delete package id: {}", id);
        return service.deletePackage(id);
    }

    // ── Booking management ─────────────────────────────────────
    @PostMapping("/cancel-booking/{id}")
    public String cancelBooking(@PathVariable Long id) {
        // Logger: info when admin cancels a booking
        log.info("[AdminController] Admin cancel booking id: {}", id);
        return service.cancelBooking(id);
    }

    // ── Data views ─────────────────────────────────────────────
    @GetMapping("/users")
    public Object getUsers() {
        // Logger: info when admin views all users
        log.info("[AdminController] Get all users requested");
        return service.getAllUsers();
    }

    @GetMapping("/bookings")
    public Object getBookings() {
        // Logger: info when admin views all bookings
        log.info("[AdminController] Get all bookings requested");
        return service.getAllBookings();
    }

    @GetMapping("/full-details")
    public Map<String, Object> fullDetails() {
        // Logger: info when admin fetches full dashboard data
        log.info("[AdminController] Full details (users + bookings) requested");
        return service.getFullDetails();
    }

    @GetMapping("/user-bookings")
    public Object userBookings(@RequestParam String email) {
        // Logger: info when admin views bookings for a specific user
        log.info("[AdminController] User bookings requested for email: {}", email);
        return service.getUserBookings(email);
    }
}