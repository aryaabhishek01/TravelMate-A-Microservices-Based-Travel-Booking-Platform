package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "BOOKING-SERVICE")
public interface BookingClient {

    @PostMapping("/booking/cancel/{id}")
    String cancelBooking(@PathVariable Long id);

    @GetMapping("/booking/all")
    List<Object> getAllBookings();

    @GetMapping("/booking/user")
    List<Object> getBookingsByUser(@RequestParam("email") String email);
}