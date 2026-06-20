import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CancellationPolicyModal from "./CancellationPolicyModal";

describe("CancellationPolicyModal Component", () => {
  test("renders the three policy rules", () => {
    render(<CancellationPolicyModal onClose={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByText(/Cancellation Policy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Full Payment.*70% Refund/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Advance.*No Refund/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Trip Ongoing.*No Refund/i)[0]).toBeInTheDocument();
  });

  test("renders default actionLabel 'Proceed'", () => {
    render(<CancellationPolicyModal onClose={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Proceed/i })).toBeInTheDocument();
  });

  test("renders custom actionLabel", () => {
    render(<CancellationPolicyModal onClose={jest.fn()} onConfirm={jest.fn()} actionLabel="Confirm Booking" />);
    expect(screen.getByRole("button", { name: /Confirm Booking/i })).toBeInTheDocument();
  });

  test("calls onClose when Go Back is clicked", () => {
    const onClose = jest.fn();
    render(<CancellationPolicyModal onClose={onClose} onConfirm={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Go Back/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when ✕ is clicked", () => {
    const onClose = jest.fn();
    render(<CancellationPolicyModal onClose={onClose} onConfirm={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /✕/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onConfirm when action button clicked", () => {
    const onConfirm = jest.fn();
    render(<CancellationPolicyModal onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /Proceed/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
