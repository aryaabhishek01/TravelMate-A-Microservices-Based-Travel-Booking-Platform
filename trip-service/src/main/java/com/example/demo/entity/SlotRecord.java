package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Tracks how many bookings exist per package per calendar month.
 * Max 15 per packageId + yearMonth.
 * yearMonth format: "2026-04"
 */
@Entity
@Table(name = "slot_records",
       uniqueConstraints = @UniqueConstraint(columnNames = {"package_id", "`year_month`"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "`year_month`", nullable = false)
    private String yearMonth; // e.g. "2026-04"

    @Column(nullable = false)
    private int bookedCount = 0;

    public static final int MAX_SLOTS = 15;
}
