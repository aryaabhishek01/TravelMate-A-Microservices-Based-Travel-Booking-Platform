import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CancelConfirmModal from "./CancelConfirmModal";
import API from "../services/api";

jest.mock("../services/api");

describe("CancelConfirmModal Component", () => {
  const mockBooking = { id: 42, destination: "Paris" };

  beforeEach(() => jest.clearAllMocks());

  test("shows spinner while loading", () => {
    API.get.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CancelConfirmModal booking={mockBooking} onClose={jest.fn()} onConfirm={jest.fn()} />);
    expect(document.querySelector(".spinner")).toBeInTheDocument();
  });

  test("renders destination and refund info after load", async () => {
    API.get.mockResolvedValueOnce({ data: { refund: 7000, message: "70% refund applies." } });
    render(<CancelConfirmModal booking={mockBooking} onClose={jest.fn()} onConfirm={jest.fn()} />);

    await waitFor(() => expect(screen.getByText("Paris")).toBeInTheDocument());
    expect(screen.getByText(/₹7,000/)).toBeInTheDocument();
    expect(screen.getByText(/70% refund applies/i)).toBeInTheDocument();
  });

  test("shows 'No Refund' when refund is 0", async () => {
    API.get.mockResolvedValueOnce({ data: { refund: 0, message: "No refund for advance." } });
    render(<CancelConfirmModal booking={mockBooking} onClose={jest.fn()} onConfirm={jest.fn()} />);
    await waitFor(() => expect(screen.getByText("Paris")).toBeInTheDocument());
    expect(screen.getAllByText(/No Refund/i)[0]).toBeInTheDocument();
  });

  test("calls onClose when Keep Booking clicked", async () => {
    API.get.mockResolvedValueOnce({ data: { refund: 0, message: "No refund." } });
    const onClose = jest.fn();
    render(<CancelConfirmModal booking={mockBooking} onClose={onClose} onConfirm={jest.fn()} />);
    await waitFor(() => screen.getByText(/Keep Booking/i));
    fireEvent.click(screen.getByRole("button", { name: /Keep Booking/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onConfirm when Yes, Cancel Booking clicked", async () => {
    API.get.mockResolvedValueOnce({ data: { refund: 0, message: "No refund." } });
    const onConfirm = jest.fn();
    render(<CancelConfirmModal booking={mockBooking} onClose={jest.fn()} onConfirm={onConfirm} />);
    await waitFor(() => screen.getByRole("button", { name: /Yes, Cancel Booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /Yes, Cancel Booking/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  test("shows error message when API fails", async () => {
    API.get.mockRejectedValueOnce(new Error("Network error"));
    render(<CancelConfirmModal booking={mockBooking} onClose={jest.fn()} onConfirm={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/Could not load refund info/i)).toBeInTheDocument());
  });
});
