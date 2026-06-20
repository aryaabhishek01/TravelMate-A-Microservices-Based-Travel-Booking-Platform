package com.example.demo.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DTOTest {

    @Test
    void testPackageDTO() {
        PackageDTO dto = new PackageDTO();
        dto.setName("Test");
        dto.setPrice(100.0);
        dto.setDuration(5);
        dto.setType("DEFAULT");

        assertEquals("Test", dto.getName());
        assertEquals(100.0, dto.getPrice());
        assertEquals(5, dto.getDuration());
        assertEquals("DEFAULT", dto.getType());
    }

    @Test
    void testBookingActionDTO() {
        BookingActionDTO dto = new BookingActionDTO();
        dto.setBookingId(1L);
        dto.setAction("CANCEL");

        assertEquals(1L, dto.getBookingId());
        assertEquals("CANCEL", dto.getAction());
    }
}