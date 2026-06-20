import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/dashboard" }),
}));

const renderNavbar = (sessionData = {}) => {
  Object.entries(sessionData).forEach(([k, v]) => sessionStorage.setItem(k, v));
  return render(<MemoryRouter><Navbar /></MemoryRouter>);
};

describe("Navbar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  test("renders TravelMate brand", () => {
    renderNavbar({ email: "test@test.com", token: "tok" });
    expect(screen.getByText("TravelMate")).toBeInTheDocument();
  });

  test("renders user email", () => {
    renderNavbar({ email: "test@test.com", token: "tok" });
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
  });

  test("renders Sign Out button", () => {
    renderNavbar({ email: "test@test.com", token: "tok" });
    expect(screen.getByRole("button", { name: /Sign Out/i })).toBeInTheDocument();
  });

  test("shows admin tabs for ADMIN role", () => {
    renderNavbar({ email: "admin@test.com", token: "tok", role: "ADMIN" });
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
  });

  test("does not show admin tabs for USER role", () => {
    renderNavbar({ email: "user@test.com", token: "tok", role: "USER" });
    expect(screen.queryByText(/Admin Panel/i)).not.toBeInTheDocument();
  });

  test("calls navigate on brand click", () => {
    renderNavbar({ email: "test@test.com", token: "tok" });
    fireEvent.click(screen.getByText("TravelMate"));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
