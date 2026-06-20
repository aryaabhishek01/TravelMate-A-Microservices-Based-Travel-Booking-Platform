package com.example.demo.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ItineraryService {

    // Full activity pool (more than 10 so we never run out for long trips)
    private static final List<String> ACTIVITY_POOL = List.of(
            "Arrival + Hotel Check-in & Welcome Dinner",
            "City Sightseeing & Heritage Walk",
            "Adventure Activities & Outdoor Sports",
            "Beach / Lake Visit & Water Sports",
            "Shopping at Local Markets & Bazaars",
            "Cultural Exploration & Museum Visit",
            "Relaxation Day & Spa / Wellness",
            "Hidden Gems & Off-Beat Places Visit",
            "Leisure Day – Optional Excursion",
            "Sunrise Trek / Scenic Viewpoint",
            "Local Cuisine Food Tour",
            "Photography Walk & Scenic Drive",
            "Theme Park / Amusement Zone",
            "River Rafting / Wildlife Safari",
            "Village Tour & Countryside Experience"
    );

    /**
     * Generate a day-by-day itinerary as a List of Maps: [{day, plan}, ...]
     * ALWAYS ensures the last day is "Departure & Check-out".
     */
    public List<Map<String, Object>> generateItineraryMaps(int days) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < days - 1; i++) {
            result.add(Map.of(
                    "day", i + 1,
                    "plan", ACTIVITY_POOL.get(i % ACTIVITY_POOL.size())
            ));
        }
        // Last day is always Departure
        result.add(Map.of("day", days, "plan", "Departure & Check-out"));
        return result;
    }

    /**
     * Same but returns plain strings (legacy / email use).
     * Always last = Departure.
     */
    public List<String> generateItinerary(int days) {
        List<String> result = new ArrayList<>();
        for (int i = 0; i < days - 1; i++) {
            result.add("Day " + (i + 1) + ": " + ACTIVITY_POOL.get(i % ACTIVITY_POOL.size()));
        }
        result.add("Day " + days + ": Departure & Check-out");
        return result;
    }

    /**
     * Default package itinerary (same logic, kept for backward compat).
     */
    public List<String> generateDefaultItinerary(int days) {
        return generateItinerary(days);
    }
}