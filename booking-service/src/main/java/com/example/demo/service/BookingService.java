package com.example.demo.service;

import com.example.demo.dto.BookingRequestDTO;
import com.example.demo.entity.Booking;
import com.example.demo.repository.BookingRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;
import java.nio.charset.StandardCharsets;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class BookingService {

    // Logger: records all significant booking operations (creation, payment, cancellation, extension)
    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository repo;

    // Load-balanced RestTemplate for Eureka service discovery (e.g. TRIP-SERVICE)
    @Autowired
    private RestTemplate restTemplate;

    // Plain RestTemplate for direct Docker hostname calls — bypasses Eureka
    @Autowired
    @Qualifier("plainRestTemplate")
    private RestTemplate plainRestTemplate;

    // 🔔 Notification: direct Docker hostname — no Eureka timing issues
    @Value("${notification.url:http://notification-service:8084}")
    private String NOTIFICATION_BASE_URL;

    // 🔥 Trip Service URL (Eureka-resolved)
    private final String TRIP_URL = "http://TRIP-SERVICE/trips";

    // ================================
    // 🔥 CREATE BOOKING
    // ================================
    public Booking createBooking(BookingRequestDTO dto) {

        // ✅ VALIDATION
        if (dto.getTravellerNames() == null ||
                dto.getTravellerNames().size() != dto.getPeople()) {
            // Logger: warn on traveller count mismatch validation failure
            log.warn("[BookingService] Traveller count mismatch for user: {} — expected {}", dto.getUserEmail(), dto.getPeople());
            throw new RuntimeException("Traveller count mismatch");
        }

        // 🔥 BOOK SLOT (Trip Service) — FIX: catch slot errors and return friendly message
        String slotUrl = TRIP_URL + "/slot/book/" + dto.getPackageId()
                + "?startDate=" + dto.getStartDate();
        try {
            restTemplate.postForObject(slotUrl, null, String.class);
            // Logger: debug on successful slot booking via trip-service
            log.debug("[BookingService] Slot booked successfully for package: {} on date: {}", dto.getPackageId(), dto.getStartDate());
        } catch (HttpClientErrorException e) {
            // Logger: warn when slot is full (409)
            log.warn("[BookingService] No slots available for package: {} on date: {}", dto.getPackageId(), dto.getStartDate());
            // 409 = no slots available
            throw new RuntimeException("No slots available for this package on the selected date. Please choose another date.");
        } catch (Exception e) {
            // Trip service unreachable — log but don't fail the booking
            // Logger: warn when trip-service is unreachable (non-critical)
            log.warn("[BookingService] Trip service slot booking failed (non-critical): {}", e.getMessage());
            System.out.println("Trip service slot booking failed (non-critical): " + e.getMessage());
        }

        Booking booking = new Booking();
        booking.setPackageId(dto.getPackageId());
        booking.setUserEmail(dto.getUserEmail());
        booking.setDestination(dto.getDestination());
        booking.setDays(dto.getDays());
        booking.setPeople(dto.getPeople());
        booking.setTravellerNames(dto.getTravellerNames());
        booking.setTotalAmount(dto.getTotalAmount());

        // 📅 DATE LOGIC
        LocalDate start = LocalDate.parse(dto.getStartDate());
        LocalDate end   = start.plusDays(dto.getDays() - 1);

        booking.setStartDate(start.toString());
        booking.setEndDate(end.toString());

        // 💳 PAYMENT LOGIC
        double paid;
        if (dto.isFullPayment()) {
            paid = dto.getTotalAmount();
            booking.setPaymentStatus("FULL");
            booking.setFullPaid(true);
        } else {
            paid = Math.round(dto.getTotalAmount() * 0.3 * 100.0) / 100.0;
            booking.setPaymentStatus("PARTIAL");
            booking.setFullPaid(false);
        }

        booking.setPaidAmount(paid);
        booking.setBookingStatus("CONFIRMED");
        booking.setTravelStatus("NOT_STARTED");
        booking.setCustom(dto.isCustom());

        Booking saved = repo.save(booking);
        // Logger: info on successful booking creation
        log.info("[BookingService] Booking created — id: {} user: {} destination: {} payment: {}",
                saved.getId(), saved.getUserEmail(), saved.getDestination(), saved.getPaymentStatus());

        // 📩 EMAIL — always non-blocking
        String itineraryText = buildItineraryEmail(saved.getDestination(), saved.getDays(), saved.getStartDate());
        sendNotification(
                saved.getUserEmail(),
                "✈ Booking Confirmed – " + saved.getDestination(),
                "Dear Traveller,\n\n" +
                "Your trip to " + saved.getDestination() + " is confirmed!\n\n" +
                "👥 Travellers: " + String.join(", ", saved.getTravellerNames()) + "\n" +
                "📅 Start: " + saved.getStartDate() + "\n" +
                "🏁 Return: " + saved.getEndDate() + "\n" +
                "💰 Total: ₹" + saved.getTotalAmount() + "\n" +
                "✅ Paid: ₹" + paid + "\n\n" +
                "📋 Your Itinerary:\n" + itineraryText + "\n\n" +
                "Have a wonderful trip!\n– TravelMate Team"
        );

        return saved;
    }

    // ================================
    // 💳 PAY REMAINING
    // ================================
    public Booking payRemaining(Long bookingId) {
        Booking booking = repo.findById(bookingId).orElseThrow();
        // Logger: info on pay-remaining request
        log.info("[BookingService] Pay-remaining requested for booking id: {}", bookingId);

        if (Boolean.TRUE.equals(booking.getFullPaid())) {
            // Logger: warn when booking is already fully paid
            log.warn("[BookingService] Booking id: {} is already fully paid", bookingId);
            throw new RuntimeException("Already fully paid");
        }

        booking.setPaidAmount(booking.getTotalAmount());
        booking.setPaymentStatus("FULL");
        booking.setFullPaid(true);

        Booking saved = repo.save(booking);
        // Logger: info on successful full payment
        log.info("[BookingService] Full payment completed for booking id: {} total: {}", saved.getId(), saved.getTotalAmount());

        sendNotification(
                saved.getUserEmail(),
                "💳 Payment Completed – " + saved.getDestination(),
                "Full payment of ₹" + saved.getTotalAmount() +
                " completed for " + saved.getDestination() + ".\nTrip dates: " +
                saved.getStartDate() + " → " + saved.getEndDate()
        );

        return saved;
    }

    // ================================
    // ℹ️ GET CANCEL INFO
    // ================================
    public Map<String, Object> getCancelInfo(Long bookingId) {
        Booking booking = repo.findById(bookingId).orElseThrow();

        if ("CANCELLED".equals(booking.getBookingStatus())) {
            return Map.of("refund", 0.0, "message", "This booking is already cancelled.");
        }

        if ("ONGOING".equals(booking.getTravelStatus())) {
            return Map.of("refund", 0.0,
                    "message", "Your trip has already started. No refund applicable.");
        }

        if (!Boolean.TRUE.equals(booking.getFullPaid())) {
            return Map.of("refund", 0.0,
                    "message", "You paid only the 30% advance. No refund will be issued upon cancellation.");
        }

        double refund = Math.round(booking.getTotalAmount() * 0.7 * 100.0) / 100.0;
        return Map.of(
                "refund", refund,
                "message", "You will receive a refund of ₹" + refund +
                        " (70% of ₹" + booking.getTotalAmount() + ")."
        );
    }

    // ================================
    // ❌ CANCEL BOOKING
    // ================================
    public String cancelBooking(Long bookingId) {
        Booking booking = repo.findById(bookingId).orElseThrow();
        // Logger: info on cancellation request
        log.info("[BookingService] Cancel booking requested for id: {} user: {}", bookingId, booking.getUserEmail());

        String releaseUrl = TRIP_URL + "/slot/release/" + booking.getPackageId()
                + "?startDate=" + booking.getStartDate();
        try {
            restTemplate.postForObject(releaseUrl, null, String.class);
        } catch (Exception ignored) {}

        if ("ONGOING".equals(booking.getTravelStatus())) {
            booking.setBookingStatus("CANCELLED");
            repo.save(booking);
            sendNotification(booking.getUserEmail(),
                    "Booking Cancelled",
                    "Your trip to " + booking.getDestination() + " was cancelled. No refund (trip started).");
            return "Cancelled. No refund (trip started)";
        }

        if (!Boolean.TRUE.equals(booking.getFullPaid())) {
            booking.setBookingStatus("CANCELLED");
            repo.save(booking);
            sendNotification(booking.getUserEmail(),
                    "Booking Cancelled",
                    "Your booking for " + booking.getDestination() +
                    " was cancelled. No refund (only 30% advance paid).");
            return "Cancelled. No refund (30% only)";
        }

        double refund = Math.round(booking.getTotalAmount() * 0.7 * 100.0) / 100.0;
        booking.setBookingStatus("CANCELLED");
        repo.save(booking);
        // Logger: info on cancellation with refund
        log.info("[BookingService] Booking id: {} cancelled with refund: {}", bookingId, refund);

        sendNotification(
                booking.getUserEmail(),
                "✅ Booking Cancelled – Refund Initiated",
                "Your trip to " + booking.getDestination() + " has been cancelled.\n" +
                "💰 Refund Amount: ₹" + refund + " (70% of ₹" + booking.getTotalAmount() + ")\n" +
                "The refund will be processed in 5-7 business days."
        );

        return "Cancelled. Refund: ₹" + refund;
    }

    // ================================
    // 🔁 EXTEND TRIP
    // ================================
    public Booking extendTrip(Long bookingId, int extraDays, double extraCost) {
        Booking booking = repo.findById(bookingId).orElseThrow();
        // Logger: info on trip extension request
        log.info("[BookingService] Extend trip requested for booking id: {} extra days: {} extra cost: {}", bookingId, extraDays, extraCost);

        LocalDate currentEnd = LocalDate.parse(booking.getEndDate());
        LocalDate newEnd     = currentEnd.plusDays(extraDays);

        try {
            String bookUrl = TRIP_URL + "/slot/book/" + booking.getPackageId()
                    + "?startDate=" + newEnd.toString();
            restTemplate.postForObject(bookUrl, null, String.class);
        } catch (Exception e) {
            throw new RuntimeException("No slots available for the extension period: " + e.getMessage());
        }

        int newTotalDays = booking.getDays() + extraDays;
        booking.setDays(newTotalDays);
        booking.setEndDate(newEnd.toString());
        booking.setTotalAmount(booking.getTotalAmount() + extraCost);
        booking.setFullPaid(false);
        booking.setPaymentStatus("PARTIAL");

        Booking saved = repo.save(booking);

        String itineraryText = buildItineraryEmail(saved.getDestination(), newTotalDays, saved.getStartDate());
        sendNotification(
                saved.getUserEmail(),
                "🔁 Trip Extended – " + saved.getDestination(),
                "Great news! Your trip to " + saved.getDestination() + " has been extended.\n\n" +
                "📅 New End Date: " + newEnd + "\n" +
                "Total Days: " + newTotalDays + "\n" +
                "Extra Cost: ₹" + extraCost + "\n\n" +
                "📋 Updated Itinerary:\n" + itineraryText + "\n\n" +
                "– TravelMate Team"
        );

        return saved;
    }

    // ================================
    // 🔥 AUTO STATUS UPDATE (daily at midnight)
    // ================================
    @Scheduled(cron = "0 0 0 * * *")
    public void updateTripStatus() {
        List<Booking> bookings = repo.findAll();
        LocalDate today = LocalDate.now();
        // Logger: info when scheduled status update job runs
        log.info("[BookingService] Scheduled updateTripStatus running for {} bookings on {}", bookings.size(), today);

        for (Booking b : bookings) {
            if (b.getEndDate() != null &&
                    LocalDate.parse(b.getEndDate()).isBefore(today) &&
                    !"COMPLETED".equals(b.getTravelStatus()) &&
                    !"CANCELLED".equals(b.getBookingStatus())) {

                b.setTravelStatus("COMPLETED");
                try {
                    String releaseUrl = TRIP_URL + "/slot/release/" + b.getPackageId()
                            + "?startDate=" + b.getStartDate();
                    restTemplate.postForObject(releaseUrl, null, String.class);
                } catch (Exception ignored) {}

                repo.save(b);
                // Logger: debug each booking marked as COMPLETED
                log.debug("[BookingService] Booking id: {} marked COMPLETED", b.getId());
            }

            if (b.getStartDate() != null &&
                    !LocalDate.parse(b.getStartDate()).isAfter(today) &&
                    b.getEndDate() != null &&
                    !LocalDate.parse(b.getEndDate()).isBefore(today) &&
                    "NOT_STARTED".equals(b.getTravelStatus()) &&
                    !"CANCELLED".equals(b.getBookingStatus())) {
                b.setTravelStatus("ONGOING");
                repo.save(b);
                // Logger: debug each booking marked as ONGOING
                log.debug("[BookingService] Booking id: {} marked ONGOING", b.getId());
            }
        }
    }

    // ================================
    // 📩 SEND EMAIL (non-blocking)
    // ================================
    private void sendNotification(String email, String subject, String message) {
        try {
            // UriComponentsBuilder handles encoding correctly — prevents double-encoding
            // of special chars like @ in email addresses. Manual URLEncoder + RestTemplate
            // would double-encode %40 → %2540, so Gmail receives "%40" instead of "@".
            URI uri = UriComponentsBuilder
                    .fromHttpUrl(NOTIFICATION_BASE_URL + "/notify/send")
                    .queryParam("email", email)
                    .queryParam("subject", subject)
                    .queryParam("message", message)
                    .encode(StandardCharsets.UTF_8)
                    .build()
                    .toUri();
            log.info("[BookingService] Sending notification → {} for: {}", NOTIFICATION_BASE_URL + "/notify/send", email);
            String result = plainRestTemplate.postForObject(uri, null, String.class);
            log.info("[BookingService] ✅ Notification sent: {}", result);
        } catch (Exception e) {
            log.error("[BookingService] ❌ Email FAILED to: {} reason: {}", email, e.getMessage(), e);
        }
    }

    // ================================
    // 📋 BUILD ITINERARY TEXT FOR EMAIL
    // ================================
    private String buildItineraryEmail(String destination, int days, String startDate) {
        String[] activities = {
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
        };

        StringBuilder sb = new StringBuilder();
        LocalDate date = null;
        try { date = LocalDate.parse(startDate); } catch (Exception ignored) {}

        for (int i = 0; i < days; i++) {
            String dateStr = (date != null) ? " (" + date.plusDays(i) + ")" : "";
            if (i == days - 1) {
                sb.append("  Day ").append(i + 1).append(dateStr)
                  .append(": Departure & Check-out\n");
            } else {
                sb.append("  Day ").append(i + 1).append(dateStr)
                  .append(": ").append(activities[i % activities.length]).append("\n");
            }
        }
        return sb.toString();
    }

    // ================================
    // 📦 GET DATA
    // ================================
    public List<Booking> getBookingsByUser(String email) {
        return repo.findByUserEmail(email);
    }

    public List<Booking> getAllBookings() {
        return repo.findAll();
    }
}