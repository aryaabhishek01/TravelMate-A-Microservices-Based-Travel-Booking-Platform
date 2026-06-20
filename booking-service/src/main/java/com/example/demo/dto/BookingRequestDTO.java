package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class BookingRequestDTO {

    private String userEmail;
    private String destination;
    private int days;
    private int people;
    private double totalAmount;
    private boolean fullPayment;
    private Long packageId;

    private String startDate;
    private List<String> travellerNames;

    // Optional: custom package flag
    private boolean isCustom = false;
    private String packageType; // DEFAULT / CUSTOM / PREMIUM / BUDGET
}