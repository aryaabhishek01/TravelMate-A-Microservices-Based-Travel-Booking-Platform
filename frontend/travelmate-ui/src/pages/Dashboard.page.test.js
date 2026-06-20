import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Dashboard from "./Dashboard";
import API from "../services/api";

jest.mock("../services/api");
jest.mock("../services/paymentService", () => ({
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
}));
// Mock child components to avoid deep render issues
jest.mock("../components/BookingModal", () => () => <div data-testid="booking-modal" />);
jest.mock("../components/BookingCard", () => ({ booking, onRefresh, onToast }) => (
  <div data-testid="booking-card">{booking.destination}</div>
));
jest.mock("../components/CustomPackageTab", () => () => <div data-testid="custom-tab" />);
jest.mock("../components/ChatBox", () => () => <div data-testid="chatbox" />);
jest.mock("../components/PackageCard", () => ({ pkg, onBook }) => (
  <div data-testid="package-card" onClick={() => onBook(pkg)}>{pkg.name}</div>
));

describe("Dashboard Page", () => {
  const mockPackages = [
    { id: 1, name: "Goa Trip", duration: 5, price: 15000, totalSlots: 15, bookedSlots: 3, type: "DEFAULT", destinationType: "NATIONAL" },
    { id: 2, name: "Dubai Package", duration: 7, price: 120000, totalSlots: 15, bookedSlots: 0, type: "DEFAULT", destinationType: "INTERNATIONAL" },
  ];
  const mockBookings = [
    { id: 1, destination: "Goa", bookingStatus: "CONFIRMED", travelStatus: "NOT_STARTED", paymentStatus: "PARTIAL", totalAmount: 15000, paidAmount: 4500, startDate: "2026-06-01", endDate: "2026-06-05", days: 5, people: 1, travellerNames: ["Test User"] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem("email", "test@test.com");
    API.get.mockImplementation((url) => {
      if (url.includes("/trips/for-user")) return Promise.resolve({ data: mockPackages });
      if (url.includes("/booking/user")) return Promise.resolve({ data: mockBookings });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => sessionStorage.clear());

  test("shows loading spinner initially", () => {
    render(<Dashboard />);
    expect(document.querySelector(".spinner")).toBeInTheDocument();
  });

  test("renders packages after loading", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Goa Trip")).toBeInTheDocument());
    expect(screen.getByText("Dubai Package")).toBeInTheDocument();
  });

  test("renders stats (Packages, Active Trips counts)", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getAllByText("Packages")[0]).toBeInTheDocument());
    expect(screen.getByText("Active Trips")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  test("switches to My Trips tab when clicked", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Goa Trip")).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText(/My Trips/i)[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText(/My Trips/i)[0]);
    await waitFor(() => expect(screen.getByTestId("booking-card")).toBeInTheDocument());
  });

  test("switches to Custom Package tab", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Goa Trip")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Custom Package/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Custom Package/i));
    expect(screen.getByTestId("custom-tab")).toBeInTheDocument();
  });

  test("opens BookingModal when package card clicked", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Goa Trip")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Goa Trip"));
    expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
  });

  test("shows search input", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument());
  });

  test("shows ChatBox component", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByTestId("chatbox")).toBeInTheDocument());
  });

  test("filters packages by search input", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Goa Trip")).toBeInTheDocument());
    
    const input = screen.getByPlaceholderText(/Search destinations/i);
    fireEvent.change(input, { target: { value: "Dubai" } });
    
    expect(screen.queryByText("Goa Trip")).not.toBeInTheDocument();
    expect(screen.getByText("Dubai Package")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("✕")); // clear search
    expect(screen.getByText("Goa Trip")).toBeInTheDocument();
  });

  test("handles API errors gracefully", async () => {
    API.get.mockRejectedValue(new Error("API Error"));
    render(<Dashboard />);
    
    await waitFor(() => expect(screen.getByText(/Could not load packages/i)).toBeInTheDocument());
    
    fireEvent.click(screen.getAllByText(/My Trips/i)[0]);
    await waitFor(() => expect(screen.getByText(/Could Not Load Trips/i)).toBeInTheDocument());
  });

  test("filters trips by status", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getAllByText(/My Trips/i)[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText(/My Trips/i)[0]);
    await waitFor(() => expect(screen.getByTestId("booking-card")).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole("button", { name: /Completed/i }));
    // No completed trips in mockBookings
    expect(screen.queryByTestId("booking-card")).not.toBeInTheDocument();
    expect(screen.getByText(/No trips match this filter/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole("button", { name: /Upcoming/i }));
    expect(screen.getByTestId("booking-card")).toBeInTheDocument();
  });
});
