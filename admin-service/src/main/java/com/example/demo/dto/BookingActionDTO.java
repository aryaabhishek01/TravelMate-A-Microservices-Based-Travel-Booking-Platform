package com.example.demo.dto;

import lombok.Data;

@Data
public class BookingActionDTO {

    private Long bookingId;
    private String action; // CANCEL / REFUND
}