import React, { useState, useEffect, useRef } from "react";
import "./ChatBox.css"; // We'll add styles to index.css but keeping it clean

export default function ChatBox({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load messages from session storage
    const storedMessages = sessionStorage.getItem("tm_chat_messages");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const faqs = [
    {
      question: "🚫 Cancellation Policy?",
      keywords: ["cancel", "cancellation", "policy"],
      answer: "📋 Cancellation Policy:\n• You can cancel any booking before the trip starts.\n• A flat 10% cancellation fee is charged on the total package price.\n• The rest of your paid amount is refunded.\n• If your paid amount is less than the 10% fee, no refund is issued."
    },
    {
      question: "💸 Cancellation Charges?",
      keywords: ["charge", "charges", "fee", "penalty", "deduct"],
      answer: "💸 Cancellation Charges:\n• The cancellation fee is 10% of your total package amount.\nExample: If your package is ₹10,000 and you paid ₹3,000 advance, your refund = ₹3,000 − ₹1,000 (10%) = ₹2,000."
    },
    {
      question: "💳 Refund Policy?",
      keywords: ["refund", "money back", "return"],
      answer: "💳 Refund Policy:\n• Refunds are processed after deducting the 10% cancellation fee.\n• Refund is based on the amount you have already paid, not the full package cost.\n• Refunds are reflected within 5–7 business days (online payments only)."
    },
    {
      question: "💰 Advance Payment?",
      keywords: ["advance", "30%", "deposit", "how much to pay"],
      answer: "💰 Advance Payment Rules:\n• Minimum 30% advance required to confirm a booking.\n• You can choose to pay the full amount upfront via Razorpay.\n• Cash payments are restricted to 30% advance only — full cash payment is not allowed."
    },
    {
      question: "🧾 Cash vs Online?",
      keywords: ["cash", "online", "razorpay", "payment method"],
      answer: "🧾 Payment Methods:\n• Online (Razorpay): Pay 30% advance or full amount. Secure and instant.\n• Cash: Pay 30% advance only. Full payment is not available via cash.\n• Pay Remaining: Always via Online (Razorpay) only."
    },
    {
      question: "✈️ Custom Packages?",
      keywords: ["custom", "build", "own trip", "my itinerary", "create"],
      answer: "✈️ Custom Packages:\n• Go to the 'Custom Trip' tab on your dashboard.\n• Choose National (₹15,000/person) or International (₹70,000/person).\n• Select destination, dates, number of people & traveller names.\n• Our system generates a full day-by-day itinerary automatically!"
    },
    {
      question: "📅 Default Packages?",
      keywords: ["default", "package", "explore", "official"],
      answer: "📅 Default Packages:\n• Listed in the Explore tab — these are admin-curated official packages.\n• Each has a fixed number of slots (15 per booking month).\n• Once all slots are taken, the package shows as 'Full'."
    },
    {
      question: "🔁 Extend My Trip?",
      keywords: ["extend", "extra days", "longer", "more days"],
      answer: "🔁 Extending a Trip:\n• Go to 'My Trips' in your dashboard.\n• Click '+ Extend' on any confirmed or ongoing trip.\n• Review the Extension Policy (domestic/international rates).\n• Select your trip type, enter extra days — cost is auto-calculated.\n• An updated itinerary will be sent to your email."
    },
    {
      question: "💰 Extension Cost?",
      keywords: ["extension cost", "extend cost", "extend price", "extend rate", "extend charge", "extension charge", "extension price"],
      answer: "💰 Trip Extension Charges:\n• 🏔️ Domestic trips: ₹3,000 per person per day\n• ✈️ International trips: ₹10,000 per person per day\n\nExample — Domestic (Goa, 2 extra days, 2 people):\n2 days × 2 people × ₹3,000 = ₹12,000\n\nExample — International (Dubai, 1 extra day, 1 person):\n1 day × 1 person × ₹10,000 = ₹10,000"
    },
    {
      question: "📊 Trip Status?",
      keywords: ["status", "ongoing", "completed", "not started"],
      answer: "📊 Trip Statuses:\n• 🕐 Not Started: Booking confirmed, trip hasn't begun yet.\n• 🚀 Ongoing: You are currently on the trip.\n• ✅ Completed: Trip is finished.\n• ❌ Cancelled: The booking has been cancelled."
    },
    {
      question: "👥 Slot Availability?",
      keywords: ["slot", "slots", "available", "full", "capacity"],
      answer: "👥 Slot Availability:\n• Each default package has 15 slots per booking month.\n• The Explore page shows how many slots remain in real-time.\n• Once all 15 slots are taken, the package is marked as 'Sold Out'."
    },
    {
      question: "🔐 Forgot Password?",
      keywords: ["forgot", "password", "reset", "otp", "login issue"],
      answer: "🔐 Forgot Password:\n• Click 'Forgot Password?' on the login page.\n• Enter your registered email — an OTP will be sent instantly.\n• Enter the OTP, then set a new password (minimum 8 characters).\n• You'll be redirected to login automatically."
    },
    {
      question: "📧 Contact Support?",
      keywords: ["contact", "support", "help", "agent", "human"],
      answer: "📧 Contact Support:\n• For issues not covered here, please email us at support@travelmate.com.\n• Our team responds within 24 hours on business days.\n• For urgent issues, call our helpline at 1234567890"
    }
  ];

  const handleSendMessage = (textOrEvent) => {
    let rawText = "";
    if (typeof textOrEvent === "string") {
      rawText = textOrEvent;
    } else {
      textOrEvent.preventDefault();
      rawText = inputValue;
    }

    if (!rawText.trim()) return;

    const userText = rawText.trim();
    const newMessage = {
      id: Date.now(),
      sender: currentUser || "User",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    sessionStorage.setItem("tm_chat_messages", JSON.stringify(updatedMessages));
    setInputValue("");
    
    // Check for FAQ keywords
    const lowerInput = userText.toLowerCase();
    let botReply = "Thanks for reaching out! A travel agent will connect with you shortly to answer your specific question. 🌍";
    
    for (const faq of faqs) {
      if (faq.keywords.some(kw => lowerInput.includes(kw))) {
        botReply = faq.answer;
        break;
      }
    }

    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        sender: "TravelBot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: true
      };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      sessionStorage.setItem("tm_chat_messages", JSON.stringify(finalMessages));
    }, 600);
  };

  const handleClearChat = () => {
    setMessages([]);
    sessionStorage.removeItem("tm_chat_messages");
  };

  return (
    <div className={`chat-widget ${isOpen ? "open" : ""}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          💬 Support
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-bot-icon">✈</span> Travel Support
            </div>
            <div className="chat-actions">
              <button className="chat-clear-btn" onClick={handleClearChat} title="Clear Chat">🗑</button>
              <button className="chat-close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>How can we help you plan your next trip? 🌴</p>
                <div className="chat-quick-replies">
                  {faqs.map((faq, idx) => (
                    <button 
                      key={idx} 
                      className="chat-quick-reply-btn"
                      onClick={() => handleSendMessage(faq.question)}
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.isBot ? "received" : "sent"}`}>
                  <div className="msg-sender">{msg.sender}</div>
                  <div className="msg-text" style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
                  <div className="msg-time">{msg.timestamp}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
