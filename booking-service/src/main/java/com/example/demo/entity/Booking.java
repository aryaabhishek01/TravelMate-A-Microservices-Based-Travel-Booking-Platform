package com.example.demo.entity;

import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Boolean fullPaid = false;

    @Column(nullable = false)
    private String travelStatus = "NOT_STARTED"; // NOT_STARTED / ONGOING / COMPLETED

    private int totalSlots = 15;
    private int bookedSlots;

    private String startDate;
    private String endDate;

    @ElementCollection
    private List<String> travellerNames;
    private Long packageId;
    private String userEmail;
    private String destination;
    private int days;
    private int people;

    private double totalAmount;
    private double paidAmount;

    private String paymentStatus; // PARTIAL / FULL
    private String bookingStatus; // CONFIRMED / CANCELLED

    // true = user-created custom trip; false = admin default package booking
    private boolean isCustom = false;
}