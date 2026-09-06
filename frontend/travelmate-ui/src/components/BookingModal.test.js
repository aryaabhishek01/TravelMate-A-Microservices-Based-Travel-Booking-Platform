import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookingModal from "./BookingModal";

jest.mock("../services/api");
jest.mock("../services/paymentService", () => ({
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
}));
jest.mock("./ItineraryView", () => () => <div data-testid="itinerary-view" />);

describe("BookingModal Component", () => {
  const mockPkg = {
    id: 1,
    name: "Test Package",
    duration: 5,
    price: 15000,
    totalSlots: 15,
    bookedSlots: 5,
  };

  const defaultProps = {
    pkg: mockPkg,
    email: "test@test.com",
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  test("renders package name and price", () => {
    render(<BookingModal {...defaultProps} />);
    expect(screen.getByText("Test Package")).toBeInTheDocument();
    expect(screen.getAllByText(/15,000/)[0]).toBeInTheDocument();
  });

  test("shows people counter with default value 1", () => {
    render(<BookingModal {...defaultProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("shows error when traveller name is empty and Book Now clicked", () => {
    render(<BookingModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Book Now/i }));
    expect(
      screen.getByText(/Please fill in all traveller names/i)
    ).toBeInTheDocument();
  });

  test("calls onClose when Cancel button clicked", () => {
    const onClose = jest.fn();
    render(<BookingModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test("renders Online and Cash payment radio buttons", () => {
    render(<BookingModal {...defaultProps} />);
    expect(screen.getByLabelText(/Online/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cash/i)).toBeInTheDocument();
  });

  test("counter increments people count", () => {
    render(<BookingModal {...defaultProps} />);
    const plusBtn = screen.getByRole("button", { name: "+" });
    fireEvent.click(plusBtn);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("renders Book Now button", () => {
    render(<BookingModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Book Now/i })).toBeInTheDocument();
  });

  test("decrements people count but not below 1", () => {
    render(<BookingModal {...defaultProps} />);
    const minusBtn = screen.getByRole("button", { name: "−" });
    fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("start date defaults to tomorrow", () => {
    render(<BookingModal {...defaultProps} />);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    // the date input should have tomorrow as default value
    const dateInput = screen.getByDisplayValue(tomorrowStr);
    expect(dateInput).toBeInTheDocument();
  });

  test("traveller name input only accepts alphabets and spaces", () => {
    render(<BookingModal {...defaultProps} />);
    const nameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameInput, { target: { value: "John123" } });
    // Filter rejects invalid chars — value stays empty
    expect(nameInput.value).toBe("");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    expect(nameInput.value).toBe("John Doe");
  });

  test("shows duplicate names warning", () => {
    render(<BookingModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "+" })); // 2 people

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Same Name" } });
    fireEvent.change(inputs[1], { target: { value: "Same Name" } });

    fireEvent.click(screen.getByRole("button", { name: /Book Now/i }));
    expect(screen.getByText(/Duplicate Traveller Names/i)).toBeInTheDocument();
  });

  test("loads itinerary preview", async () => {
    const API = require("../services/api");
    API.default.get.mockResolvedValueOnce({ data: { itinerary: [{ day: 1, plan: "Arrival" }] } });

    render(<BookingModal {...defaultProps} />);
    const toggleBtn = screen.getByText(/View Itinerary Preview/i);
    fireEvent.click(toggleBtn);

    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(screen.getByText(/Hide Itinerary Preview/i)).toBeInTheDocument());
  });

  test("proceeds to policy screen and shows correct policy rows", () => {
    render(<BookingModal {...defaultProps} />);
    // Fill traveller name
    const nameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameInput, { target: { value: "Valid Name" } });
    fireEvent.click(screen.getByLabelText(/Cash/i));
    fireEvent.click(screen.getByRole("button", { name: /Book Now/i }));
    // Policy screen shown — check updated policy text
    expect(screen.getByText(/Cancellation Policy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/70% Refund/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/30% Advance/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/3 to 10 Days/i)[0]).toBeInTheDocument();
  });

  test("proceeds to policy screen and submits cash booking", async () => {
    const onSuccess = jest.fn();
    import("../services/api").then(api => {
      api.default.post.mockResolvedValueOnce({ data: { id: 99 } });
    });

    render(<BookingModal {...defaultProps} onSuccess={onSuccess} />);
    const nameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameInput, { target: { value: "Valid Name" } });
    fireEvent.click(screen.getByLabelText(/Cash/i));

    fireEvent.click(screen.getByRole("button", { name: /Book Now/i }));

    // In Policy Screen
    expect(screen.getByText(/Cancellation Policy/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Confirm & Pay/i }));

    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining("Booking confirmed")));
  });
});
