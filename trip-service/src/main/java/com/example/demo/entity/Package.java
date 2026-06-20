package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "packages")
public class Package {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int duration; // 3–10 days
    private double price;
    private String type; // DEFAULT / CUSTOM / PREMIUM / BUDGET

    // 🔑 null = public package; set = private (user-owned)
    private String ownerEmail;

    // NATIONAL / INTERNATIONAL
    private String destinationType;

    // ─── Slot fields kept for backward compat; source of truth is SlotRecord ───
    private int totalSlots = 15;
    private int bookedSlots = 0;
}