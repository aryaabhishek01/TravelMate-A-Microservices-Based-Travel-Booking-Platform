import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ChatBox from "./ChatBox";

describe("ChatBox Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    sessionStorage.clear();
    jest.useRealTimers();
    delete window.HTMLElement.prototype.scrollIntoView;
  });

  test("renders support toggle button initially", () => {
    render(<ChatBox />);
    expect(screen.getByRole("button", { name: /Support/i })).toBeInTheDocument();
  });

  test("opens chat window when support button clicked", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    expect(screen.getByText(/Travel Support/i)).toBeInTheDocument();
  });

  test("shows empty state help text when opened with no messages", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    expect(screen.getByText(/How can we help/i)).toBeInTheDocument();
  });

  test("shows FAQ quick reply buttons", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    expect(screen.getByRole("button", { name: /Cancellation Policy/i })).toBeInTheDocument();
  });

  test("closes chat when ✕ button clicked", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(screen.queryByText(/Travel Support/i)).not.toBeInTheDocument();
  });

  test("can type a message in the input", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(input.value).toBe("Hello");
  });

  test("sends message via form submit", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Cancel my trip" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    expect(screen.getByText("Cancel my trip")).toBeInTheDocument();
  });

  test("bot responds to cancellation keyword", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "cancellation" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    act(() => { jest.advanceTimersByTime(700); });
    expect(screen.getByText(/Cancellation Policy/i)).toBeInTheDocument();
  });

  test("clicking FAQ quick reply sends message", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    const faqBtn = screen.getByRole("button", { name: /Cancellation Policy/i });
    fireEvent.click(faqBtn);
    // After clicking FAQ, the question text becomes a user message
    expect(screen.getByText(/Cancellation Policy/i)).toBeInTheDocument();
  });

  test("clears chat when trash button clicked", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    // Click trash/clear button
    fireEvent.click(screen.getByRole("button", { name: /🗑/i }));
    expect(screen.queryByText("Hi")).not.toBeInTheDocument();
  });

  test("loads persisted messages from sessionStorage", () => {
    const stored = [
      { id: 1, sender: "User", text: "Old message", timestamp: "10:00", isBot: false }
    ];
    sessionStorage.setItem("tm_chat_messages", JSON.stringify(stored));
    render(<ChatBox />);
    fireEvent.click(screen.getByRole("button", { name: /Support/i }));
    expect(screen.getByText("Old message")).toBeInTheDocument();
  });
});
