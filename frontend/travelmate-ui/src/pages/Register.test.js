import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  });

  test("renders register form", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  test("shows error if fields are empty", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));
    expect(screen.getByText("All fields are required.")).toBeInTheDocument();
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
    
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  test("successful registration", async () => {
    API.post.mockResolvedValueOnce({ data: { message: "Account created" } });
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText("Account created! Redirecting to login…")).toBeInTheDocument();
    });

    jest.runAllTimers();
    expect(mockNavigate).toHaveBeenCalledWith("/");
    jest.useRealTimers();
  });

  test("shows error on API failure", async () => {
    API.post.mockRejectedValueOnce({ response: { data: { message: "Email already exists" } } });
    
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });
});
