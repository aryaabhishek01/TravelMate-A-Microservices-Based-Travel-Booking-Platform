import { useEffect, useState } from "react";
import API from "../services/api";

export default function CancellationPolicyModal({ onClose, onConfirm, actionLabel = "Proceed" }) {
  return (
    <div className="tm-modal-overlay">
      <div className="tm-modal" style={{ maxWidth: 480 }}>
        <div className="tm-modal-head">
          <div className="tm-modal-title">📋 Cancellation Policy</div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="policy-box">
          <div className="policy-row">
            <span className="policy-icon">✅</span>
            <div>
              <div className="policy-title">Full Payment — 70% Refund</div>
              <div className="policy-desc">If you paid in full and cancel before the trip starts, you receive a 70% refund.</div>
            </div>
          </div>
          <div className="policy-row">
            <span className="policy-icon">⚠️</span>
            <div>
              <div className="policy-title">Advance (30%) — No Refund</div>
              <div className="policy-desc">If you paid only the 30% advance and cancel, no refund is issued.</div>
            </div>
          </div>
          <div className="policy-row">
            <span className="policy-icon">🚫</span>
            <div>
              <div className="policy-title">Trip Ongoing — No Refund</div>
              <div className="policy-desc">No refund once the trip has started.</div>
            </div>
          </div>
        </div>
        <div className="tm-modal-actions">
          <button className="btn-ghost" onClick={onClose}>Go Back</button>
          <button className="btn-primary" onClick={onConfirm}>{actionLabel} →</button>
        </div>
      </div>
    </div>
  );
}
