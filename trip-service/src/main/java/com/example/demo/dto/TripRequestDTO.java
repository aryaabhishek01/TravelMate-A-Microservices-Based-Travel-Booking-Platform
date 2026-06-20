package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class TripRequestDTO {

    private String name;
    private int duration;
    private double price;
    private String type;            // DEFAULT / CUSTOM / PREMIUM / BUDGET

    // For user-private custom packages
    private String ownerEmail;      // null → public package
    private String destinationType; // NATIONAL / INTERNATIONAL
}