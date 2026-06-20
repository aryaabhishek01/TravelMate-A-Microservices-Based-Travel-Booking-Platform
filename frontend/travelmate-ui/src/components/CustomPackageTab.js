import { useState } from "react";
import API from "../services/api";
import ItineraryView from "./ItineraryView";
import { Form } from "react-bootstrap";
import { createOrder, verifyPayment } from "../services/paymentService";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const INTERNATIONAL = [
  "Thailand","Maldives","Dubai (UAE)","Singapore","Bali (Indonesia)",
  "Malaysia","Sri Lanka","Nepal","Bhutan","Japan","South Korea",
  "Vietnam","Cambodia","Philippines","Turkey","Greece","Italy","France",
  "Spain","Switzerland","Germany","United Kingdom","USA","Canada",
  "Australia","New Zealand","South Africa","Kenya","Egypt","Morocco",
  "Brazil","Peru","Mexico","Portugal","Czech Republic","Austria",
  "Croatia","Iceland","Norway","Sweden","Finland","Hungary","Poland",
  "Russia","China","Hong Kong","Taiwan","Myanmar","Laos","Jordan",
  "Israel","Oman","Bahrain","Qatar","Kuwait","Georgia","Armenia","Azerbaijan"
];

// ── Fixed pricing — user cannot change these ──
const FIXED_PRICE = {
  NATIONAL:      15000,   
  INTERNATIONAL: 70000,  
};

