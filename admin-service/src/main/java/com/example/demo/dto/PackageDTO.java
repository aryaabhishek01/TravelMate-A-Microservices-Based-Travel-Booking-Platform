package com.example.demo.dto;

import lombok.Data;

@Data
public class PackageDTO {

    private String name;
    private int duration;
    private double price;
    private String type;            // DEFAULT / PREMIUM / BUDGET
    private String destinationType; // NATIONAL / INTERNATIONAL
}