package com.example.demo.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ItineraryServiceTest {

    private final ItineraryService service = new ItineraryService();

    @Test
    void testGenerateItineraryMaps_BasicDays() {
        List<Map<String, Object>> result = service.generateItineraryMaps(3);
        assertEquals(3, result.size());
        // First day should be first activity
        assertEquals(1, result.get(0).get("day"));
        assertNotNull(result.get(0).get("plan"));
        // Last day should always be Departure
        assertEquals("Departure & Check-out", result.get(2).get("plan"));
    }

    @Test
    void testGenerateItineraryMaps_OneDayTrip() {
        List<Map<String, Object>> result = service.generateItineraryMaps(1);
        assertEquals(1, result.size());
        assertEquals("Departure & Check-out", result.get(0).get("plan"));
    }

    @Test
    void testGenerateItineraryMaps_LongTrip_Wraps() {
        // 20 days - should wrap the activity pool
        List<Map<String, Object>> result = service.generateItineraryMaps(20);
        assertEquals(20, result.size());
        // Last day always departure
        assertEquals("Departure & Check-out", result.get(19).get("plan"));
        // Day 16 wraps around to first activity (15 activities in pool + 1 = index 0)
        assertEquals(1, result.get(0).get("day"));
    }

    @Test
    void testGenerateItinerary_BasicDays() {
        List<String> result = service.generateItinerary(3);
        assertEquals(3, result.size());
        assertTrue(result.get(0).contains("Day 1"));
        assertTrue(result.get(2).contains("Departure"));
    }

    @Test
    void testGenerateItinerary_SingleDay() {
        List<String> result = service.generateItinerary(1);
        assertEquals(1, result.size());
        assertTrue(result.get(0).contains("Departure"));
    }

    @Test
    void testGenerateItinerary_FifteenDays() {
        // 15 activities in pool - Day 15 wraps to index 14 (last activity), then departure
        List<String> result = service.generateItinerary(15);
        assertEquals(15, result.size());
        // Last item is always departure
        assertTrue(result.get(14).contains("Departure"));
    }

    @Test
    void testGenerateDefaultItinerary_IsSameAsGenerateItinerary() {
        List<String> defaultResult = service.generateDefaultItinerary(5);
        List<String> itineraryResult = service.generateItinerary(5);
        assertEquals(defaultResult.size(), itineraryResult.size());
        for (int i = 0; i < defaultResult.size(); i++) {
            assertEquals(defaultResult.get(i), itineraryResult.get(i));
        }
    }

    @Test
    void testGenerateDefaultItinerary_SmallTrip() {
        List<String> result = service.generateDefaultItinerary(2);
        assertEquals(2, result.size());
        assertTrue(result.get(1).contains("Departure"));
    }
}