export default function CustomPackageTab({ email, onToast, onSwitchToTrips }) {
  const [form, setForm] = useState({
    destType:    "NATIONAL",
    destination: "",
    days:        5,
    people:      1,
    names:       [""],
    fullPayment: false,
    paymentMethod: "ONLINE",
    startDate:   new Date().toISOString().split("T")[0],
  });
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [booking,  setBooking]  = useState(false);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [dupWarn,  setDupWarn]  = useState(false);

  const destinations = form.destType === "NATIONAL" ? INDIAN_STATES : INTERNATIONAL;
  const filtered     = destinations.filter(d => d.toLowerCase().includes(search.toLowerCase()));

  // Fixed price per person based on destination type
  const pricePerPerson = FIXED_PRICE[form.destType];

  const updatePeople = n => {
    const count = Math.max(1, Math.min(15, n));
    setForm(f => ({ ...f, people: count, names: Array.from({ length: count }, (_, i) => f.names[i] || "") }));
  };

  const generatePreview = async () => {
    if (!form.destination) { setError("Please select a destination."); return; }
    setError(""); setLoading(true);
    try {
      const r = await API.post("/trips/custom", {
        destination:     form.destination,
        days:            Number(form.days),
        people:          Number(form.people),
        budget:          pricePerPerson,          // fixed price per person sent to backend
        destinationType: form.destType,
        userEmail:       email,
      });
      // Override price from backend with our fixed calculation
      const totalPrice = pricePerPerson * Number(form.people);
      setPreview({ ...r.data, price: totalPrice });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate preview.");
    } finally { setLoading(false); }
  };

  const bookCustom = async () => {
    if (form.names.some(n => !n.trim())) { setError("Fill all traveller names."); return; }
    const lower   = form.names.map(n => n.trim().toLowerCase());
    const hasDups = lower.some((n, i) => lower.indexOf(n) !== i);
    if (hasDups) { setDupWarn(true); return; }
    await proceedBooking();
  };

  const handleDupProceed = async () => { setDupWarn(false); await proceedBooking(); };
  const handleDupCancel  = () => { setDupWarn(false); };

  const proceedBooking = async () => {
    setBooking(true); setError("");
    const totalAmt = pricePerPerson * Number(form.people);
    const amountToPay = form.fullPayment ? totalAmt : Math.round(totalAmt * 0.3);

    try {
      if (form.paymentMethod === "ONLINE") {
        const order = await createOrder(amountToPay);
        await new Promise((resolve, reject) => {
          const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_SYwj3a2gBudlrJ",
            amount: order.amount,
            currency: order.currency || "INR",
            name: "TravelMate",
            description: `Custom Trip to ${form.destination}`,
            order_id: order.id,
            handler: async (response) => {
              try {
                await verifyPayment({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            prefill: { email },
            theme: { color: "#6366f1" },
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled.")),
            },
          };

          if (!window.Razorpay) {
            reject(new Error("Payment gateway not loaded. Please refresh and try again."));
            return;
          }

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", (resp) => {
            reject(new Error(resp.error?.description || "Payment failed."));
          });
          rzp.open();
        });
      }

      // 1. Save user-private custom package
      const pkgRes = await API.post("/trips/custom-package", {
        name:            `${form.destination} – ${form.days}d Custom`,
        duration:        Number(form.days),
        price:           pricePerPerson,           // per-person price
        type:            "CUSTOM",
        ownerEmail:      email,
        destinationType: form.destType,
      });
      const pkg = pkgRes.data;

      // 2. Create booking
      await API.post("/booking/create", {
        userEmail:      email,
        destination:    form.destination,
        days:           Number(form.days),
        people:         Number(form.people),
        travellerNames: form.names,
        totalAmount:    totalAmt,
        fullPayment:    form.fullPayment,
        startDate:      form.startDate,
        packageId:      pkg.id,
        isCustom:       true,
      });
      onToast("🎉 Custom trip booked! Check your email for the itinerary.");
      onSwitchToTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed.");
    } finally { setBooking(false); }
  };

  const total = pricePerPerson * Number(form.people);
  const due   = form.fullPayment ? total : Math.round(total * 0.3);

  return (
    <div className="custom-form">
      <div className="custom-form-header">
        <div className="custom-form-title">✨ Build Your Custom Trip</div>
        <div className="custom-form-sub">Private to your account · Your trip, your way</div>
      </div>

      {dupWarn && (
        <div style={{
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.45)",
          borderRadius: 10, padding: "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: "0.95rem", marginBottom: 4 }}>
            ⚠️ Duplicate Traveller Names
          </div>
          <div style={{ color: "#e2c77a", fontSize: "0.86rem", marginBottom: 12 }}>
            Some travellers share the same name. Are you sure you want to continue?
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleDupProceed}
              style={{
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                border: "none", borderRadius: 7,
                color: "#0a0e1a", fontWeight: 700,
                padding: "8px 18px", cursor: "pointer", fontSize: "0.88rem",
              }}
            >
              Yes, Proceed
            </button>
            <button
              onClick={handleDupCancel}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 7, color: "#94a3b8",
                padding: "8px 18px", cursor: "pointer", fontSize: "0.88rem",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div className="alert alert-error mb-16"><span>⚠</span> {error}</div>}

      {/* Destination Type */}
      <div className="form-group">
        <label className="form-label">Trip Type</label>
        <div className="dest-type-toggle">
          {["NATIONAL", "INTERNATIONAL"].map(t => (
            <button
              key={t}
              className={`dest-type-btn ${form.destType === t ? "active" : ""}`}
              onClick={() => setForm(f => ({ ...f, destType: t, destination: "" }))}>
              {t === "NATIONAL" ? "🇮🇳 National" : "🌍 International"}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Price Banner */}
      <div className="fixed-price-banner">
        <span className="fixed-price-icon">{form.destType === "NATIONAL" ? "🇮🇳" : "🌍"}</span>
        <div>
          <div className="fixed-price-label">Fixed Rate · {form.destType === "NATIONAL" ? "National" : "International"}</div>
          <div className="fixed-price-amount">₹{pricePerPerson.toLocaleString("en-IN")} <span>per person</span></div>
        </div>
      </div>

      {/* Destination */}
      <div className="form-group">
        <label className="form-label">Destination</label>
        <input
          className="form-input"
          placeholder="Search destination…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Form.Select
          className="form-input"
          data-bs-theme="dark"
          value={form.destination}
          onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
          style={{ background: 'var(--surface2)', color: 'var(--text)' }}
        >
          <option value="" style={{ background: 'var(--surface)', color: 'var(--text)' }}>— Select —</option>
          {filtered.map(d => <option key={d} value={d} style={{ background: 'var(--surface)', color: 'var(--text)' }}>{d}</option>)}
        </Form.Select>
      </div>

      {/* Duration */}
      <div className="form-group">
        <label className="form-label">Duration (days)</label>
        <input
          className="form-input"
          type="number" min="1" max="30"
          value={form.days}
          onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
        />
      </div>

      {/* People */}
      <div className="form-group">
        <label className="form-label">Number of Travellers</label>
        <div className="counter">
          <button className="counter-btn" onClick={() => updatePeople(form.people - 1)}>−</button>
          <span className="counter-val">{form.people}</span>
          <button className="counter-btn" onClick={() => updatePeople(form.people + 1)}>+</button>
        </div>
      </div>

      {/* Traveller Names */}
      <div className="form-group">
        <label className="form-label">Traveller Names</label>
        <div className="names-grid">
          {form.names.map((n, i) => (
            <input
              key={i}
              className="form-input"
              placeholder={`Traveller ${i + 1} full name`}
              value={n}
              onChange={e => {
                const names = [...form.names]; names[i] = e.target.value;
                setForm(f => ({ ...f, names }));
              }}
            />
          ))}
        </div>
      </div>

      {/* Start Date */}
      <div className="form-group">
        <label className="form-label">Start Date</label>
        <input
          className="form-input"
          type="date"
          value={form.startDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
        />
      </div>

      <button
        className="btn-ghost"
        style={{ width: "100%", marginBottom: 16 }}
        onClick={generatePreview}
        disabled={loading}
      >
        {loading ? "Generating…" : "🔍 Generate Itinerary Preview"}
      </button>

      {/* Preview */}
      {preview && (
        <div className="preview-box">
          <div className="preview-dest">📍 {preview.destination}</div>
          <div className="preview-meta">
            <span>📅 {preview.days} days</span>
            <span>👥 {preview.people || form.people} people</span>
            <span className="preview-price">₹{Number(total).toLocaleString("en-IN")}</span>
          </div>
          <ItineraryView itinerary={preview.itinerary || []} />
        </div>
      )}

      {/* Payment Summary */}
      <div className="price-summary" style={{ marginTop: 16 }}>
        <div className="price-row">
          <span>Rate per person</span>
          <span>₹{pricePerPerson.toLocaleString("en-IN")}</span>
        </div>
        <div className="price-row">
          <span>Travellers</span>
          <span>× {form.people}</span>
        </div>
        <div className="price-row">
          <span>Total</span>
          <span>₹{Number(total).toLocaleString("en-IN")}</span>
        </div>
        <div className="price-row" style={{ marginTop: 8, marginBottom: 8 }}>
          <span>Payment Method</span>
          <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input type="radio" checked={form.paymentMethod === "ONLINE"} onChange={() => setForm(f => ({ ...f, paymentMethod: "ONLINE" }))} style={{ accentColor: "var(--accent)" }} />
              Online
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input type="radio" checked={form.paymentMethod === "CASH"} onChange={() => setForm(f => ({ ...f, paymentMethod: "CASH", fullPayment: false }))} style={{ accentColor: "var(--accent)" }} />
              Cash
            </label>
          </div>
        </div>
        <div className="price-row">
          <label className="payment-toggle" style={{ opacity: form.paymentMethod === "CASH" ? 0.5 : 1 }}>
            <input
              type="checkbox"
              checked={form.fullPayment}
              disabled={form.paymentMethod === "CASH"}
              onChange={e => setForm(f => ({ ...f, fullPayment: e.target.checked }))}
            />
            <span>Pay full amount now</span>
          </label>
          <span className={form.fullPayment ? "price-green" : "price-amber"}>
            {form.fullPayment ? "100%" : "30% advance"}
          </span>
        </div>
        <div className="price-row price-total">
          <span>Pay Now</span>
          <span>₹{Number(due).toLocaleString("en-IN")}</span>
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ marginTop: 16 }}
        onClick={bookCustom}
        disabled={booking}
      >
        {booking
          ? <span className="btn-loading"><span className="btn-spinner" /> Booking…</span>
          : "✈ Book Custom Trip →"}
      </button>
    </div>
  );
}
