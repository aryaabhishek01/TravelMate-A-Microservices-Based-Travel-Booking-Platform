import React from "react";
import { render, screen } from "@testing-library/react";
import ItineraryView from "./ItineraryView";

describe("ItineraryView Component", () => {
  const itinerary = [
    { day: 1, plan: "Arrival" },
    { day: 2, plan: "Sightseeing" },
    { day: 3, plan: "Departure" },
  ];

  test("renders nothing when itinerary is empty", () => {
    const { container } = render(<ItineraryView itinerary={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when itinerary is undefined", () => {
    const { container } = render(<ItineraryView itinerary={null} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders header for non-empty itinerary", () => {
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText(/Day-by-Day Itinerary/i)).toBeInTheDocument();
  });

  test("renders each day plan", () => {
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Arrival")).toBeInTheDocument();
    expect(screen.getByText("Day 3")).toBeInTheDocument();
    expect(screen.getByText("Departure")).toBeInTheDocument();
  });

  test("marks last day with itinerary-day-last class", () => {
    render(<ItineraryView itinerary={itinerary} />);
    const days = document.querySelectorAll(".itinerary-day");
    expect(days).toHaveLength(3);
    expect(days[2]).toHaveClass("itinerary-day-last");
  });
});
