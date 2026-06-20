package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class CustomTripDTO {

    private String destination;
    private int days;
    private int people;
    private double budget;          // base price per person

    // For user-private custom package
    private String userEmail;
    private String destinationType; // NATIONAL / INTERNATIONAL
    private List<String> travellerNames;
}