package com.example.demo.controller;

import com.example.demo.dto.CustomTripDTO;
import com.example.demo.dto.TripRequestDTO;
import com.example.demo.entity.Package;
import com.example.demo.service.TripService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/trips")
public class TripController {

    // Logger: records all trip/package HTTP requests for observability
    private static final Logger log = LoggerFactory.getLogger(TripController.class);

    @Autowired
    private TripService service;

    // ─── Admin: add a public package ───
    @PostMapping("/add")
    public Package addPackage(@RequestBody TripRequestDTO dto) {
        // Logger: info when admin adds a new travel package
        log.info("[TripController] Add package: {}", dto.getName());
        return service.addPackage(dto);
    }

    // ─── Admin: get all public packages ───
    @GetMapping("/all")
    public List<Package> getAll() {
        return service.getAllPackages();
    }

    // ─── User: get public + their private packages ───
    @GetMapping("/for-user")
    public List<Package> getForUser(@RequestParam String email) {
        // Logger: info when user fetches their available packages
        log.info("[TripController] Get packages for user: {}", email);
        return service.getPackagesForUser(email);
    }

    // ─── Package details + itinerary ───
    @GetMapping("/details/{id}")
    public Map<String, Object> getDetails(@PathVariable Long id) {
        // Logger: info when package details with itinerary are requested
        log.info("[TripController] Get package details id: {}", id);
        return service.getPackageDetails(id);
    }

    // ─── Generate custom trip preview ───
    @PostMapping("/custom")
    public Map<String, Object> createCustomTrip(@RequestBody CustomTripDTO dto) {
        // Logger: info when user generates a custom trip preview
        log.info("[TripController] Custom trip preview for destination: {} days: {}", dto.getDestination(), dto.getDays());
        return service.generateCustomTrip(dto);
    }

    // ─── Save a user-private custom package ───
    @PostMapping("/custom-package")
    public Package saveCustomPackage(@RequestBody TripRequestDTO dto) {
        return service.addCustomPackage(dto);
    }

    // ─── Slot: book (with startDate for month tracking) ───
    @PostMapping("/slot/book/{id}")
    public Package bookSlot(@PathVariable Long id,
                            @RequestParam(required = false) String startDate) {
        // Logger: info when a slot is being booked for a package
        log.info("[TripController] Book slot for package id: {} startDate: {}", id, startDate);
        return service.bookSlot(id, startDate);
    }

    // ─── Slot: release (with startDate for month tracking) ───
    @PostMapping("/slot/release/{id}")
    public Package releaseSlot(@PathVariable Long id,
                               @RequestParam(required = false) String startDate) {
        return service.releaseSlot(id, startDate);
    }

    // ─── Admin: update an existing package ───
    @PutMapping("/update/{id}")
    public Package updatePackage(@PathVariable Long id, @RequestBody TripRequestDTO dto) {
        // Logger: info when admin updates a package
        log.info("[TripController] Update package id: {}", id);
        return service.updatePackage(id, dto);
    }

    // ─── Admin: delete a package ───
    @DeleteMapping("/delete/{id}")
    public String deletePackage(@PathVariable Long id) {
        // Logger: info when admin deletes a package
        log.info("[TripController] Delete package id: {}", id);
        service.deletePackage(id);
        return "Package deleted.";
    }

    @GetMapping("/test")
    public String test() {
        return "Trip Service Working ✅";
    }
}