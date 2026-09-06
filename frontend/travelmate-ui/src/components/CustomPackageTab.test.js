import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    fireEvent.change(screen.getByPlaceholderText("Search destination…"), { target: { value: "Goa" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });
    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));
    expect(screen.getByText("Fill all traveller names.")).toBeInTheDocument();
  });

  test("shows INTERNATIONAL price when International is selected", () => {
    render(<CustomPackageTab {...defaultProps} />);
    fireEvent.click(screen.getByText(/International/i));
    expect(screen.getAllByText(/₹2,00,000/)[0]).toBeInTheDocument();
  });

  test("decrements people count but not below 1", () => {
    render(<CustomPackageTab {...defaultProps} />);
    const minusBtn = screen.getByRole("button", { name: "−" });
    fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("duration defaults to 5 and is clamped to min 3", () => {
    render(<CustomPackageTab {...defaultProps} />);
    const durationInput = screen.getByDisplayValue("5");
    expect(durationInput).toBeInTheDocument();
    // Changing to below min (3) clamps to 3
    fireEvent.change(durationInput, { target: { value: "1" } });
    expect(durationInput.value).toBe("3");
  });

  test("duration is clamped to max 10", () => {
    render(<CustomPackageTab {...defaultProps} />);
    const durationInput = screen.getByDisplayValue("5");
    fireEvent.change(durationInput, { target: { value: "15" } });
    expect(durationInput.value).toBe("10");
  });

  test("traveller name input rejects non-alphabetic characters", () => {
    render(<CustomPackageTab {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText("Traveller 1 full name");
    fireEvent.change(nameInput, { target: { value: "John123" } });
    expect(nameInput.value).toBe(""); // filtered out
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    expect(nameInput.value).toBe("John Doe"); // allowed
  });

  test("start date defaults to tomorrow", () => {
    render(<CustomPackageTab {...defaultProps} />);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const dateInput = screen.getByDisplayValue(tomorrowStr);
    expect(dateInput).toBeInTheDocument();
  });

  test("shows stale preview warning when form changes after preview", async () => {
    API.post.mockResolvedValueOnce({
      data: { destination: "Goa", days: 5, itinerary: [] }
    });
    render(<CustomPackageTab {...defaultProps} />);
    // type in search and select destination, then generate preview
    fireEvent.change(screen.getByPlaceholderText("Search destination…"), { target: { value: "Goa" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Itinerary Preview/i }));
    await waitFor(() => expect(screen.getByTestId("itinerary-view")).toBeInTheDocument());
    // now change destination — should show stale warning
    fireEvent.change(screen.getByPlaceholderText("Search destination…"), { target: { value: "Kerala" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Kerala" } });
    expect(screen.getByText(/regenerate/i)).toBeInTheDocument();
  });

  test("shows duplicate names warning", () => {
    render(<CustomPackageTab {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Search destination…"), { target: { value: "Goa" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });
    fireEvent.click(screen.getByRole("button", { name: "+" })); // 2 people

    const inputs = screen.getAllByPlaceholderText(/Traveller.*full name/i);
    fireEvent.change(inputs[0], { target: { value: "Same Name" } });
    fireEvent.change(inputs[1], { target: { value: "Same Name" } });

    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));
    expect(screen.getByText(/Duplicate Traveller Names/i)).toBeInTheDocument();
  });

  test("submits custom booking via cash payment", async () => {
    API.post.mockResolvedValueOnce({ data: { id: 100 } }); // /trips/custom-package
    API.post.mockResolvedValueOnce({ data: { id: 101 } }); // /booking/create
    render(<CustomPackageTab {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Traveller 1 full name"), { target: { value: "Valid Name" } });
    fireEvent.change(screen.getByPlaceholderText("Search destination…"), { target: { value: "Goa" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });

    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]); // Cash is the second radio

    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));

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
    fireEvent.change(screen.getByPlaceholderText("Search destination…"), { target: { value: "Goa" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Goa" } });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: /Book Custom Trip/i }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledWith(15000));
    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/booking/create", expect.objectContaining({
      fullPayment: true, destination: "Goa"
    })));

    expect(defaultProps.onToast).toHaveBeenCalledWith(expect.stringContaining("Custom trip booked"));
  });
});
