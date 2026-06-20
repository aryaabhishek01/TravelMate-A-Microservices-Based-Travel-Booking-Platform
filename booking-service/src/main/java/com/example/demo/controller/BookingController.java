package com.example.demo.controller;

import com.example.demo.dto.BookingRequestDTO;
import com.example.demo.entity.Booking;
import com.example.demo.service.BookingService;
import com.example.demo.service.PaymentService;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/booking")
public class BookingController {

    // Logger: logs all incoming booking HTTP requests for traceability
    private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService service;

    @Autowired
    private PaymentService paymentService;

    // ─── Razorpay: create order – returns JSON object (not raw string) ───
    @PostMapping("/create-order")
    public Map<String, Object> createOrder(@RequestParam double amount) throws Exception {
        // Logger: info on payment order creation request
        log.info("[BookingController] Create payment order for amount: {}", amount);
        return paymentService.createOrder(amount);
    }

    // ─── Create a booking ───
    @PostMapping("/create")
    public Booking create(@RequestBody BookingRequestDTO dto) {
        // Logger: info on booking creation request with destination and user email
        log.info("[BookingController] Create booking request for user: {} destination: {}", dto.getUserEmail(), dto.getDestination());
        return service.createBooking(dto);
    }

    // ─── Get cancel info (refund preview) before actually cancelling ───
    @GetMapping("/cancel-info/{id}")
    public Map<String, Object> cancelInfo(@PathVariable Long id) {
        // Logger: info when user previews cancellation/refund details
        log.info("[BookingController] Cancel-info requested for booking id: {}", id);
        return service.getCancelInfo(id);
    }

    // ─── Cancel: accept BOTH POST and DELETE so frontend works either way ───
    @PostMapping("/cancel/{id}")
    public String cancelPost(@PathVariable Long id) {
        // Logger: info on POST cancel request
        log.info("[BookingController] POST cancel booking id: {}", id);
        return service.cancelBooking(id);
    }

    @DeleteMapping("/cancel/{id}")
    public String cancelDelete(@PathVariable Long id) {
        // Logger: info on DELETE cancel request
        log.info("[BookingController] DELETE cancel booking id: {}", id);
        return service.cancelBooking(id);
    }

    // ─── Pay remaining balance ───
    @PostMapping("/pay/{id}")
    public Booking payRemainingPost(@PathVariable Long id) {
        // Logger: info on pay-remaining POST request
        log.info("[BookingController] POST pay-remaining for booking id: {}", id);
        return service.payRemaining(id);
    }

    @PutMapping("/pay/{id}")
    public Booking payRemainingPut(@PathVariable Long id) {
        // Logger: info on pay-remaining PUT request
        log.info("[BookingController] PUT pay-remaining for booking id: {}", id);
        return service.payRemaining(id);
    }

    // ─── Extend trip – accepts JSON body ───
    @PostMapping("/extend")
    public Booking extendTrip(@RequestBody Map<String, Object> body) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        int extraDays  = Integer.parseInt(body.get("extraDays").toString());
        double extraCost = Double.parseDouble(body.get("extraCost").toString());
        return service.extendTrip(bookingId, extraDays, extraCost);
    }

    // ─── Verify payment ───
    @PostMapping("/verify")
    public String verify(@RequestParam String orderId,
                         @RequestParam String paymentId,
                         @RequestParam String signature) {
        boolean valid = paymentService.verifyPayment(orderId, paymentId, signature);
        return valid ? "Payment Verified ✅" : "Invalid Payment ❌";
    }

    // ─── Get bookings by user ───
    @GetMapping("/user")
    public List<Booking> getByUser(@RequestParam String email) {
        // Logger: info when user's bookings are fetched
        log.info("[BookingController] Fetching bookings for user: {}", email);
        return service.getBookingsByUser(email);
    }

    // ─── Get all bookings (admin) ───
    @GetMapping("/all")
    public List<Booking> getAll() {
        return service.getAllBookings();
    }

    @GetMapping("/test")
    public String test() {
        return "Booking Service Working ✅";
    }
}