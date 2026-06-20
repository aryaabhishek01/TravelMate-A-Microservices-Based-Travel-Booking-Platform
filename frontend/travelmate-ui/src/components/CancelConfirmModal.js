import { useEffect, useState } from "react";
import API from "../services/api";

export default function CancelConfirmModal({ booking, onClose, onConfirm }) {
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/booking/cancel-info/${booking.id}`)
      .then(r  => setInfo(r.data))
      .catch(() => setInfo({ refund: 0, message: "Could not load refund info." }))
      .finally(()  => setLoading(false));
  }, [booking.id]);

  return (
    <div className="tm-modal-overlay">
      <div className="tm-modal" style={{ maxWidth: 440 }}>
        <div className="tm-modal-head">
          <div className="tm-modal-title">Cancel Booking?</div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: "#94a3b8", marginBottom: 20 }}>
          Destination: <strong style={{ color: "#eef2ff" }}>{booking.destination}</strong>
        </p>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}><div className="spinner" /></div>
        ) : (
          <div
            className={`alert ${info.refund > 0 ? "alert-success" : "alert-error"}`}
            style={{ marginBottom: 20 }}
          >
            <span>{info.refund > 0 ? "💰" : "⚠️"}</span>
            <div>
              <div style={{ fontWeight: 600 }}>
                {info.refund > 0
                  ? `Refund: ₹${Number(info.refund).toLocaleString("en-IN")}`
                  : "No Refund"}
              </div>
              <div style={{ fontSize: "0.85rem", marginTop: 4 }}>{info.message}</div>
            </div>
          </div>
        )}
        <div className="tm-modal-actions">
          <button className="btn-ghost" onClick={onClose}>Keep Booking</button>
          <button
            className="btn-cancel"
            style={{ flex: 2 }}
            onClick={onConfirm}
            disabled={loading}
          >
            Yes, Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}
