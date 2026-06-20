const DEST_EMOJIS = ["🏔","🏖","🗺","🌋","🏝","🌿","🏕","🗼","🌊","🏜"];
export const getEmoji = (id) => DEST_EMOJIS[(id || 0) % DEST_EMOJIS.length];

export default function PackageCard({ pkg, onBook }) {
  const total   = pkg.totalSlots  || 15;   // || catches 0 as well as null/undefined
  const booked  = pkg.bookedSlots || 0;
  const left    = Math.max(0, total - booked);
  const fillPct = Math.min(100, (booked / total) * 100);
  const isFull  = left <= 0;

  return (
    <div className="pkg-card">
      <div className="pkg-emoji">{getEmoji(pkg.id)}</div>
      <div className="pkg-body">
        <div className="pkg-name">{pkg.name}</div>

        {/* Admin badge — these are all default packages in Explore tab */}
        <span className="badge badge-admin" style={{ marginBottom: 8 }}>
          ✅ Official Package
        </span>

        <div className="pkg-chips">
          <span className="chip">📅 {pkg.duration}d</span>
          <span className="chip">{isFull ? "🔴 Full" : `🟢 ${left} of ${total} slots`}</span>
          {pkg.type && <span className="chip">{pkg.type}</span>}
          {pkg.destinationType && <span className="chip">{pkg.destinationType}</span>}
        </div>

        <div className="pkg-price">
          ₹{Number(pkg.price).toLocaleString("en-IN")}
          <span className="pkg-price-sub"> / person</span>
        </div>

        <div className="slots-bar">
          <div className="slots-fill" style={{ width: `${fillPct}%` }} />
        </div>
        <div className="slots-text">
          {isFull
            ? "All 15 slots booked this month"
            : `${left} of ${total} slots available this month`}
        </div>

        {isFull
          ? <span className="badge badge-danger" style={{ width: "100%", justifyContent: "center", padding: "10px" }}>
              Sold Out
            </span>
          : <button className="btn-book" onClick={() => onBook(pkg)}>
              Book Now →
            </button>
        }
      </div>
    </div>
  );
}
