import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";
import API from "../services/api";

jest.mock("../services/api");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders step 1 by default", () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  test("step 1: sends OTP and moves to step 2", async () => {
    API.post.mockResolvedValueOnce({ data: {} });
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "test@test.com" });
      expect(screen.getByPlaceholderText("6-digit OTP")).toBeInTheDocument();
    });
  });

  test("step 2: validates OTP and moves to step 3", async () => {
    // Mock Step 1
    API.post.mockResolvedValueOnce({ data: {} }); // send OTP
    API.post.mockResolvedValueOnce({ data: { isValid: true } }); // validate OTP

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    // Step 1
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => expect(screen.getByPlaceholderText("6-digit OTP")).toBeInTheDocument());

    // Step 2
    fireEvent.change(screen.getByPlaceholderText("6-digit OTP"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/auth/validate-otp", { email: "test@test.com", otp: "123456" });
      expect(screen.getByPlaceholderText("Min 8 characters")).toBeInTheDocument();
    });
  });

  test("step 3: resets password and redirects", async () => {
    jest.useFakeTimers();
    
    // Mock Step 1
    API.post.mockResolvedValueOnce({ data: {} }); // send OTP
    API.post.mockResolvedValueOnce({ data: { isValid: true } }); // validate OTP
    API.post.mockResolvedValueOnce({ data: {} }); // reset password

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    // Step 1
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("6-digit OTP")).toBeInTheDocument());

    // Step 2
    fireEvent.change(screen.getByPlaceholderText("6-digit OTP"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("Min 8 characters")).toBeInTheDocument());

    // Step 3
    fireEvent.change(screen.getByPlaceholderText("Min 8 characters"), { target: { value: "newpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/auth/reset-password", { email: "test@test.com", otp: "123456", newPassword: "newpassword" });
      expect(screen.getByText("Password reset successfully! Redirecting to login...")).toBeInTheDocument();
    });

    jest.runAllTimers();
    expect(mockNavigate).toHaveBeenCalledWith("/");
    jest.useRealTimers();
  });
});
