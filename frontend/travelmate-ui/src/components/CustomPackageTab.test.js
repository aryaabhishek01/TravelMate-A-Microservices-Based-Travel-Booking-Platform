import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomPackageTab from "./CustomPackageTab";
import API from "../services/api";

jest.mock("../services/api");
jest.mock("../services/paymentService", () => ({
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
}));
jest.mock("./ItineraryView", () => () => <div data-testid="itinerary-view" />);

describe("CustomPackageTab Component", () => {
  const defaultProps = {
    email: "test@test.com",
    onToast: jest.fn(),
    onSwitchToTrips: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  test("renders form title", () => {
    render(<CustomPackageTab {...defaultProps} />);
    expect(screen.getByText(/Build Your Custom Trip/i)).toBeInTheDocument();
  });

  test("shows fixed price banner for NATIONAL (₹15,000)", () => {
    render(<CustomPackageTab {...defaultProps} />);
    expect(screen.getAllByText(/₹15,000/)[0]).toBeInTheDocument();
  });

  test("renders people counter with + and - buttons", () => {
    render(<CustomPackageTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "−" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // initial people count
  });

  test("renders Total price row", () => {
    render(<CustomPackageTab {...defaultProps} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("renders Book Custom Trip button", () => {
    render(<CustomPackageTab {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Book Custom Trip/i })).toBeInTheDocument();
  });

  test("shows error if traveller names are empty on book", () => {
    render(<CustomPackageTab {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));
    expect(screen.getByText("Fill all traveller names.")).toBeInTheDocument();
  });

  test("shows INTERNATIONAL price when International is selected", () => {
    render(<CustomPackageTab {...defaultProps} />);
    fireEvent.click(screen.getByText(/International/i));
    expect(screen.getAllByText(/₹70,000/)[0]).toBeInTheDocument();
  });

  test("decrements people count but not below 1", () => {
    render(<CustomPackageTab {...defaultProps} />);
    const minusBtn = screen.getByRole("button", { name: "−" });
    fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("shows duplicate names warning", () => {
    render(<CustomPackageTab {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "+" })); // 2 people
    
    const inputs = screen.getAllByPlaceholderText(/Traveller.*full name/i);
    fireEvent.change(inputs[0], { target: { value: "Same Name" } });
    fireEvent.change(inputs[1], { target: { value: "Same Name" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));
    expect(screen.getByText(/Duplicate Traveller Names/i)).toBeInTheDocument();
  });

  test("submits custom booking via cash payment", async () => {
    API.post.mockResolvedValueOnce({ data: { id: 100 } }); // /booking/create
    render(<CustomPackageTab {...defaultProps} />);
    
    // Fill traveller name using correct placeholder
    fireEvent.change(screen.getByPlaceholderText("Traveller 1 full name"), { target: { value: "Valid Name" } });
    
    // Select a destination via the select element
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });
    
    // Select Cash payment radio
    const radios = screen.getAllByRole("radio");
    const cashRadio = radios.find(r => r.nextSibling?.textContent?.includes("Cash") || !r.checked);
    fireEvent.click(radios[1]); // Cash is the second radio
    
    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));
    
    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/trips/custom-package", expect.any(Object)));
    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/booking/create", expect.objectContaining({
      isCustom: true, destination: "Goa"
    })));
    
    expect(defaultProps.onToast).toHaveBeenCalledWith(expect.stringContaining("Custom trip booked"));
    expect(defaultProps.onSwitchToTrips).toHaveBeenCalled();
  });

  test("submits custom booking via online payment", async () => {
    const { createOrder, verifyPayment } = require("../services/paymentService");
    createOrder.mockResolvedValueOnce({ id: "order_xyz", amount: 15000, currency: "INR" });
    verifyPayment.mockResolvedValueOnce({});
    
    API.post
      .mockResolvedValueOnce({ data: { id: 201 } }) // /trips/custom-package
      .mockResolvedValueOnce({ data: { id: 101 } }); // /booking/create
    
    window.Razorpay = jest.fn().mockImplementation((options) => ({
      on: jest.fn(),
      open: jest.fn(() => options.handler({ razorpay_order_id: "order_xyz", razorpay_payment_id: "pay_xyz", razorpay_signature: "sig_xyz" }))
    }));

    render(<CustomPackageTab {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText("Traveller 1 full name"), { target: { value: "Valid Name" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });
    
    // Online is already selected by default; check the full-payment checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    
    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));
    
    const { waitFor } = require("@testing-library/react");
    await waitFor(() => expect(createOrder).toHaveBeenCalledWith(15000));
    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/booking/create", expect.objectContaining({
      fullPayment: true, destination: "Goa"
    })));
    
    expect(defaultProps.onToast).toHaveBeenCalledWith(expect.stringContaining("Custom trip booked"));
  });
});
