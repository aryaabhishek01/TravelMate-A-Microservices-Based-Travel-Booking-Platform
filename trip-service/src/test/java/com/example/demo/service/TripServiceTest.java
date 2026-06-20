package com.example.demo.service;

import com.example.demo.dto.CustomTripDTO;
import com.example.demo.dto.TripRequestDTO;
import com.example.demo.entity.Package;
import com.example.demo.entity.SlotRecord;
import com.example.demo.repository.SlotRecordRepository;
import com.example.demo.repository.TripRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository repo;

    @Mock
    private SlotRecordRepository slotRepo;

    @Mock
    private ItineraryService itineraryService;

    @InjectMocks
    private TripService tripService;

    // ================================
    // ✅ PACKAGE CRUD
    // ================================

    @Test
    void testAddPackage_WithDestinationType() {
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("Paris Trip");
        dto.setDuration(5);
        dto.setDestinationType("INTERNATIONAL");

        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.addPackage(dto);
        assertEquals("Paris Trip", result.getName());
        assertEquals("INTERNATIONAL", result.getDestinationType());
        assertNull(result.getOwnerEmail());
        assertEquals(0, result.getBookedSlots());
    }

    @Test
    void testAddPackage_DefaultDestinationType() {
        // When destinationType is null, should default to "NATIONAL"
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("Default Trip");
        dto.setDuration(3);
        dto.setDestinationType(null);

        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.addPackage(dto);
        assertEquals("NATIONAL", result.getDestinationType());
    }

    @Test
    void testAddCustomPackage_WithName() {
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("My Custom Trip");
        dto.setOwnerEmail("user@test.com");
        dto.setDuration(3);
        dto.setDestinationType("NATIONAL");

        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.addCustomPackage(dto);
        assertEquals("CUSTOM", result.getType());
        assertEquals("user@test.com", result.getOwnerEmail());
        assertEquals("My Custom Trip", result.getName());
    }

    @Test
    void testAddCustomPackage_WithNullName_UsesDestinationType() {
        TripRequestDTO dto = new TripRequestDTO();
        dto.setName(null);
        dto.setOwnerEmail("user@test.com");
        dto.setDuration(3);
        dto.setDestinationType("NATIONAL");

        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.addCustomPackage(dto);
        assertEquals("Custom – NATIONAL", result.getName());
    }

    @Test
    void testUpdatePackage_AllFields() {
        Package existing = new Package();
        existing.setId(1L);
        existing.setName("Old Name");
        existing.setDuration(3);
        existing.setPrice(5000);
        existing.setType("DEFAULT");

        TripRequestDTO dto = new TripRequestDTO();
        dto.setName("New Name");
        dto.setDuration(7);
        dto.setPrice(8000);
        dto.setType("PREMIUM");
        dto.setDestinationType("INTERNATIONAL");

        when(repo.findById(1L)).thenReturn(Optional.of(existing));
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.updatePackage(1L, dto);

        assertEquals("New Name", result.getName());
        assertEquals(7, result.getDuration());
        assertEquals(8000.0, result.getPrice());
        assertEquals("PREMIUM", result.getType());
        assertEquals("INTERNATIONAL", result.getDestinationType());
    }

    @Test
    void testUpdatePackage_PartialUpdate() {
        Package existing = new Package();
        existing.setId(2L);
        existing.setName("Keep This Name");
        existing.setDuration(3);
        existing.setPrice(5000);

        TripRequestDTO dto = new TripRequestDTO();
        // Only updating name, duration and price are 0/null so shouldn't be updated
        dto.setName("Updated Name Only");

        when(repo.findById(2L)).thenReturn(Optional.of(existing));
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.updatePackage(2L, dto);
        assertEquals("Updated Name Only", result.getName());
        assertEquals(3, result.getDuration()); // unchanged
        assertEquals(5000.0, result.getPrice()); // unchanged
    }

    @Test
    void testUpdatePackage_NotFound_ThrowsException() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> tripService.updatePackage(99L, new TripRequestDTO()));
    }

    @Test
    void testDeletePackage() {
        tripService.deletePackage(1L);
        verify(repo).deleteById(1L);
    }

    // ================================
    // ✅ GET ALL PACKAGES
    // ================================

    @Test
    void testGetAllPackages_OnlyPublic() {
        Package publicPkg = new Package();
        publicPkg.setId(1L);
        publicPkg.setOwnerEmail(null); // public

        Package privatePkg = new Package();
        privatePkg.setId(2L);
        privatePkg.setOwnerEmail("user@test.com"); // private

        when(repo.findAll()).thenReturn(List.of(publicPkg, privatePkg));
        when(slotRepo.findByPackageIdAndYearMonth(anyLong(), anyString())).thenReturn(Optional.empty());

        List<Package> result = tripService.getAllPackages();
        assertEquals(1, result.size());
        assertNull(result.get(0).getOwnerEmail());
    }

    @Test
    void testGetAllPackages_EnrichWithSlotData() {
        Package pkg = new Package();
        pkg.setId(1L);
        pkg.setOwnerEmail(null);
        pkg.setTotalSlots(0); // will be set to MAX_SLOTS

        SlotRecord rec = new SlotRecord();
        rec.setBookedCount(5);

        when(repo.findAll()).thenReturn(List.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(anyLong(), anyString())).thenReturn(Optional.of(rec));

        List<Package> result = tripService.getAllPackages();
        assertEquals(1, result.size());
        assertEquals(5, result.get(0).getBookedSlots());
    }

    // ================================
    // ✅ GET PACKAGES FOR USER
    // ================================

    @Test
    void testGetPackagesForUser() {
        Package p1 = new Package(); p1.setId(1L); p1.setOwnerEmail(null);
        Package p2 = new Package(); p2.setId(2L); p2.setOwnerEmail("other@test.com");
        Package p3 = new Package(); p3.setId(3L); p3.setOwnerEmail("user@test.com");

        when(repo.findAll()).thenReturn(List.of(p1, p2, p3));
        when(slotRepo.findByPackageIdAndYearMonth(anyLong(), anyString())).thenReturn(Optional.empty());

        List<Package> results = tripService.getPackagesForUser("user@test.com");
        assertEquals(2, results.size()); // public p1 + private p3
    }

    // ================================
    // ✅ GET PACKAGE DETAILS
    // ================================

    @Test
    @SuppressWarnings("unchecked")
    void testGetPackageDetails() {
        Package pkg = new Package();
        pkg.setId(1L); pkg.setName("Goa"); pkg.setDuration(3);

        when(repo.findById(1L)).thenReturn(Optional.of(pkg));
        when(itineraryService.generateItineraryMaps(3)).thenReturn(List.of(Map.of("day", 1)));
        when(slotRepo.findByPackageIdAndYearMonth(anyLong(), anyString())).thenReturn(Optional.empty());

        Map<String, Object> result = tripService.getPackageDetails(1L);
        assertEquals("Goa", result.get("name"));
        assertEquals(0, result.get("bookedSlots"));
        assertNotNull(result.get("itinerary"));
    }

    // ================================
    // ✅ CALCULATE PRICE
    // ================================

    @Test
    void testCalculatePrice() {
        double price = tripService.calculatePrice(5, 2, 2000.0);
        // (2000 * 2) + (5 * 1000) = 4000 + 5000 = 9000
        assertEquals(9000.0, price);
    }

    @Test
    void testCalculatePrice_SinglePerson() {
        double price = tripService.calculatePrice(3, 1, 3000.0);
        // (3000 * 1) + (3 * 1000) = 3000 + 3000 = 6000
        assertEquals(6000.0, price);
    }

    // ================================
    // ✅ GENERATE CUSTOM TRIP
    // ================================

    @Test
    void testGenerateCustomTrip_WithDestinationType() {
        CustomTripDTO dto = new CustomTripDTO();
        dto.setDestination("Paris");
        dto.setDays(5);
        dto.setPeople(2);
        dto.setBudget(3000.0);
        dto.setDestinationType("INTERNATIONAL");

        when(itineraryService.generateItineraryMaps(5)).thenReturn(List.of(Map.of("day", 1)));

        Map<String, Object> result = tripService.generateCustomTrip(dto);

        assertEquals("Paris", result.get("destination"));
        assertEquals(5, result.get("days"));
        assertEquals(2, result.get("people"));
        assertEquals("INTERNATIONAL", result.get("destinationType"));
        assertNotNull(result.get("itinerary"));
        assertNotNull(result.get("price"));
    }

    @Test
    void testGenerateCustomTrip_NullDestinationType_DefaultsToNational() {
        CustomTripDTO dto = new CustomTripDTO();
        dto.setDestination("Goa");
        dto.setDays(3);
        dto.setPeople(1);
        dto.setBudget(2000.0);
        dto.setDestinationType(null);

        when(itineraryService.generateItineraryMaps(3)).thenReturn(Collections.emptyList());

        Map<String, Object> result = tripService.generateCustomTrip(dto);
        assertEquals("NATIONAL", result.get("destinationType"));
    }

    // ================================
    // ✅ SLOT MANAGEMENT
    // ================================

    @Test
    void testBookSlot_NewRecord_Success() {
        Long pkgId = 1L;
        String date = "2026-05-10";
        Package pkg = new Package(); pkg.setId(pkgId);

        // No existing slot record — a new one should be created
        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), eq("2026-05"))).thenReturn(Optional.empty());
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.bookSlot(pkgId, date);
        assertNotNull(result);
        verify(slotRepo).save(any(SlotRecord.class));
    }

    @Test
    void testBookSlot_ExistingRecord_Success() {
        Long pkgId = 1L;
        String date = "2026-05-10";
        Package pkg = new Package(); pkg.setId(pkgId);

        SlotRecord existingRecord = new SlotRecord();
        existingRecord.setBookedCount(5);

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), eq("2026-05"))).thenReturn(Optional.of(existingRecord));
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        tripService.bookSlot(pkgId, date);

        assertEquals(6, existingRecord.getBookedCount());
        verify(slotRepo).save(existingRecord);
    }

    @Test
    void testBookSlot_Full_ThrowsException() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);
        SlotRecord fullRecord = new SlotRecord();
        fullRecord.setBookedCount(15); // Max slots

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), anyString())).thenReturn(Optional.of(fullRecord));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> tripService.bookSlot(pkgId, "2026-05-10"));
        assertTrue(ex.getMessage().contains("No slots available"));
    }

    @Test
    void testBookSlot_PackageNotFound_ThrowsException() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> tripService.bookSlot(99L, "2026-05-10"));
    }

    @Test
    void testReleaseSlot_Success() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);
        SlotRecord record = new SlotRecord();
        record.setBookedCount(3);

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), anyString())).thenReturn(Optional.of(record));
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        tripService.releaseSlot(pkgId, "2026-05-10");
        assertEquals(2, record.getBookedCount());
    }

    @Test
    void testReleaseSlot_ZeroCount_NotDecremented() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);
        SlotRecord record = new SlotRecord();
        record.setBookedCount(0); // already at 0

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), anyString())).thenReturn(Optional.of(record));
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        tripService.releaseSlot(pkgId, "2026-05-10");
        assertEquals(0, record.getBookedCount()); // unchanged
        verify(slotRepo, never()).save(record); // should not save when already 0
    }

    @Test
    void testReleaseSlot_NoRecord_NothingHappens() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), anyString())).thenReturn(Optional.empty());
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        // Should not throw
        tripService.releaseSlot(pkgId, "2026-05-10");
        verify(slotRepo, never()).save(any());
    }

    // ================================
    // ✅ BACKWARD-COMPAT OVERLOADS
    // ================================

    @Test
    void testBookSlot_BackwardCompat_NoDate() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);
        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), eq(currentMonth))).thenReturn(Optional.empty());
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.bookSlot(pkgId);
        assertNotNull(result);
    }

    @Test
    void testReleaseSlot_BackwardCompat_NoDate() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(anyLong(), anyString())).thenReturn(Optional.empty());
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        Package result = tripService.releaseSlot(pkgId);
        assertNotNull(result);
    }

    // ================================
    // ✅ RESOLVE MONTH FALLBACK
    // ================================

    @Test
    void testBookSlot_InvalidDate_FallsBackToCurrentMonth() {
        Long pkgId = 1L;
        Package pkg = new Package(); pkg.setId(pkgId);
        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        when(repo.findById(pkgId)).thenReturn(Optional.of(pkg));
        when(slotRepo.findByPackageIdAndYearMonth(eq(pkgId), anyString())).thenReturn(Optional.empty());
        when(repo.save(any(Package.class))).thenAnswer(i -> i.getArguments()[0]);

        // Invalid date string triggers catch block in resolveMonth
        tripService.bookSlot(pkgId, "not-a-date");

        verify(slotRepo).findByPackageIdAndYearMonth(pkgId, currentMonth);
    }

    // ================================
    // ✅ ENRICH WITH MONTH SLOTS (exception path)
    // ================================

    @Test
    void testGetAllPackages_SlotQueryException_FallsBackToDefaults() {
        Package pkg = new Package();
        pkg.setId(1L);
        pkg.setOwnerEmail(null);
        pkg.setTotalSlots(15);

        when(repo.findAll()).thenReturn(List.of(pkg));
        // Simulate a DB error during slot query
        when(slotRepo.findByPackageIdAndYearMonth(anyLong(), anyString()))
                .thenThrow(new RuntimeException("Table not found"));

        // Should not throw - exception is caught and defaults are used
        List<Package> result = tripService.getAllPackages();
        assertEquals(1, result.size());
        assertEquals(0, result.get(0).getBookedSlots());
        assertEquals(SlotRecord.MAX_SLOTS, result.get(0).getTotalSlots());
    }
}