import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookingCard from "./BookingCard";
import API from "../services/api";

jest.mock("../services/api");
jest.mock("../services/paymentService", () => ({
  createOrder: jest.fn(),
  verifyPayment: jest.fn()
}));

describe("BookingCard Component", () => {
  const mockBooking = {
    id: 1,
    destination: "Paris",
    bookingStatus: "CONFIRMED",
    travelStatus: "NOT_STARTED",
    paymentStatus: "PARTIAL",
    totalAmount: 10000,
    paidAmount: 3000,
    startDate: "2023-10-01",
    endDate: "2023-10-05",
    days: 5,
    people: 2,
    travellerNames: ["John", "Jane"]
  };

  test("renders booking details correctly", () => {
    render(<BookingCard booking={mockBooking} onRefresh={jest.fn()} onToast={jest.fn()} />);
    
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("🎟 Confirmed")).toBeInTheDocument();
    expect(screen.getByText("🕐 Not Started")).toBeInTheDocument();
    expect(screen.getByText("💳 Partial Pay")).toBeInTheDocument();
    
    expect(screen.getByText("₹10,000")).toBeInTheDocument(); // total
    expect(screen.getByText("₹3,000")).toBeInTheDocument(); // paid
    expect(screen.getByText("₹7,000")).toBeInTheDocument(); // remaining
  });

  test("shows Cancel and Extend buttons for confirmed ongoing trips", () => {
    render(<BookingCard booking={mockBooking} onRefresh={jest.fn()} onToast={jest.fn()} />);
    
    expect(screen.getByRole("button", { name: /\+ Extend/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /💳 Pay ₹7,000/i })).toBeInTheDocument();
  });

  test("hides actions for cancelled trips", () => {
    const cancelledBooking = { ...mockBooking, bookingStatus: "CANCELLED" };
    render(<BookingCard booking={cancelledBooking} onRefresh={jest.fn()} onToast={jest.fn()} />);
    
    expect(screen.queryByRole("button", { name: /\+ Extend/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel/i })).not.toBeInTheDocument();
    expect(screen.getByText("🚫 This booking was cancelled")).toBeInTheDocument();
  });

  test("handles paying remaining balance via Razorpay", async () => {
    const { createOrder, verifyPayment } = require("../services/paymentService");
    createOrder.mockResolvedValueOnce({ id: "order_123", amount: 7000, currency: "INR" });
    verifyPayment.mockResolvedValueOnce({});
    API.post.mockResolvedValueOnce({});
    
    window.Razorpay = jest.fn().mockImplementation((options) => ({
      on: jest.fn(),
      open: jest.fn(() => options.handler({ razorpay_order_id: "order_123", razorpay_payment_id: "pay_123", razorpay_signature: "sig_123" }))
    }));

    const onRefresh = jest.fn();
    const onToast = jest.fn();
    render(<BookingCard booking={mockBooking} onRefresh={onRefresh} onToast={onToast} />);
    
    // Button label is '💳 Pay ₹7,000'
    fireEvent.click(screen.getByRole("button", { name: /Pay ₹7,000/i }));
    
    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(createOrder).toHaveBeenCalledWith(7000));
    await waitFor(() => expect(API.post).toHaveBeenCalledWith(`/booking/pay/${mockBooking.id}`));
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining("Payment successful"));
    expect(onRefresh).toHaveBeenCalled();
  });

  test("handles trip extension — shows CancellationPolicy first then ExtendModal", async () => {
    API.post.mockResolvedValueOnce({});
    const onRefresh = jest.fn();
    const onToast = jest.fn();
    
    render(<BookingCard booking={mockBooking} onRefresh={onRefresh} onToast={onToast} />);
    // Click the Extend button
    fireEvent.click(screen.getByRole("button", { name: /\+ Extend/i }));
    
    // ExtendModal first shows CancellationPolicyModal
    expect(screen.getAllByText(/Cancellation Policy/i)[0]).toBeInTheDocument();
    // Click Proceed to Extend
    fireEvent.click(screen.getByRole("button", { name: /Proceed to Extend/i }));
    
    // Now the actual Extend Trip form appears
    expect(screen.getByText("Extend Trip")).toBeInTheDocument();
    // Change extra days
    const [extraDaysInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(extraDaysInput, { target: { value: "3" } });
    
    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Extend \+3 days/i }));
    
    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/booking/extend", expect.objectContaining({ bookingId: 1, extraDays: 3 })));
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining("extended"));
    expect(onRefresh).toHaveBeenCalled();
  });

  test("handles cancellation — opens CancelConfirmModal", async () => {
    API.get.mockResolvedValueOnce({ data: { refund: 0, message: "No refund." } });
    const onRefresh = jest.fn();
    const onToast = jest.fn();
    render(<BookingCard booking={mockBooking} onRefresh={onRefresh} onToast={onToast} />);
    
    // Button label is just 'Cancel'
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    
    // CancelConfirmModal opens — it loads refund info via API.get
    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(screen.getAllByText("Paris")[0]).toBeInTheDocument());
    expect(screen.getAllByText(/No Refund/i)[0]).toBeInTheDocument();
  });
});
