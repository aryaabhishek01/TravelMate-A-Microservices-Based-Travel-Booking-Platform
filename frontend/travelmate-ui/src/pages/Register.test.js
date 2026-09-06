import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";
import API from "../services/api";

jest.mock("../services/api");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test("renders register form — step 1", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get OTP/i })).toBeInTheDocument();
  });

  test("shows error if fields are empty on step 1", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    expect(screen.getByText("All fields are required.")).toBeInTheDocument();
  });

  test("shows error if name contains non-alphabetic characters", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    // Name input should not accept numbers — typing is filtered
    const nameInput = screen.getByPlaceholderText("John Doe");
    fireEvent.change(nameInput, { target: { value: "John123" } });
    // The onChange handler rejects non-alpha, so value stays ""
    expect(nameInput.value).toBe("");
  });

  test("shows error if email has less than 3 chars before @", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "ab@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    expect(screen.getByText("Email must have at least 3 characters before @.")).toBeInTheDocument();
  });

  test("shows error if password is too short", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  test("advances to OTP step after successful send-otp", async () => {
    API.post.mockResolvedValueOnce({ data: {} }); // /auth/send-otp
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    await waitFor(() => expect(screen.getByText("Verify OTP")).toBeInTheDocument());
    expect(API.post).toHaveBeenCalledWith("/auth/send-otp", {
      email: "test@test.com",
      name: "Test User",
      password: "password123",
    });
  });

  test("shows error if OTP is not 6 digits", async () => {
    API.post.mockResolvedValueOnce({ data: {} }); // send-otp
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    await waitFor(() => expect(screen.getByText("Verify OTP")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("6-digit OTP"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify & Create Account/i }));
    expect(screen.getByText("Please enter the 6-digit OTP sent to your email.")).toBeInTheDocument();
  });

  test("successful registration with correct OTP", async () => {
    API.post
      .mockResolvedValueOnce({ data: {} })                          // send-otp
      .mockResolvedValueOnce({ data: { message: "Account created" } }); // register
    jest.useFakeTimers();
    const { act } = require("@testing-library/react");

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    });

    await waitFor(() => expect(screen.getByText("Verify OTP")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("6-digit OTP"), { target: { value: "123456" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Verify & Create Account/i }));
    });

    await waitFor(() => expect(screen.getByText("Account created! Redirecting to login…")).toBeInTheDocument());

    // Advance only 1500ms (the redirect timeout) — avoid running the cooldown interval forever
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
    jest.useRealTimers();
  });

  test("shows error on API failure during OTP registration", async () => {
    API.post
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce({ response: { data: { message: "Invalid OTP" } } });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    await waitFor(() => expect(screen.getByText("Verify OTP")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("6-digit OTP"), { target: { value: "999999" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify & Create Account/i }));
    await waitFor(() => expect(screen.getByText("Invalid OTP")).toBeInTheDocument());
  });

  test("shows API failure error on send-otp failure", async () => {
    API.post.mockRejectedValueOnce({ response: { data: { message: "Email already exists" } } });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP/i }));
    await waitFor(() => expect(screen.getByText("Email already exists")).toBeInTheDocument());
  });
});
