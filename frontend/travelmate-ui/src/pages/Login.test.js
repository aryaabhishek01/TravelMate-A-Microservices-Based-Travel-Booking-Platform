import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../store/userSlice";
import Login from "./Login";
import API from "../services/api";

jest.mock("../services/api");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (ui) => {
  const store = configureStore({
    reducer: { user: userReducer },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  test("renders login form", () => {
    renderWithProviders(<Login />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  test("shows error if fields are empty", () => {
    renderWithProviders(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));
    expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
  });

  test("successful user login", async () => {
    API.post.mockResolvedValueOnce({ data: { token: "user-token", role: "USER" } });
    renderWithProviders(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/auth/login", { email: "test@test.com", password: "password" });
    });

    expect(sessionStorage.getItem("token")).toBe("user-token");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    expect(window.location.reload).toHaveBeenCalled();
  });

  test("successful admin login", async () => {
    API.post.mockResolvedValueOnce({ data: { token: "admin-token", role: "ADMIN" } });
    renderWithProviders(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "admin@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  test("shows error on failed login", async () => {
    API.post.mockRejectedValueOnce({ response: { data: { message: "Invalid auth" } } });
    renderWithProviders(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "wrong@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid auth")).toBeInTheDocument();
    });
  });
});
