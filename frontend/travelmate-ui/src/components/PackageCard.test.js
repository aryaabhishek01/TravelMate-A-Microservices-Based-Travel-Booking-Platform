import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PackageCard, { getEmoji } from "./PackageCard";

describe("PackageCard Component", () => {
  const mockPkg = {
    id: 1,
    name: "Test Package",
    duration: 5,
    price: 15000,
    type: "DEFAULT",
    destinationType: "NATIONAL",
    totalSlots: 15,
    bookedSlots: 5,
  };

  test("renders package name, duration, and price", () => {
    render(<PackageCard pkg={mockPkg} onBook={jest.fn()} />);
    expect(screen.getByText("Test Package")).toBeInTheDocument();
    expect(screen.getByText("📅 5d")).toBeInTheDocument();
    expect(screen.getByText(/₹15,000/)).toBeInTheDocument();
  });

  test("renders Official Package badge", () => {
    render(<PackageCard pkg={mockPkg} onBook={jest.fn()} />);
    expect(screen.getByText("✅ Official Package")).toBeInTheDocument();
  });

  test("shows available slots chip", () => {
    render(<PackageCard pkg={mockPkg} onBook={jest.fn()} />);
    expect(screen.getByText("🟢 10 of 15 slots")).toBeInTheDocument();
  });

  test("renders type and destinationType chips", () => {
    render(<PackageCard pkg={mockPkg} onBook={jest.fn()} />);
    expect(screen.getByText("DEFAULT")).toBeInTheDocument();
    expect(screen.getByText("NATIONAL")).toBeInTheDocument();
  });

  test("calls onBook when Book Now clicked", () => {
    const onBook = jest.fn();
    render(<PackageCard pkg={mockPkg} onBook={onBook} />);
    fireEvent.click(screen.getByRole("button", { name: /Book Now/i }));
    expect(onBook).toHaveBeenCalledWith(mockPkg);
  });

  test("shows Sold Out badge and hides Book Now when full", () => {
    const fullPkg = { ...mockPkg, bookedSlots: 15 };
    render(<PackageCard pkg={fullPkg} onBook={jest.fn()} />);
    expect(screen.getByText("🔴 Full")).toBeInTheDocument();
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Book Now/i })).not.toBeInTheDocument();
  });

  test("getEmoji returns a string for any id", () => {
    expect(typeof getEmoji(1)).toBe("string");
    expect(typeof getEmoji(null)).toBe("string");
    expect(typeof getEmoji(0)).toBe("string");
  });

  test("shows slots text below the bar", () => {
    render(<PackageCard pkg={mockPkg} onBook={jest.fn()} />);
    expect(screen.getByText(/10 of 15 slots available this month/i)).toBeInTheDocument();
  });
});
