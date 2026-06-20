import { useState } from "react";
import API from "../services/api";
import { createOrder, verifyPayment } from "../services/paymentService";
import CancellationPolicyModal from "./CancellationPolicyModal";
import CancelConfirmModal from "./CancelConfirmModal";
import ItineraryView from "./ItineraryView";

/* ─── Extension rates ─── */
const EXTENSION_RATES = { DOMESTIC: 3000, INTERNATIONAL: 10000 };

/* ─── Extension Policy Modal ─── */
function ExtensionPolicyModal({ onClose, onConfirm }) {
  return (
    <div className="tm-modal-overlay">
      <div className="tm-modal" style={{ maxWidth: 480 }}>
        <div className="tm-modal-head">
          <div className="tm-modal-title">🔁 Extension Policy</div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="policy-box">
          <div className="policy-row">
            <span className="policy-icon">🏔️</span>
            <div>
              <div className="policy-title">Domestic Trips — ₹3,000 / day / person</div>
              <div className="policy-desc">Each extra day for domestic destinations is charged at ₹3,000 per person.</div>
            </div>
          </div>
          <div className="policy-row">
            <span className="policy-icon">✈️</span>
            <div>
              <div className="policy-title">International Trips — ₹10,000 / day / person</div>
              <div className="policy-desc">Each extra day for international destinations is charged at ₹10,000 per person.</div>
            </div>
          </div>
          <div className="policy-row">
            <span className="policy-icon">📝</span>
            <div>
              <div className="policy-title">Extension Rules</div>
              <div className="policy-desc">Available for confirmed & ongoing trips only. An updated itinerary is emailed to you after extension.</div>
            </div>
          </div>
        </div>
        <div className="tm-modal-actions">
          <button className="btn-ghost" onClick={onClose}>Go Back</button>
          <button className="btn-primary" onClick={onConfirm}>Proceed to Extend →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Extend Trip Modal ─── */
function ExtendModal({ booking, onClose, onSuccess }) {
  const [extraDays, setExtraDays] = useState(2);
  const [tripType,  setTripType]  = useState("DOMESTIC");
  const [showPolicy, setShowPolicy] = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const rate      = EXTENSION_RATES[tripType];
  const extraCost = Number(extraDays) * (booking.people || 1) * rate;

  const confirm = async () => {
    setLoading(true); setError("");
    try {
      await API.post("/booking/extend", {
        bookingId: booking.id,
        extraDays: Number(extraDays),
        extraCost: Number(extraCost),
      });
      onSuccess("Trip extended successfully! Check your email for the updated itinerary.");
    } catch (err) {
      setError(err.response?.data?.message || "Extension failed.");
    } finally { setLoading(false); }
  };

  if (showPolicy) {
    return <ExtensionPolicyModal onClose={onClose} onConfirm={() => setShowPolicy(false)} />;
  }

  return (
    <div className="tm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal" style={{ maxWidth: 440 }}>
        <div className="tm-modal-head">
          <div className="tm-modal-title">Extend Trip</div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: "0.9rem" }}>
          Extending: <strong style={{ color: "#eef2ff" }}>{booking.destination}</strong>
        </p>
        {error && <div className="alert alert-error mb-16"><span>⚠</span> {error}</div>}

        <div className="tm-modal-section">
          <label className="form-label">Trip Type</label>
          <select className="form-input" value={tripType} onChange={e => setTripType(e.target.value)}>
            <option value="DOMESTIC">🏔️ Domestic — ₹3,000 / day / person</option>
            <option value="INTERNATIONAL">✈️ International — ₹10,000 / day / person</option>
          </select>
        </div>

        <div className="tm-modal-section">
          <label className="form-label">Extra Days</label>
          <input className="form-input" type="number" min="1" max="30"
            value={extraDays} onChange={e => setExtraDays(e.target.value)} />
        </div>

        <div className="tm-modal-section">
          <label className="form-label">Total Extension Cost</label>
          <div style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: 8, padding: "12px 16px",
            color: "#eef2ff", fontSize: "1.05rem", fontWeight: 600
          }}>
            ₹{extraCost.toLocaleString("en-IN")}
            <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>
              ({extraDays}d × {booking.people || 1} person × ₹{rate.toLocaleString("en-IN")})
            </span>
          </div>
        </div>

        <div className="tm-modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={confirm} disabled={loading}>
            {loading ? "Extending…" : `Extend +${extraDays} days →`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Travel Status Badge ─── */
function TravelStatusBadge({ travelStatus }) {
  const map = {
    NOT_STARTED: { cls: "badge-info",    icon: "🕐", label: "Not Started" },
    ONGOING:     { cls: "badge-warning", icon: "🚀", label: "Ongoing"     },
    COMPLETED:   { cls: "badge-success", icon: "✅", label: "Completed"   },
  };
  const { cls, icon, label } = map[travelStatus] || { cls: "badge-info", icon: "•", label: travelStatus || "Unknown" };
  return <span className={`badge ${cls}`}>{icon} {label}</span>;
}

/* ─── Main BookingCard ─── */
export default function BookingCard({ booking, onRefresh, onToast }) {
  const [extending,   setExtending]   = useState(false);
  const [showCancel,  setShowCancel]  = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [itinerary,   setItinerary]   = useState(null);
  const [itinLoading, setItinLoading] = useState(false);
  const [actioning,   setActioning]   = useState("");

  const remaining   = (booking.totalAmount || 0) - (booking.paidAmount || 0);
  const isCancelled = booking.bookingStatus === "CANCELLED";
  const isCompleted = booking.travelStatus  === "COMPLETED";
  const isOngoing   = booking.travelStatus  === "ONGOING";
  const isCustom    = booking.isCustom === true;

  /* ── Load itinerary from backend when user expands ── */
  const loadDetails = async () => {
    if (showDetails) { setShowDetails(false); return; }

    if (!itinerary && booking.packageId) {
      setItinLoading(true);
      try {
        const r    = await API.get(`/trips/details/${booking.packageId}`);
        const days = booking.days || r.data.duration;
        const gen  = Array.from({ length: days }, (_, i) => ({
          day:  i + 1,
          plan: i === days - 1
            ? "Departure & Check-out"
            : (r.data.itinerary?.[i]?.plan || `Activity Day ${i + 1}`),
        }));
        setItinerary(gen);
        sessionStorage.setItem(`tm_itin_${booking.packageId}`, JSON.stringify(gen));
      } catch {
        const cached = sessionStorage.getItem(`tm_itin_${booking.packageId}`);
        setItinerary(cached ? JSON.parse(cached) : []);
      } finally { setItinLoading(false); }
    }
    setShowDetails(true);
  };

  /* ── Pay remaining ── */
  const pay = async () => {
    try {
      const order = await createOrder(remaining);
      new window.Razorpay({
        key:        process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_SYwj3a2gBudlrJ",
        amount:     order.amount,
        order_id:   order.id,
        name:       "TravelMate",
        description:`Pay for ${booking.destination}`,
        theme:      { color: "#f59e0b" },
        handler: async (res) => {
          await verifyPayment({ orderId: order.id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature });
          await API.post(`/booking/pay/${booking.id}`);
          onToast("Payment successful! 🎉"); onRefresh();
        },
      }).open();
    } catch {
      try {
        setActioning("pay");
        await API.post(`/booking/pay/${booking.id}`);
        onToast("Payment recorded!"); onRefresh();
      } catch { onToast("Payment failed. Please try again."); }
      finally  { setActioning(""); }
    }
  };

  const doCancel = async () => {
    setShowCancel(false);
    setActioning("cancel");
    try {
      await API.post(`/booking/cancel/${booking.id}`);
      onToast("Booking cancelled."); onRefresh();
    } catch { onToast("Cancellation failed."); }
    finally  { setActioning(""); }
  };

  return (
    <>
      <div className={`booking-card${isCancelled ? " cancelled" : ""}${isCompleted ? " completed" : ""}${isOngoing ? " ongoing" : ""}`}>

        {/* ── Header ── */}
        <div className="booking-head">
          <div>
            <div className="booking-dest">{booking.destination}</div>
            <div className="booking-type-label">
              {isCustom
                ? <span className="badge badge-custom">✨ My Custom Trip</span>
                : <span className="badge badge-official">✅ Official Package</span>
              }
            </div>
          </div>
          <div className="booking-badges">
            {isCancelled && <span className="badge badge-danger">❌ Cancelled</span>}
            {!isCancelled && <TravelStatusBadge travelStatus={booking.travelStatus} />}
            {!isCancelled && booking.paymentStatus === "PARTIAL" && <span className="badge badge-warning">💳 Partial Pay</span>}
            {!isCancelled && booking.paymentStatus === "FULL"    && <span className="badge badge-success">💳 Paid</span>}
            {!isCancelled && booking.bookingStatus === "CONFIRMED" && !isCompleted && <span className="badge badge-info">🎟 Confirmed</span>}
          </div>
        </div>

        {/* ── Dates & Duration ── */}
        <div className="booking-info-row">
          <div className="booking-info-item">
            <span className="info-label">Departure</span>
            <span className="info-val">{booking.startDate || "—"}</span>
          </div>
          <div className="booking-arrow">→</div>
          <div className="booking-info-item">
            <span className="info-label">Return</span>
            <span className="info-val">{booking.endDate || "—"}</span>
          </div>
          {booking.days   && <div className="booking-info-item"><span className="info-label">Duration</span><span className="info-val">{booking.days}d</span></div>}
          {booking.people && <div className="booking-info-item"><span className="info-label">People</span><span className="info-val">{booking.people}</span></div>}
        </div>

        {/* ── Traveller Names ── */}
        {booking.travellerNames?.length > 0 && (
          <div className="traveller-section">
            <div className="traveller-label">👥 Travellers</div>
            <div className="traveller-pills">
              {booking.travellerNames.map((name, i) => (
                <span key={i} className="traveller-pill">{name}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Payment Summary ── */}
        {booking.totalAmount > 0 && (
          <div className="booking-money">
            <div className="money-item">
              <span className="money-label">Total</span>
              <span className="money-val">₹{Number(booking.totalAmount).toLocaleString("en-IN")}</span>
            </div>
            <div className="money-item">
              <span className="money-label">Paid</span>
              <span className="money-val paid-amt">₹{Number(booking.paidAmount || 0).toLocaleString("en-IN")}</span>
            </div>
            {remaining > 0 && !isCancelled && (
              <div className="money-item">
                <span className="money-label">Due</span>
                <span className="money-val due-amt">₹{Number(remaining).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="booking-actions">
          {/* View details always available */}
          <button className="btn-view-details" onClick={loadDetails}>
            {itinLoading ? "Loading…" : showDetails ? "Hide Details ▲" : "View Details ▼"}
          </button>

          {/* Pay remaining — if balance outstanding and not cancelled */}
          {!isCancelled && remaining > 0 && (
            <button className="btn-pay" onClick={pay} disabled={actioning === "pay"}>
              {actioning === "pay" ? "…" : `💳 Pay ₹${Number(remaining).toLocaleString("en-IN")}`}
            </button>
          )}

          {/* Extend — available for confirmed & ongoing (not completed, not cancelled) */}
          {!isCancelled && !isCompleted && (
            <button className="btn-extend" onClick={() => setExtending(true)}>+ Extend</button>
          )}

          {/* Cancel — available for confirmed & ongoing (not completed, not cancelled) */}
          {!isCancelled && !isCompleted && (
            <button className="btn-cancel" onClick={() => setShowCancel(true)} disabled={actioning === "cancel"}>
              {actioning === "cancel" ? "…" : "Cancel"}
            </button>
          )}

          {/* Info chip when no actions available */}
          {(isCancelled || isCompleted) && (
            <span className="booking-no-action-hint">
              {isCancelled ? "🚫 This booking was cancelled" : "🏁 Trip completed — no further actions"}
            </span>
          )}
        </div>

        {/* ── Expanded Trip Details ── */}
        {showDetails && (
          <div className="trip-details-expanded">
            <div className="trip-detail-section">
              <div className="trip-detail-title">📋 Trip Summary</div>
              <div className="trip-detail-grid">
                <div className="trip-detail-item">
                  <span className="td-label">Booking ID</span>
                  <span className="td-val">#{booking.id}</span>
                </div>
                <div className="trip-detail-item">
                  <span className="td-label">Destination</span>
                  <span className="td-val">{booking.destination}</span>
                </div>
                <div className="trip-detail-item">
                  <span className="td-label">Type</span>
                  <span className="td-val">{isCustom ? "Custom Trip" : "Official Package"}</span>
                </div>
                <div className="trip-detail-item">
                  <span className="td-label">Travel Status</span>
                  <span className="td-val">{booking.travelStatus?.replace("_", " ") || "—"}</span>
                </div>
                <div className="trip-detail-item">
                  <span className="td-label">Payment Status</span>
                  <span className="td-val">{booking.paymentStatus || "—"}</span>
                </div>
                <div className="trip-detail-item">
                  <span className="td-label">Booking Status</span>
                  <span className="td-val">{booking.bookingStatus || "—"}</span>
                </div>
              </div>
            </div>
            <ItineraryView itinerary={itinerary || []} />
          </div>
        )}
      </div>

      {extending  && <ExtendModal booking={booking} onClose={() => setExtending(false)}
          onSuccess={msg => { setExtending(false); onToast(msg); onRefresh(); }} />}
      {showCancel && <CancelConfirmModal booking={booking} onClose={() => setShowCancel(false)} onConfirm={doCancel} />}
    </>
  );
}
