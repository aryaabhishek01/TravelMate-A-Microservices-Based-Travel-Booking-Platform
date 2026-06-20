import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminDashboard from "./AdminDashboard";
import API from "../services/api";

jest.mock("../services/api");

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem("role", "ADMIN");
    sessionStorage.setItem("email", "admin@test.com");
    API.get.mockResolvedValue({ data: [] });
  });

  test("renders TravelMate brand and ADMIN tag", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(screen.getByText("TravelMate")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  test("renders sidebar navigation tabs", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(screen.getAllByText("Overview")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Packages")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Users")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Bookings")[0]).toBeInTheDocument();
  });

  test("shows overview stats after loading", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText("Active Bookings")).toBeInTheDocument());
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Revenue Collected")).toBeInTheDocument();
  });

  test("calls API for users, bookings and packages", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(API.get).toHaveBeenCalledWith("/admin/users"));
    expect(API.get).toHaveBeenCalledWith("/admin/bookings");
    expect(API.get).toHaveBeenCalledWith("/admin/packages");
  });

  test("loads and displays a package name", async () => {
    API.get.mockImplementation((url) => {
      if (url === "/admin/packages") {
        return Promise.resolve({
          data: [{ id: 1, name: "Goa Bliss", totalSlots: 15, bookedSlots: 0, destinationType: "NATIONAL", type: "DEFAULT", duration: 5, price: 10000 }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(<AdminDashboard />);
    // Switch to Packages tab
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText("Packages")[0]);
    await waitFor(() => expect(screen.getAllByText("Goa Bliss")[0]).toBeInTheDocument());
  });

  test("renders Add Package button in sidebar", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(screen.getByText("Add Package")).toBeInTheDocument();
  });

  test("cancels a booking", async () => {
    API.post.mockResolvedValueOnce({});
    API.get.mockImplementation((url) => {
      if (url === "/admin/bookings") {
        return Promise.resolve({ data: [{ id: 101, destination: "Paris", bookingStatus: "CONFIRMED", totalAmount: 50000 }] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText("Bookings")[0]);
    await waitFor(() => expect(screen.getByText("Paris")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    
    // Custom modal is shown. Let's find "Yes, Cancel" button and click it
    await waitFor(() => expect(screen.getByText("Cancel Booking?")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Yes, Cancel/i }));

    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/admin/cancel-booking/101"));
  });

  test("deletes a package", async () => {
    API.delete.mockResolvedValueOnce({});
    API.get.mockImplementation((url) => {
      if (url === "/admin/packages") {
        return Promise.resolve({ data: [{ id: 202, name: "Tokyo Trip", totalSlots: 10 }] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText("Packages")[0]);
    await waitFor(() => expect(screen.getByText("Tokyo Trip")).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
    
    // Custom modal is shown. Let's find "Yes, Delete" button and click it
    await waitFor(() => expect(screen.getByText("Delete Package?")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Yes, Delete/i }));

    await waitFor(() => expect(API.delete).toHaveBeenCalledWith("/admin/delete-package/202"));
  });

  test("sends a notification", async () => {
    API.post.mockResolvedValueOnce({});
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText("Notify")[0]);
    
    fireEvent.change(screen.getByPlaceholderText("user@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Booking Confirmed"), { target: { value: "Hello" } });
    fireEvent.change(screen.getByPlaceholderText("Your message here…"), { target: { value: "Welcome" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Send Notification/ }));
    
    await waitFor(() => expect(API.post).toHaveBeenCalledWith(expect.stringContaining("/notify/send")));
    expect(await screen.findByText("Notification sent successfully!")).toBeInTheDocument();
  });

  test("opens and submits new package modal", async () => {
    API.post.mockResolvedValueOnce({});
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    
    fireEvent.click(screen.getByText("Add Package"));
    expect(screen.getByText("Add New Package")).toBeInTheDocument();
    
    fireEvent.change(screen.getByPlaceholderText("e.g. Goa Premium"), { target: { value: "New Bali" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Package →/ }));
    
    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/admin/add-package", expect.objectContaining({ name: "New Bali" })));
  });

  test("views user bookings modal", async () => {
    API.get.mockImplementation((url) => {
      if (url === "/admin/users") {
        return Promise.resolve({ data: [{ email: "client@test.com", name: "Client" }] });
      }
      if (url.includes("/admin/user-bookings")) {
        return Promise.resolve({ data: [{ id: 55, destination: "London", bookingStatus: "CONFIRMED" }] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByText("Users")[0]);
    
    await waitFor(() => expect(screen.getByText("Client")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /View Bookings/ }));
    
    await waitFor(() => expect(screen.getByText("Bookings for")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("London")).toBeInTheDocument());
  });
});
