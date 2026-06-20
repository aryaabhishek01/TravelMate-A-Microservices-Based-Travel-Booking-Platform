import { useState } from "react";
import {
  Modal, Button, Form, InputGroup,
  Row, Col, Badge, Alert, Stack,
} from "react-bootstrap";
import API from "../services/api";
import { createOrder, verifyPayment } from "../services/paymentService";
import ItineraryView from "./ItineraryView";

/* ─── shared dark-theme overrides injected once ─── */
const darkModalCSS = `
  .bm-modal .modal-content {
    background: #1e2a45 !important;
    border: 1px solid rgba(255,255,255,0.18) !important;
    border-radius: 18px !important;
    color: #eef2ff !important;
    font-family: 'Outfit', sans-serif;
  }
  .bm-modal .modal-header {
    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
    padding: 1.25rem 1.5rem 1rem;
  }
  .bm-modal .modal-body   { padding: 1.25rem 1.5rem; }
  .bm-modal .modal-footer {
    border-top: 1px solid rgba(255,255,255,0.1) !important;
    padding: 0.9rem 1.5rem 1.25rem;
  }
  /* Responsive max-width */
  @media (min-width: 576px)  { .bm-modal .modal-dialog { max-width: 540px; } }
  @media (min-width: 768px)  { .bm-modal .modal-dialog { max-width: 600px; } }
  @media (min-width: 992px)  { .bm-modal .modal-dialog { max-width: 640px; } }
  @media (max-width: 575px)  {
    .bm-modal .modal-body   { padding: 1rem; }
    .bm-modal .modal-header { padding: 1rem 1rem 0.75rem; }
    .bm-modal .modal-footer { padding: 0.75rem 1rem; }
  }
  .bm-modal .modal-title  { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.3rem; color: #eef2ff; }
  .bm-modal .btn-close    { filter: invert(1) grayscale(1) brightness(1.5); }

  /* Form controls */
  .bm-modal .form-label   { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; color: #94a3b8; }
  .bm-modal .form-control,
  .bm-modal .form-select  {
    background: #253352 !important;
    border: 1px solid rgba(255,255,255,0.22) !important;
    color: #eef2ff !important;
    border-radius: 8px;
  }
  .bm-modal .form-control:focus,
  .bm-modal .form-select:focus {
    border-color: #f59e0b !important;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.2) !important;
    background: #2a3a5c !important;
  }
  .bm-modal .form-control::placeholder { color: #64748b !important; }
  .bm-modal .form-control[type="date"] { color-scheme: dark; }
  .bm-modal .form-select option { background: #1e2a45 !important; color: #eef2ff !important; }
  .bm-modal .form-check-input { accent-color: #f59e0b; width: 1.1em; height: 1.1em; background-color: #253352; border: 1px solid rgba(255,255,255,0.3); }
  .bm-modal .form-check-input:checked { background-color: #f59e0b !important; border-color: #f59e0b !important; }
  .bm-modal .form-check-input[type="radio"]:checked { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23fff'/%3e%3c/svg%3e") !important; }
  .bm-modal .form-check-label { color: #94a3b8; font-size: 0.9rem; }
  .bm-modal .form-text        { color: #64748b !important; }

  /* Price summary box */
  .bm-price-box {
    background: #253352;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .bm-price-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.9rem; color: #94a3b8; margin-bottom: 8px;
  }
  .bm-price-row.total {
    font-family: 'Syne', sans-serif; font-size: 1rem;
    color: #eef2ff; font-weight: 700;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 10px; margin-top: 4px; margin-bottom: 0;
  }
  .bm-counter {
    display: inline-flex; align-items: center;
    background: #253352; border: 1px solid rgba(255,255,255,0.22);
    border-radius: 8px; overflow: hidden; height: 42px;
  }
  .bm-counter-btn {
    width: 42px; height: 42px; background: transparent;
    border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; font-family: inherit;
  }
  .bm-counter-btn:hover { background: rgba(255,255,255,0.07); color: #eef2ff; }
  .bm-counter-val { padding: 0 20px; font-size: 1rem; font-weight: 600; color: #eef2ff; min-width: 48px; text-align: center; }

  /* Policy rows */
  .bm-policy-row { display: flex; gap: 12px; margin-bottom: 14px; }
  .bm-policy-icon { font-size: 1.25rem; flex-shrink: 0; padding-top: 2px; }
  .bm-policy-title { font-weight: 600; color: #eef2ff; font-size: 0.9rem; margin-bottom: 3px; }
  .bm-policy-desc  { font-size: 0.82rem; color: #94a3b8; line-height: 1.5; }

  /* Buttons */
  .bm-btn-book {
    background: linear-gradient(135deg,#f59e0b,#d97706) !important;
    border: none !important; color: #0a0e1a !important;
    font-weight: 700 !important; border-radius: 8px !important;
    padding: 11px 24px !important;
  }
  .bm-btn-book:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }
  .bm-btn-book:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(245,158,11,0.4) !important; transform: translateY(-1px); }
  .bm-btn-ghost {
    background: transparent !important; color: #94a3b8 !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
    border-radius: 8px !important; padding: 11px 20px !important;
  }
  .bm-btn-ghost:hover { color: #eef2ff !important; border-color: rgba(255,255,255,0.35) !important; }
  .bm-btn-link {
    background: none; border: none; color: #f59e0b;
    font-size: 0.85rem; padding: 4px 0; cursor: pointer; font-family: inherit;
  }
  .bm-modal .backdrop { backdrop-filter: none !important; }
`;

