package com.example.demo.service;

import com.example.demo.dto.CustomTripDTO;
import com.example.demo.dto.TripRequestDTO;
import com.example.demo.entity.Package;
import com.example.demo.entity.SlotRecord;
import com.example.demo.repository.SlotRecordRepository;
import com.example.demo.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class TripService {

    @Autowired
    private TripRepository repo;

    @Autowired
    private SlotRecordRepository slotRepo;

    @Autowired
    private ItineraryService itineraryService;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    // ─────────────────────────────────────────────────────────
    // ✅ ADD PUBLIC PACKAGE (admin)
    // ─────────────────────────────────────────────────────────
    public Package addPackage(TripRequestDTO dto) {
        Package pkg = new Package();
        pkg.setName(dto.getName());
        pkg.setDuration(dto.getDuration());
        pkg.setPrice(dto.getPrice());
        pkg.setType(dto.getType());
        pkg.setOwnerEmail(null); // public
        pkg.setDestinationType(dto.getDestinationType() != null ? dto.getDestinationType() : "NATIONAL");
        pkg.setTotalSlots(SlotRecord.MAX_SLOTS);
        pkg.setBookedSlots(0);
        return repo.save(pkg);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ ADD USER-PRIVATE CUSTOM PACKAGE
    // ─────────────────────────────────────────────────────────
    public Package addCustomPackage(TripRequestDTO dto) {
        Package pkg = new Package();
        pkg.setName(dto.getName() != null ? dto.getName()
                : "Custom – " + dto.getDestinationType());
        pkg.setDuration(dto.getDuration());
        pkg.setPrice(dto.getPrice());
        pkg.setType("CUSTOM");
        pkg.setOwnerEmail(dto.getOwnerEmail());
        pkg.setDestinationType(dto.getDestinationType());
        pkg.setTotalSlots(SlotRecord.MAX_SLOTS);
        pkg.setBookedSlots(0);
        return repo.save(pkg);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ UPDATE AN EXISTING PUBLIC PACKAGE (admin)
    // ─────────────────────────────────────────────────────────
    public Package updatePackage(Long id, TripRequestDTO dto) {
        Package pkg = repo.findById(id).orElseThrow(() -> new RuntimeException("Package not found"));
        if (dto.getName()            != null) pkg.setName(dto.getName());
        if (dto.getDuration()        > 0)     pkg.setDuration(dto.getDuration());
        if (dto.getPrice()           > 0)     pkg.setPrice(dto.getPrice());
        if (dto.getType()            != null) pkg.setType(dto.getType());
        if (dto.getDestinationType() != null) pkg.setDestinationType(dto.getDestinationType());
        return repo.save(pkg);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ DELETE A PACKAGE (admin)
    // ─────────────────────────────────────────────────────────
    public void deletePackage(Long id) {
        repo.deleteById(id);
    }


    // ─────────────────────────────────────────────────────────
    public List<Package> getAllPackages() {
        // Only packages without an ownerEmail are public
        List<Package> all = repo.findAll();
        String currentMonth = LocalDate.now().format(MONTH_FMT);
        all.stream()
           .filter(p -> p.getOwnerEmail() == null)
           .forEach(p -> enrichWithMonthSlots(p, currentMonth));
        return all.stream().filter(p -> p.getOwnerEmail() == null).toList();
    }

    // ─────────────────────────────────────────────────────────
    // ✅ GET PACKAGES FOR A SPECIFIC USER (public + their private)
    // ─────────────────────────────────────────────────────────
    public List<Package> getPackagesForUser(String email) {
        String currentMonth = LocalDate.now().format(MONTH_FMT);
        List<Package> all = repo.findAll();
        return all.stream()
                .filter(p -> p.getOwnerEmail() == null
                        || p.getOwnerEmail().equalsIgnoreCase(email))
                .peek(p -> enrichWithMonthSlots(p, currentMonth))
                .toList();
    }

    /**
     * Populate totalSlots / bookedSlots from SlotRecord for a given month.
     * Wrapped in try-catch so a missing slot_records table (first boot before
     * ddl-auto=update has run) never crashes the package listing endpoints.
     */
    private void enrichWithMonthSlots(Package p, String yearMonth) {
        // Always guarantee totalSlots is set correctly
        if (p.getTotalSlots() <= 0) {
            p.setTotalSlots(SlotRecord.MAX_SLOTS);
        }
        try {
            int booked = slotRepo.findByPackageIdAndYearMonth(p.getId(), yearMonth)
                    .map(SlotRecord::getBookedCount)
                    .orElse(0);
            p.setBookedSlots(booked);
            p.setTotalSlots(SlotRecord.MAX_SLOTS);
            // Self-heal legacy rows where DB had 0
            if (p.getTotalSlots() == 0) {
                repo.save(p);
            }
        } catch (Exception e) {
            // slot_records table may not exist yet (needs service restart);
            // fall back to defaults so packages still render
            System.out.println("[WARN] slot_records query failed (table may not exist yet): " + e.getMessage());
            p.setTotalSlots(SlotRecord.MAX_SLOTS);
            p.setBookedSlots(0);
        }
    }

    // ─────────────────────────────────────────────────────────
    // ✅ GET PACKAGE DETAILS + ITINERARY
    // ─────────────────────────────────────────────────────────
    public Map<String, Object> getPackageDetails(Long id) {
        Package pkg = repo.findById(id).orElseThrow();
        List<Map<String, Object>> itinerary =
                itineraryService.generateItineraryMaps(pkg.getDuration());
        String currentMonth = LocalDate.now().format(MONTH_FMT);
        enrichWithMonthSlots(pkg, currentMonth);

        return Map.of(
                "id", pkg.getId(),
                "name", pkg.getName(),
                "duration", pkg.getDuration(),
                "price", pkg.getPrice(),
                "type", pkg.getType(),
                "totalSlots", pkg.getTotalSlots(),
                "bookedSlots", pkg.getBookedSlots(),
                "itinerary", itinerary
        );
    }

    // ─────────────────────────────────────────────────────────
    // ✅ PRICE LOGIC
    // ─────────────────────────────────────────────────────────
    public double calculatePrice(int days, int people, double basePerPerson) {
        return (basePerPerson * people) + (days * 1000L);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ GENERATE CUSTOM TRIP PREVIEW (no booking yet)
    // ─────────────────────────────────────────────────────────
    public Map<String, Object> generateCustomTrip(CustomTripDTO dto) {
        List<Map<String, Object>> itinerary =
                itineraryService.generateItineraryMaps(dto.getDays());
        double price = calculatePrice(dto.getDays(), dto.getPeople(), dto.getBudget());

        return Map.of(
                "destination", dto.getDestination(),
                "days", dto.getDays(),
                "people", dto.getPeople(),
                "destinationType", dto.getDestinationType() != null ? dto.getDestinationType() : "NATIONAL",
                "itinerary", itinerary,
                "price", price
        );
    }

    // ─────────────────────────────────────────────────────────
    // 🔥 BOOK SLOT  (month-aware)
    // ─────────────────────────────────────────────────────────
    /**
     * @param packageId the package
     * @param startDate trip start date (ISO) — slot assigned to that month
     */
    public Package bookSlot(Long packageId, String startDate) {
        Package pkg = repo.findById(packageId).orElseThrow(() ->
                new RuntimeException("Package not found"));

        String yearMonth = resolveMonth(startDate);

        SlotRecord rec = slotRepo
                .findByPackageIdAndYearMonth(packageId, yearMonth)
                .orElseGet(() -> {
                    SlotRecord r = new SlotRecord();
                    r.setPackageId(packageId);
                    r.setYearMonth(yearMonth);
                    r.setBookedCount(0);
                    return r;
                });

        if (rec.getBookedCount() >= SlotRecord.MAX_SLOTS) {
            throw new RuntimeException(
                    "No slots available for " + yearMonth + " ❌ (max 15 per month)");
        }

        rec.setBookedCount(rec.getBookedCount() + 1);
        slotRepo.save(rec);

        // Keep package.bookedSlots in sync (current month)
        String currentMonth = LocalDate.now().format(MONTH_FMT);
        enrichWithMonthSlots(pkg, currentMonth);
        return repo.save(pkg);
    }

    // ─────────────────────────────────────────────────────────
    // 🔥 RELEASE SLOT (cancel / complete)
    // ─────────────────────────────────────────────────────────
    public Package releaseSlot(Long packageId, String startDate) {
        Package pkg = repo.findById(packageId).orElseThrow(() ->
                new RuntimeException("Package not found"));

        String yearMonth = resolveMonth(startDate);

        slotRepo.findByPackageIdAndYearMonth(packageId, yearMonth)
                .ifPresent(rec -> {
                    if (rec.getBookedCount() > 0) {
                        rec.setBookedCount(rec.getBookedCount() - 1);
                        slotRepo.save(rec);
                    }
                });

        String currentMonth = LocalDate.now().format(MONTH_FMT);
        enrichWithMonthSlots(pkg, currentMonth);
        return repo.save(pkg);
    }

    // ─────────────────────────────────────────────────────────
    // Backward-compat overloads used by old REST calls
    // ─────────────────────────────────────────────────────────
    public Package bookSlot(Long packageId) {
        return bookSlot(packageId, LocalDate.now().toString());
    }

    public Package releaseSlot(Long packageId) {
        return releaseSlot(packageId, LocalDate.now().toString());
    }

    // ─────────────────────────────────────────────────────────
    // Helper: resolve yearMonth from date string or fallback
    // ─────────────────────────────────────────────────────────
    private String resolveMonth(String dateStr) {
        try {
            return LocalDate.parse(dateStr).format(MONTH_FMT);
        } catch (Exception e) {
            return LocalDate.now().format(MONTH_FMT);
        }
    }
}