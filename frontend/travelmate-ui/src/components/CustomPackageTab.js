import { useState } from "react";
import API from "../services/api";
import ItineraryView from "./ItineraryView";
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
  INTERNATIONAL: 200000,
};

const MIN_DAYS = 3;
const MAX_DAYS = 10;

/* ── compute tomorrow's date ── */
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
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
    startDate:   getTomorrow(),
  });
  const [preview,  setPreview]  = useState(null);
  const [previewStale, setPreviewStale] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [booking,  setBooking]  = useState(false);
  const [error,    setError]    = useState("");
  const [dupWarn,  setDupWarn]  = useState(false);

  const destinations = form.destType === "NATIONAL" ? INDIAN_STATES : INTERNATIONAL;

  // Fixed price per person based on destination type
  const pricePerPerson = FIXED_PRICE[form.destType];

  /* ── Reset preview whenever key inputs change ── */
  const updateFormField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (["destination", "days", "destType", "people"].includes(field)) {
      if (preview) setPreviewStale(true);
    }
  };

  const updatePeople = n => {
    // Max only 10 members can book at one time
    const count = Math.max(1, Math.min(10, n));
    setForm(f => ({ ...f, people: count, names: Array.from({ length: count }, (_, i) => f.names[i] || "") }));
    if (preview) setPreviewStale(true);
  };

  const handleDaysChange = (val) => {
    const num = Number(val);
    const clamped = Math.max(MIN_DAYS, Math.min(MAX_DAYS, num));
    updateFormField("days", clamped);
  };

  const generatePreview = async () => {
    if (!form.destination) { setError("Please choose a destination from the dropdown."); return; }
    const daysNum = Number(form.days);
    if (daysNum < MIN_DAYS || daysNum > MAX_DAYS) {
      setError(`Trip duration must be between ${MIN_DAYS} and ${MAX_DAYS} days.`);
      return;
    }
    setError(""); setLoading(true);
    try {
      const r = await API.post("/trips/custom", {
        destination:     form.destination,
        days:            daysNum,
        people:          Number(form.people),
        budget:          pricePerPerson,
        destinationType: form.destType,
        userEmail:       email,
      });
      const totalPrice = pricePerPerson * Number(form.people);
      setPreview({ ...r.data, price: totalPrice });
      setPreviewStale(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate preview.");
    } finally { setLoading(false); }
  };

  const bookCustom = async () => {
    if (!form.destination) { setError("Please choose a destination from the dropdown."); return; }
    if (form.names.some(n => !n.trim())) { setError("Fill all traveller names."); return; }
    // Validate alpha-only
    const invalid = form.names.find(n => !/^[a-zA-Z ]+$/.test(n.trim()));
    if (invalid) { setError("Traveller names must contain only alphabets and spaces."); return; }
    const lower   = form.names.map(n => n.trim().toLowerCase());
    const hasDups = lower.some((n, i) => lower.indexOf(n) !== i);
    if (hasDups) { setDupWarn(true); return; }
    const daysNum = Number(form.days);
    if (daysNum < MIN_DAYS || daysNum > MAX_DAYS) {
      setError(`Trip duration must be between ${MIN_DAYS} and ${MAX_DAYS} days.`);
      return;
    }
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
        price:           pricePerPerson,
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
              onClick={() => {
                setForm(f => ({ ...f, destType: t, destination: "" }));
                if (preview) setPreviewStale(true);
              }}>
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
        <label className="form-label">Destination <span style={{ color: "#ef4444" }}>*</span></label>
        <select
          className="form-input"
          value={form.destination}
          onChange={e => updateFormField("destination", e.target.value)}
          style={{ background: 'var(--surface2)', color: form.destination ? 'var(--text)' : '#64748b', cursor: 'pointer' }}
        >
          <option value="" disabled style={{ background: 'var(--surface)', color: '#64748b' }}>
            — Select {form.destType === "NATIONAL" ? "a state / union territory" : "a country"} —
          </option>
          {destinations.map(d => (
            <option key={d} value={d} style={{ background: 'var(--surface)', color: 'var(--text)' }}>{d}</option>
          ))}
        </select>
        {!form.destination && (
          <small style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: 4, display: "block" }}>
            Destination cannot be empty
          </small>
        )}
      </div>

      {/* Duration */}
      <div className="form-group">
        <label className="form-label">Duration (days) — Min {MIN_DAYS}, Max {MAX_DAYS}</label>
        <input
          className="form-input"
          type="number" min={MIN_DAYS} max={MAX_DAYS}
          value={form.days}
          onChange={e => handleDaysChange(e.target.value)}
        />
        <small style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 4, display: "block" }}>
          Minimum 3 days · Maximum 10 days
        </small>
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
        <small style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 8, display: "block" }}>
          Alphabets and spaces only
        </small>
        <div className="names-grid">
          {form.names.map((n, i) => (
            <input
              key={i}
              className="form-input"
              placeholder={`Traveller ${i + 1} full name`}
              value={n}
              onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z ]*$/.test(val)) {
                  const names = [...form.names]; names[i] = val;
                  setForm(f => ({ ...f, names }));
                }
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
          min={getTomorrow()}
          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
        />
        <small style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 4, display: "block" }}>
          Trips can only start from tomorrow onwards
        </small>
      </div>

      {/* Stale preview warning */}
      {previewStale && preview && (
        <div style={{
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12,
          color: "#fbbf24", fontSize: "0.85rem",
        }}>
          ⚠️ Your form has changed — regenerate the preview to see updated itinerary.
        </div>
      )}

      <button
        className="btn-ghost"
        style={{ width: "100%", marginBottom: 16 }}
        onClick={generatePreview}
        disabled={loading}
      >
        {loading ? "Generating…" : "🔍 Generate Itinerary Preview"}
      </button>

      {/* Preview */}
      {preview && !previewStale && (
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