/* Inject CSS once */
if (!document.getElementById("bm-dark-styles")) {
  const tag = document.createElement("style");
  tag.id = "bm-dark-styles";
  tag.textContent = darkModalCSS;
  document.head.appendChild(tag);
}

/* ─── Policy screen ─── */
function PolicyScreen({ onBack, onConfirm, loading }) {
  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title>📋 Cancellation Policy</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ background: "#253352", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 18px", marginBottom: 8 }}>
          {[
            { icon: "✅", t: "Full Payment — 70% Refund",  d: "Paid in full and cancel before trip starts → 70% refund." },
            { icon: "⚠️", t: "Advance (30%) — No Refund",  d: "Paid only 30% advance and cancel → no refund." },
            { icon: "🚫", t: "Trip Ongoing — No Refund",   d: "No refund once the trip has started." },
          ].map(r => (
            <div className="bm-policy-row" key={r.t}>
              <span className="bm-policy-icon">{r.icon}</span>
              <div>
                <div className="bm-policy-title">{r.t}</div>
                <div className="bm-policy-desc">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button className="bm-btn-ghost" onClick={onBack}>Go Back</Button>
        <Button className="bm-btn-book flex-grow-1" onClick={onConfirm} disabled={loading}>
          {loading ? "Processing…" : "Confirm & Pay →"}
        </Button>
      </Modal.Footer>
    </>
  );
}

/* ─── Main Component ─── */
export default function BookingModal({ pkg, email, onClose, onSuccess }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    people: 1, startDate: today,
    fullPayment: false, names: [""],
    paymentMethod: "ONLINE",
  });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPolicy,   setShowPolicy]   = useState(false);
  const [previewItin,  setPreviewItin]  = useState(null);
  const [showItin,     setShowItin]     = useState(false);
  const [dupWarn,      setDupWarn]      = useState(false);

  const updatePeople = n => {
    const count = Math.max(1, Math.min(10, n));
    setForm(f => ({
      ...f, people: count,
      names: Array.from({ length: count }, (_, i) => f.names[i] || ""),
    }));
  };

  const loadItinerary = async () => {
    if (showItin) { setShowItin(false); return; }
    if (!previewItin) {
      try {
        const r = await API.get(`/trips/details/${pkg.id}`);
        setPreviewItin(r.data.itinerary || []);
      } catch { setPreviewItin([]); }
    }
    setShowItin(true);
  };

  const handleBook = () => {
    if (form.names.some(n => !n.trim())) {
      setError("Please fill in all traveller names."); return;
    }
    const lower = form.names.map(n => n.trim().toLowerCase());
    if (lower.some((n, i) => lower.indexOf(n) !== i)) {
      setDupWarn(true); return;
    }
    setShowPolicy(true);
  };

  const handleDupProceed = () => { setDupWarn(false); setShowPolicy(true); };
  const handleDupCancel  = () => { setDupWarn(false); };

  const confirm = async () => {
    setShowPolicy(false); setError(""); setLoading(true);
    const total        = pkg.price * form.people;
    const amountToPay  = form.fullPayment ? total : Math.round(total * 0.3);
    try {
      if (form.paymentMethod === "ONLINE") {
        const order = await createOrder(amountToPay);
        await new Promise((resolve, reject) => {
          if (!window.Razorpay) { reject(new Error("Payment gateway not loaded.")); return; }
          const rzp = new window.Razorpay({
            key:         process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_SYwj3a2gBudlrJ",
            amount:      order.amount, currency: order.currency || "INR",
            name:        "TravelMate", description: `Booking: ${pkg.name}`,
            order_id:    order.id,    prefill: { email },
            theme:       { color: "#f59e0b" },
            handler: async resp => {
              try {
                await verifyPayment({
                  orderId:   resp.razorpay_order_id,
                  paymentId: resp.razorpay_payment_id,
                  signature: resp.razorpay_signature,
                });
                resolve();
              } catch (e) { reject(e); }
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
          });
          rzp.on("payment.failed", r => reject(new Error(r.error?.description || "Payment failed.")));
          rzp.open();
        });
      }
      await API.post("/booking/create", {
        userEmail:      email,
        destination:    pkg.name,
        days:           pkg.duration,
        people:         form.people,
        travellerNames: form.names,
        totalAmount:    total,
        fullPayment:    form.fullPayment,
        startDate:      form.startDate,
        packageId:      pkg.id,
        isCustom:       false,
      });
      onSuccess("🎉 Booking confirmed! Check your email for the itinerary.");
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Booking failed. Try again.");
    } finally { setLoading(false); }
  };

  const total = pkg.price * form.people;
  const due   = form.fullPayment ? total : Math.round(total * 0.3);

  return (
    <Modal
      show
      onHide={onClose}
      centered
      scrollable
      dialogClassName="bm-modal"
      backdropClassName="bm-backdrop"
      backdrop="static"
      keyboard={!loading}
    >
      {showPolicy
        ? <PolicyScreen onBack={() => setShowPolicy(false)} onConfirm={confirm} loading={loading} />
        : (
          <>
            {/* ── Header ── */}
            <Modal.Header closeButton={!loading} onHide={onClose}>
              <Modal.Title>
                {pkg.name}
                <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 400, marginTop: 3, fontFamily: "'Outfit', sans-serif" }}>
                  {pkg.duration} days · ₹{Number(pkg.price).toLocaleString("en-IN")} per person
                </div>
              </Modal.Title>
            </Modal.Header>

            {/* ── Body ── */}
            <Modal.Body>
              {dupWarn && (
                <div style={{
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.45)",
                  borderRadius: 10, padding: "14px 16px",
                  marginBottom: 14,
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
              {error && (
                <Alert variant="danger" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", borderRadius: 8 }}>
                  ⚠ {error}
                </Alert>
              )}

              {/* People */}
              <Form.Group className="mb-3">
                <Form.Label>Number of People</Form.Label>
                <div>
                  <div className="bm-counter">
                    <button className="bm-counter-btn" type="button" onClick={() => updatePeople(form.people - 1)}>−</button>
                    <span className="bm-counter-val">{form.people}</span>
                    <button className="bm-counter-btn" type="button" onClick={() => updatePeople(form.people + 1)}>+</button>
                  </div>
                </div>
              </Form.Group>

              {/* Start Date */}
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date" value={form.startDate} min={today}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </Form.Group>

              {/* Traveller Names */}
              <Form.Group className="mb-3">
                <Form.Label>Traveller Names</Form.Label>
                <Row className="g-2">
                  {form.names.map((n, i) => (
                    <Col xs={12} sm={form.people > 1 ? 6 : 12} key={i}>
                      <Form.Control
                        placeholder={`Traveller ${i + 1}`}
                        value={n}
                        onChange={e => {
                          const names = [...form.names]; names[i] = e.target.value;
                          setForm(f => ({ ...f, names }));
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              </Form.Group>

              {/* Price Summary */}
              <div className="bm-price-box mb-3">
                {/* Package total */}
                <div className="bm-price-row">
                  <span>Package × {form.people}</span>
                  <span style={{ color: "#eef2ff" }}>₹{Number(total).toLocaleString("en-IN")}</span>
                </div>

                {/* Payment Method */}
                <div className="bm-price-row">
                  <span>Payment Method</span>
                  <Stack direction="horizontal" gap={3}>
                    <Form.Check
                      type="radio" id="pay-online" label="Online"
                      checked={form.paymentMethod === "ONLINE"}
                      onChange={() => setForm(f => ({ ...f, paymentMethod: "ONLINE" }))}
                    />
                    <Form.Check
                      type="radio" id="pay-cash" label="Cash"
                      checked={form.paymentMethod === "CASH"}
                      onChange={() => setForm(f => ({ ...f, paymentMethod: "CASH", fullPayment: false }))}
                    />
                  </Stack>
                </div>

                {/* Full / Partial */}
                <div className="bm-price-row">
                  <Form.Check
                    type="checkbox" id="full-pay"
                    label="Pay full amount now"
                    checked={form.fullPayment}
                    disabled={form.paymentMethod === "CASH"}
                    onChange={e => setForm(f => ({ ...f, fullPayment: e.target.checked }))}
                    style={{ opacity: form.paymentMethod === "CASH" ? 0.5 : 1 }}
                  />
                  <Badge
                    bg={form.fullPayment ? "success" : "warning"}
                    text={form.fullPayment ? undefined : "dark"}
                    style={{ fontSize: "0.8rem" }}
                  >
                    {form.fullPayment ? "100%" : "30% advance"}
                  </Badge>
                </div>

                {/* Pay Now total */}
                <div className="bm-price-row total">
                  <span>Pay Now</span>
                  <span style={{ color: "#f59e0b" }}>₹{Number(due).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Itinerary Preview toggle */}
              <button className="bm-btn-link" type="button" onClick={loadItinerary}>
                {showItin ? "▲ Hide Itinerary Preview" : "▼ View Itinerary Preview"}
              </button>
              {showItin && <ItineraryView itinerary={previewItin || []} />}
            </Modal.Body>

            {/* ── Footer ── */}
            <Modal.Footer>
              <Button className="bm-btn-ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button className="bm-btn-book flex-grow-1" onClick={handleBook} disabled={loading}>
                {loading ? "Processing…" : "Book Now →"}
              </Button>
            </Modal.Footer>
          </>
        )
      }
    </Modal>
  );
}
