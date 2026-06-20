package com.example.demo.service;

import com.example.demo.dto.BookingRequestDTO;
import com.example.demo.entity.Booking;
import com.example.demo.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingServiceTest {

    @Mock
    private BookingRepository repo;

    // Eureka load-balanced RestTemplate (used for trip-service slot calls)
    @Mock
    private RestTemplate restTemplate;

    // Plain RestTemplate (used for notification-service calls)
    // Field name must match BookingService field name for @InjectMocks to resolve correctly
    @Mock
    private RestTemplate plainRestTemplate;

    @InjectMocks
    private BookingService service;

    @BeforeEach
    void setUp() {
        // @Value is not processed by @InjectMocks — inject the field manually
        ReflectionTestUtils.setField(service, "NOTIFICATION_BASE_URL", "http://notification-service:8084");
        // Default: notification returns success (lenient so it doesn't fail in tests that don't verify it)
        when(plainRestTemplate.postForObject(any(URI.class), isNull(), eq(String.class)))
                .thenReturn("Email Sent ✅");
    }

    // =========================================================
    // CREATE BOOKING
    // =========================================================

    @Test
    void testCreateBooking_FullPayment_Success() {
        BookingRequestDTO dto = dto("arya@test.com", "Goa", 3, 1, 5000, true, "2026-06-01", List.of("Arya"), 1L);
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        Booking result = service.createBooking(dto);

        assertTrue(result.getFullPaid());
        assertEquals(5000.0, result.getPaidAmount());
        assertEquals("FULL", result.getPaymentStatus());
        assertEquals("CONFIRMED", result.getBookingStatus());
        assertEquals("NOT_STARTED", result.getTravelStatus());
    }

    @Test
    void testCreateBooking_PartialPayment_Success() {
        BookingRequestDTO dto = dto("arya@test.com", "Goa", 5, 2, 10000, false, "2026-05-10",
                Arrays.asList("Arya", "Abhi"), 2L);
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        Booking result = service.createBooking(dto);

        assertFalse(result.getFullPaid());
        assertEquals(3000.0, result.getPaidAmount()); // 30% of 10000
        assertEquals("PARTIAL", result.getPaymentStatus());
        assertEquals("2026-05-14", result.getEndDate()); // start + 5 - 1
        verify(restTemplate, atLeastOnce()).postForObject(contains("/slot/book/"), any(), any());
    }

    @Test
    void testCreateBooking_TravellerMismatch_ThrowsException() {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setPeople(2);
        dto.setTravellerNames(Collections.singletonList("Only One"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createBooking(dto));
        assertEquals("Traveller count mismatch", ex.getMessage());
    }

    @Test
    void testCreateBooking_NullTravellers_ThrowsException() {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setPeople(1);
        dto.setTravellerNames(null);

        assertThrows(RuntimeException.class, () -> service.createBooking(dto));
    }

    @Test
    void testCreateBooking_SlotFull_ThrowsHttpClientError() {
        BookingRequestDTO dto = dto("arya@test.com", "Paris", 3, 1, 8000, true, "2026-06-01", List.of("Arya"), 10L);
        when(restTemplate.postForObject(anyString(), any(), any()))
                .thenThrow(HttpClientErrorException.create(
                        org.springframework.http.HttpStatus.CONFLICT, "Conflict",
                        org.springframework.http.HttpHeaders.EMPTY, null, null));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createBooking(dto));
        assertTrue(ex.getMessage().contains("No slots available"));
    }

    @Test
    void testCreateBooking_TripServiceUnreachable_StillCreatesBooking() {
        BookingRequestDTO dto = dto("arya@test.com", "Manali", 4, 1, 6000, true, "2026-07-01", List.of("Arya"), 5L);
        when(restTemplate.postForObject(contains("/slot/book/"), any(), any()))
                .thenThrow(new RuntimeException("Connection refused"));
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        // Trip service failure is non-critical — booking should still succeed
        Booking result = service.createBooking(dto);
        assertNotNull(result);
        assertEquals("CONFIRMED", result.getBookingStatus());
    }

    @Test
    void testCreateBooking_NotificationFails_StillReturnsBooking() {
        BookingRequestDTO dto = dto("arya@test.com", "Dubai", 5, 1, 20000, true, "2026-08-01", List.of("Arya"), 3L);
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);
        when(plainRestTemplate.postForObject(any(URI.class), isNull(), eq(String.class)))
                .thenThrow(new RuntimeException("SMTP timeout"));

        // sendNotification failure must never propagate to the caller
        Booking result = service.createBooking(dto);
        assertNotNull(result);
        assertEquals("CONFIRMED", result.getBookingStatus());
    }

    @Test
    void testCreateBooking_NotificationCalled() {
        BookingRequestDTO dto = dto("arya@test.com", "Bali", 3, 1, 15000, true, "2026-09-01", List.of("Arya"), 7L);
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        service.createBooking(dto);

        verify(plainRestTemplate, atLeastOnce()).postForObject(any(URI.class), isNull(), eq(String.class));
    }

    @Test
    void testCreateBooking_LongTrip_ItineraryCyclesActivities() {
        // 20 days exercises cycling through all 15 activities in buildItineraryEmail
        BookingRequestDTO dto = dto("u@test.com", "Europe Tour", 20, 1, 100000, false, "2026-10-01",
                List.of("Traveller"), 4L);
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        Booking result = service.createBooking(dto);
        assertEquals(20, result.getDays());
        assertEquals("2026-10-20", result.getEndDate());
    }

    @Test
    void testCreateBooking_OneDayTrip_DepartureOnLastDay() {
        // 1-day trip: only departure day in itinerary
        BookingRequestDTO dto = dto("u@test.com", "Day Trip", 1, 1, 2000, true, "2026-11-01",
                List.of("Solo"), 8L);
        when(repo.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        Booking result = service.createBooking(dto);
        assertEquals(1, result.getDays());
        assertEquals("2026-11-01", result.getEndDate()); // same day
    }

    // =========================================================
    // PAY REMAINING
    // =========================================================

    @Test
    void testPayRemaining_Success() {
        Booking b = booking(1L, false, 5000, "test@test.com", "Goa", "2026-06-01", "2026-06-05");
        when(repo.findById(1L)).thenReturn(Optional.of(b));
        when(repo.save(any())).thenAnswer(i -> i.getArguments()[0]);

        Booking result = service.payRemaining(1L);

        assertTrue(result.getFullPaid());
        assertEquals(5000.0, result.getPaidAmount());
        assertEquals("FULL", result.getPaymentStatus());
        verify(plainRestTemplate, atLeastOnce()).postForObject(any(URI.class), isNull(), eq(String.class));
    }

    @Test
    void testPayRemaining_AlreadyFullPaid_ThrowsException() {
        Booking b = new Booking();
        b.setId(2L);
        b.setFullPaid(true);
        when(repo.findById(2L)).thenReturn(Optional.of(b));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.payRemaining(2L));
        assertEquals("Already fully paid", ex.getMessage());
    }

    @Test
    void testPayRemaining_BookingNotFound_ThrowsException() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> service.payRemaining(99L));
    }

    // =========================================================
    // GET CANCEL INFO
    // =========================================================

    @Test
    void testGetCancelInfo_AlreadyCancelled() {
        Booking b = new Booking();
        b.setBookingStatus("CANCELLED");
        when(repo.findById(1L)).thenReturn(Optional.of(b));

        Map<String, Object> result = service.getCancelInfo(1L);
        assertEquals(0.0, result.get("refund"));
        assertTrue(result.get("message").toString().contains("already cancelled"));
    }

    @Test
    void testGetCancelInfo_OngoingTrip_NoRefund() {
        Booking b = new Booking();
        b.setBookingStatus("CONFIRMED");
        b.setTravelStatus("ONGOING");
        when(repo.findById(2L)).thenReturn(Optional.of(b));

        Map<String, Object> result = service.getCancelInfo(2L);
        assertEquals(0.0, result.get("refund"));
        assertTrue(result.get("message").toString().contains("already started"));
    }

    @Test
    void testGetCancelInfo_PartialPayment_NoRefund() {
        Booking b = new Booking();
        b.setBookingStatus("CONFIRMED");
        b.setTravelStatus("NOT_STARTED");
        b.setFullPaid(false);
        when(repo.findById(3L)).thenReturn(Optional.of(b));

        Map<String, Object> result = service.getCancelInfo(3L);
        assertEquals(0.0, result.get("refund"));
        assertTrue(result.get("message").toString().contains("30% advance"));
    }

    @Test
    void testGetCancelInfo_FullPaid_SeventyPercentRefund() {
        Booking b = new Booking();
        b.setBookingStatus("CONFIRMED");
        b.setTravelStatus("NOT_STARTED");
        b.setFullPaid(true);
        b.setTotalAmount(10000);
        when(repo.findById(4L)).thenReturn(Optional.of(b));

        Map<String, Object> result = service.getCancelInfo(4L);
        assertEquals(7000.0, result.get("refund"));
        assertTrue(result.get("message").toString().contains("7000.0"));
    }

    @Test
    void testGetCancelInfo_BookingNotFound_ThrowsException() {
        when(repo.findById(999L)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> service.getCancelInfo(999L));
    }

    // =========================================================
    // CANCEL BOOKING
    // =========================================================

    @Test
    void testCancelBooking_OngoingTrip_NoRefund() {
        Booking b = booking(10L, false, 0, "user@test.com", "Mumbai", "2026-05-01", null);
        b.setPackageId(5L);
        b.setTravelStatus("ONGOING");
        when(repo.findById(10L)).thenReturn(Optional.of(b));

        String result = service.cancelBooking(10L);

        assertTrue(result.contains("No refund"));
        assertEquals("CANCELLED", b.getBookingStatus());
        verify(repo).save(b);
    }

    @Test
    void testCancelBooking_PartialPayment_NoRefund() {
        Booking b = booking(20L, false, 0, "user@test.com", "Delhi", "2026-06-01", null);
        b.setPackageId(5L);
        b.setTravelStatus("NOT_STARTED");
        when(repo.findById(20L)).thenReturn(Optional.of(b));

        String result = service.cancelBooking(20L);

        assertTrue(result.contains("No refund"));
        assertEquals("CANCELLED", b.getBookingStatus());
    }

    @Test
    void testCancelBooking_FullPaid_SeventyPercentRefund() {
        Booking b = booking(101L, true, 1000, "user@test.com", "Goa", "2026-06-01", "2026-06-05");
        b.setPackageId(55L);
        b.setTravelStatus("NOT_STARTED");
        when(repo.findById(101L)).thenReturn(Optional.of(b));

        String result = service.cancelBooking(101L);

        assertTrue(result.contains("700.0"));
        assertEquals("CANCELLED", b.getBookingStatus());
        verify(repo).save(b);
        verify(restTemplate).postForObject(contains("/slot/release/55"), any(), any());
    }

    @Test
    void testCancelBooking_SlotReleaseFails_StillCancels() {
        Booking b = booking(30L, false, 0, "user@test.com", "Pune", "2026-06-01", null);
        b.setPackageId(9L);
        b.setTravelStatus("NOT_STARTED");
        when(repo.findById(30L)).thenReturn(Optional.of(b));
        when(restTemplate.postForObject(contains("/slot/release/"), any(), any()))
                .thenThrow(new RuntimeException("Service down"));

        String result = service.cancelBooking(30L);

        // Slot release failure must be swallowed — booking must still cancel
        assertEquals("CANCELLED", b.getBookingStatus());
        assertNotNull(result);
    }

    @Test
    void testCancelBooking_NotificationFails_StillCancels() {
        Booking b = booking(40L, true, 5000, "user@test.com", "Chennai", "2026-06-01", "2026-06-05");
        b.setPackageId(3L);
        b.setTravelStatus("NOT_STARTED");
        when(repo.findById(40L)).thenReturn(Optional.of(b));
        when(plainRestTemplate.postForObject(any(URI.class), isNull(), eq(String.class)))
                .thenThrow(new RuntimeException("SMTP down"));

        String result = service.cancelBooking(40L);

        assertEquals("CANCELLED", b.getBookingStatus());
        assertNotNull(result);
    }

    // =========================================================
    // EXTEND TRIP
    // =========================================================

    @Test
    void testExtendTrip_Success() {
        Booking b = booking(1L, false, 5000, "test@test.com", "Goa", "2026-05-06", "2026-05-10");
        b.setDays(5);
        when(repo.findById(1L)).thenReturn(Optional.of(b));
        when(repo.save(any())).thenAnswer(i -> i.getArguments()[0]);

        Booking result = service.extendTrip(1L, 2, 1000.0);

        assertEquals(7, result.getDays());
        assertEquals(6000.0, result.getTotalAmount());
        assertEquals("2026-05-12", result.getEndDate());
        assertFalse(result.getFullPaid());
        assertEquals("PARTIAL", result.getPaymentStatus());
    }

    @Test
    void testExtendTrip_NotificationCalled() {
        Booking b = booking(5L, false, 5000, "test@test.com", "Goa", "2026-05-06", "2026-05-10");
        b.setDays(5);
        when(repo.findById(5L)).thenReturn(Optional.of(b));
        when(repo.save(any())).thenAnswer(i -> i.getArguments()[0]);

        service.extendTrip(5L, 1, 500.0);

        verify(plainRestTemplate, atLeastOnce()).postForObject(any(URI.class), isNull(), eq(String.class));
    }

    @Test
    void testExtendTrip_SlotFailure_ThrowsException() {
        Booking b = new Booking();
        b.setEndDate("2026-05-10");
        b.setPackageId(1L);
        when(repo.findById(1L)).thenReturn(Optional.of(b));
        when(restTemplate.postForObject(anyString(), any(), any()))
                .thenThrow(new RuntimeException("No slots"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.extendTrip(1L, 1, 100));
        assertTrue(ex.getMessage().contains("No slots available for the extension period"));
    }

    @Test
    void testExtendTrip_NotificationFails_StillReturnsBooking() {
        Booking b = booking(6L, false, 5000, "test@test.com", "Goa", "2026-05-06", "2026-05-10");
        b.setDays(5);
        when(repo.findById(6L)).thenReturn(Optional.of(b));
        when(repo.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(plainRestTemplate.postForObject(any(URI.class), isNull(), eq(String.class)))
                .thenThrow(new RuntimeException("SMTP fail"));

        Booking result = service.extendTrip(6L, 2, 1000.0);

        assertNotNull(result);
        assertEquals(7, result.getDays());
    }

    // =========================================================
    // SCHEDULED updateTripStatus
    // =========================================================

    @Test
    void testUpdateTripStatus_EmptyList_NoSaves() {
        when(repo.findAll()).thenReturn(Collections.emptyList());
        service.updateTripStatus();
        verify(repo, never()).save(any());
    }

    @Test
    void testUpdateTripStatus_MarksOngoingAndCompleted() {
        Booking ongoing = new Booking();
        ongoing.setStartDate(LocalDate.now().toString());
        ongoing.setEndDate(LocalDate.now().plusDays(1).toString());
        ongoing.setTravelStatus("NOT_STARTED");
        ongoing.setBookingStatus("CONFIRMED");

        Booking completed = new Booking();
        completed.setStartDate(LocalDate.now().minusDays(5).toString());
        completed.setEndDate(LocalDate.now().minusDays(1).toString());
        completed.setTravelStatus("ONGOING");
        completed.setBookingStatus("CONFIRMED");
        completed.setPackageId(1L);

        when(repo.findAll()).thenReturn(Arrays.asList(ongoing, completed));

        service.updateTripStatus();

        assertEquals("ONGOING", ongoing.getTravelStatus());
        assertEquals("COMPLETED", completed.getTravelStatus());
        verify(repo, atLeast(2)).save(any());
    }

    @Test
    void testUpdateTripStatus_AlreadyCompleted_Skipped() {
        Booking b = new Booking();
        b.setStartDate(LocalDate.now().minusDays(10).toString());
        b.setEndDate(LocalDate.now().minusDays(5).toString());
        b.setTravelStatus("COMPLETED");
        b.setBookingStatus("CONFIRMED");
        when(repo.findAll()).thenReturn(Collections.singletonList(b));

        service.updateTripStatus();

        verify(repo, never()).save(any());
    }

    @Test
    void testUpdateTripStatus_CancelledBooking_Skipped() {
        Booking b = new Booking();
        b.setStartDate(LocalDate.now().minusDays(5).toString());
        b.setEndDate(LocalDate.now().minusDays(1).toString());
        b.setTravelStatus("ONGOING");
        b.setBookingStatus("CANCELLED");
        when(repo.findAll()).thenReturn(Collections.singletonList(b));

        service.updateTripStatus();

        verify(repo, never()).save(any());
    }

    @Test
    void testUpdateTripStatus_NullEndDate_DoesNotThrow() {
        Booking b = new Booking();
        b.setEndDate(null);
        b.setStartDate(LocalDate.now().toString());
        b.setTravelStatus("NOT_STARTED");
        b.setBookingStatus("CONFIRMED");
        when(repo.findAll()).thenReturn(Collections.singletonList(b));

        assertDoesNotThrow(() -> service.updateTripStatus());
        verify(repo, never()).save(any());
    }

    @Test
    void testUpdateTripStatus_NullStartDate_DoesNotThrow() {
        Booking b = new Booking();
        b.setStartDate(null);
        b.setEndDate(LocalDate.now().plusDays(1).toString());
        b.setTravelStatus("NOT_STARTED");
        b.setBookingStatus("CONFIRMED");
        when(repo.findAll()).thenReturn(Collections.singletonList(b));

        assertDoesNotThrow(() -> service.updateTripStatus());
    }

    @Test
    void testUpdateTripStatus_CompletedSlotReleaseFails_StillSaves() {
        Booking b = new Booking();
        b.setStartDate(LocalDate.now().minusDays(5).toString());
        b.setEndDate(LocalDate.now().minusDays(1).toString());
        b.setTravelStatus("ONGOING");
        b.setBookingStatus("CONFIRMED");
        b.setPackageId(99L);
        when(repo.findAll()).thenReturn(Collections.singletonList(b));
        when(restTemplate.postForObject(contains("/slot/release/"), any(), any()))
                .thenThrow(new RuntimeException("Trip service down"));

        service.updateTripStatus();

        assertEquals("COMPLETED", b.getTravelStatus());
        verify(repo).save(b);
    }

    @Test
    void testUpdateTripStatus_FutureBooking_NotTouched() {
        Booking b = new Booking();
        b.setStartDate(LocalDate.now().plusDays(10).toString());
        b.setEndDate(LocalDate.now().plusDays(14).toString());
        b.setTravelStatus("NOT_STARTED");
        b.setBookingStatus("CONFIRMED");
        when(repo.findAll()).thenReturn(Collections.singletonList(b));

        service.updateTripStatus();

        assertEquals("NOT_STARTED", b.getTravelStatus());
        verify(repo, never()).save(any());
    }

    // =========================================================
    // DATA GETTERS
    // =========================================================

    @Test
    void testGetBookingsByUser_ReturnsResults() {
        Booking b = new Booking();
        b.setUserEmail("test@test.com");
        when(repo.findByUserEmail("test@test.com")).thenReturn(Collections.singletonList(b));

        List<Booking> result = service.getBookingsByUser("test@test.com");
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void testGetBookingsByUser_EmptyList() {
        when(repo.findByUserEmail("none@test.com")).thenReturn(Collections.emptyList());
        assertTrue(service.getBookingsByUser("none@test.com").isEmpty());
    }

    @Test
    void testGetAllBookings_ReturnsAll() {
        when(repo.findAll()).thenReturn(Arrays.asList(new Booking(), new Booking()));
        assertEquals(2, service.getAllBookings().size());
    }

    @Test
    void testGetAllBookings_EmptyList() {
        when(repo.findAll()).thenReturn(Collections.emptyList());
        assertTrue(service.getAllBookings().isEmpty());
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private BookingRequestDTO dto(String email, String dest, int days, int people, double amount,
                                   boolean fullPay, String startDate, List<String> names, Long pkgId) {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setUserEmail(email);
        dto.setDestination(dest);
        dto.setDays(days);
        dto.setPeople(people);
        dto.setTotalAmount(amount);
        dto.setFullPayment(fullPay);
        dto.setStartDate(startDate);
        dto.setTravellerNames(names);
        dto.setPackageId(pkgId);
        return dto;
    }

    private Booking booking(Long id, boolean fullPaid, double totalAmount,
                             String email, String dest, String startDate, String endDate) {
        Booking b = new Booking();
        b.setId(id);
        b.setFullPaid(fullPaid);
        b.setTotalAmount(totalAmount);
        b.setUserEmail(email);
        b.setDestination(dest);
        b.setStartDate(startDate);
        b.setEndDate(endDate);
        return b;
    }
}