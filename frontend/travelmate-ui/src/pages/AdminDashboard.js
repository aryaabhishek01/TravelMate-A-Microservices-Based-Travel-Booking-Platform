import { useEffect, useState } from "react";
import API from "../services/api";

const TABS = [
  { id: "overview",  label: "Overview",   icon: "📊" },
  { id: "packages",  label: "Packages",   icon: "📦" },
  { id: "users",     label: "Users",      icon: "👥" },
  { id: "bookings",  label: "Bookings",   icon: "🗂" },
  { id: "notify",    label: "Notify",     icon: "📩" },
];

/* ─── Add / Edit Package Modal ─── */
function PackageModal({ pkg, onClose, onSuccess }) {
  const isEdit = !!pkg;
  const [form, setForm] = useState({
    name: pkg?.name || "",
    duration: pkg?.duration || 5,
    price: pkg?.price || 10000,
    type: pkg?.type || "DEFAULT",
    destinationType: pkg?.destinationType || "NATIONAL",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) { setError("Package name is required."); return; }
    setLoading(true); setError("");
    try {
      if (isEdit) {
        await API.put(`/admin/update-package/${pkg.id}`, {
          name: form.name, duration: Number(form.duration),
          price: Number(form.price), type: form.type,
          destinationType: form.destinationType,
        });
        onSuccess("Package updated!");
      } else {
        await API.post("/admin/add-package", {
          name: form.name, duration: Number(form.duration),
          price: Number(form.price), type: form.type,
          destinationType: form.destinationType,
        });
        onSuccess("Package added!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="tm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal" style={{ maxWidth: 480 }}>
        <div className="tm-modal-head">
          <div className="tm-modal-title">{isEdit ? "Edit Package" : "Add New Package"}</div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error mb-16"><span>⚠</span> {error}</div>}

        <div className="tm-modal-section">
          <label className="form-label">Package Name</label>
          <input className="form-input" placeholder="e.g. Goa Premium"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="tm-modal-section form-row-2">
          <div>
            <label className="form-label">Duration (days)</label>
            <input className="form-input" type="number" min="1"
              value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Price (₹ / person)</label>
            <input className="form-input" type="number" min="0"
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
        </div>
        <div className="tm-modal-section form-row-2">
          <div>
            <label className="form-label">Package Type</label>
            <select className="form-input" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="DEFAULT">DEFAULT</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="BUDGET">BUDGET</option>
            </select>
          </div>
          <div>
            <label className="form-label">Destination Type</label>
            <select className="form-input" value={form.destinationType}
              onChange={e => setForm(f => ({ ...f, destinationType: e.target.value }))}>
              <option value="NATIONAL">🇮🇳 National</option>
              <option value="INTERNATIONAL">🌍 International</option>
            </select>
          </div>
        </div>
        <div className="tm-modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes →" : "Add Package →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Itinerary expander inside booking row ─── */
function ItinerarySection({ packageId, days }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const load = async () => {
    if (open) { setOpen(false); return; }
    if (!items) {
      try {
        const r = await API.get(`/trips/details/${packageId}`);
        const d = days || r.data.duration || 5;
        const gen = Array.from({ length: d }, (_, i) => ({
          day: i + 1,
          plan: i === d - 1 ? "Departure & Check-out" : (r.data.itinerary?.[i]?.plan || `Activity Day ${i + 1}`)
        }));
        setItems(gen);
      } catch { setItems([]); }
    }
    setOpen(true);
  };
  return (
    <div>
      <button className="btn-link" style={{ padding: "4px 0", fontSize: "0.8rem" }} onClick={load}>
        {open ? "▲ Hide Itinerary" : "▼ View Itinerary"}
      </button>
      {open && items && (
        <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: "2px solid var(--border2)" }}>
          {items.map(it => (
            <div key={it.day} style={{ fontSize: "0.8rem", color: it.plan.includes("Departure") ? "var(--accent)" : "var(--muted2)", padding: "3px 0" }}>
              <strong>Day {it.day}:</strong> {it.plan}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── User Bookings Modal ─── */
function UserBookingsModal({ email, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    API.get(`/admin/user-bookings?email=${email}`)
      .then(r => setBookings(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [email]);
  return (
    <div className="tm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal" style={{ maxWidth: 700 }}>
        <div className="tm-modal-head">
          <div><div className="tm-modal-title">Bookings for</div><div className="tm-modal-sub">{email}</div></div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>
        {loading ? <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
          : bookings.length === 0
          ? <div className="empty-state" style={{ padding: 32 }}><div className="empty-icon">✈</div><div>No bookings found.</div></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {bookings.map(b => (
                <div key={b.id} style={{ background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{b.destination}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {b.bookingStatus === "CANCELLED" ? <span className="badge badge-danger">Cancelled</span>
                        : b.travelStatus === "COMPLETED" ? <span className="badge badge-success">Completed</span>
                        : <span className="badge badge-info">Active</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--muted2)", marginBottom: 8 }}>
                    📅 {b.startDate} → {b.endDate || "?"} &nbsp;·&nbsp; {b.days || "?"}d &nbsp;·&nbsp; 👥 {b.people || "?"}
                  </div>
                  {b.travellerNames?.length > 0 && (
                    <div style={{ fontSize: "0.84rem", marginBottom: 8 }}>
                      <span style={{ color: "var(--muted)" }}>Travellers: </span>
                      <strong>{b.travellerNames.join(", ")}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: "0.84rem", color: "var(--muted2)", marginBottom: 8 }}>
                    💰 Total: ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")} &nbsp;·&nbsp; Paid: ₹{Number(b.paidAmount || 0).toLocaleString("en-IN")}
                  </div>
                  {b.packageId && <ItinerarySection packageId={b.packageId} days={b.days} />}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard ─── */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users,    setUsers]    = useState([]);
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState("");
  const [pkgModal, setPkgModal] = useState(null); // null | "add" | <packageObj>
  const [viewUserEmail, setViewUserEmail] = useState(null);
  const [notify,    setNotify]    = useState({ email: "", subject: "", message: "" });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [searchPackages, setSearchPackages] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [searchBookings, setSearchBookings] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    // ── Use allSettled so one failing service does NOT blank the others ──
    const [u, b, p] = await Promise.allSettled([
      API.get("/admin/users"),
      API.get("/admin/bookings"),
      API.get("/admin/packages"),
    ]);
    setUsers(
      u.status === "fulfilled" && Array.isArray(u.value.data) ? u.value.data : []
    );
    setBookings(
      b.status === "fulfilled" && Array.isArray(b.value.data) ? b.value.data : []
    );
    setPackages(
      p.status === "fulfilled" && Array.isArray(p.value.data) ? p.value.data : []
    );
    setLoading(false);
  };

  const deletePackage = (id) => {
    setConfirmModal({
      title: "Delete Package?",
      message: "Are you sure you want to delete this package? This cannot be undone.",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setConfirmModal(null);
        setDeletingId(id);
        try {
          await API.delete(`/admin/delete-package/${id}`);
          showToast("Package deleted.");
          setPackages(prev => prev.filter(p => p.id !== id));
        } catch { showToast("Failed to delete package."); }
        finally { setDeletingId(null); }
      }
    });
  };

  const cancelBooking = bookingId => {
    setConfirmModal({
      title: "Cancel Booking?",
      message: "Are you sure you want to cancel this booking?",
      confirmText: "Yes, Cancel",
      cancelText: "Keep Booking",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await API.post(`/admin/cancel-booking/${bookingId}`);
          showToast("Booking cancelled."); fetchAll();
        } catch { showToast("Failed to cancel booking."); }
      }
    });
  };

  const sendNotification = async () => {
    if (!notify.email || !notify.subject || !notify.message) { setNotifyMsg("All fields are required."); return; }
    setNotifyLoading(true); setNotifyMsg("");
    try {
      await API.post(`/notify/send?email=${encodeURIComponent(notify.email)}&subject=${encodeURIComponent(notify.subject)}&message=${encodeURIComponent(notify.message)}`);
      setNotifyMsg("success:Notification sent successfully!");
      setNotify({ email: "", subject: "", message: "" });
    } catch (err) {
      const errMsg = typeof err.response?.data === "string" ? err.response.data : err.response?.data?.message || "Failed to send email.";
      setNotifyMsg("error:" + errMsg);
    } finally { setNotifyLoading(false); }
  };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const totalRevenue   = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const activeBookings = bookings.filter(b => b.bookingStatus !== "CANCELLED" && b.travelStatus !== "COMPLETED").length;
  const completed      = bookings.filter(b => b.travelStatus === "COMPLETED").length;
  const cancelled      = bookings.filter(b => b.bookingStatus === "CANCELLED").length;
  const defaultPkgs    = packages.filter(p => !p.ownerEmail);

  const statusBadge = b => {
    if (b.bookingStatus === "CANCELLED") return <span className="badge badge-danger">Cancelled</span>;
    if (b.travelStatus === "COMPLETED")  return <span className="badge badge-success">Completed</span>;
    if (b.paymentStatus === "FULL")      return <span className="badge badge-success">Paid</span>;
    if (b.paymentStatus === "PARTIAL")   return <span className="badge badge-warning">Partial</span>;
    return <span className="badge badge-info">Active</span>;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span>✈</span> TravelMate
          <span className="admin-tag">ADMIN</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button key={tab.id} className={`sidebar-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
          <div className="sidebar-divider" />
          <button className="sidebar-item" onClick={() => setPkgModal("add")}>
            <span>+</span><span>Add Package</span>
          </button>
          <button className="sidebar-item" onClick={() => { window.location.href = "/dashboard"; }}>
            <span>🌍</span><span>User View</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {toast && (
          <div className="toast"><span>✓</span> {toast}
            <button className="toast-close" onClick={() => setToast("")}>✕</button>
          </div>
        )}

        {loading
          ? <div className="page-loading"><div className="spinner" /><span>Loading admin data…</span></div>
          : <>
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div>
                  <div className="admin-page-header">
                    <h2 className="admin-page-title">Overview</h2>
                    <button className="btn-refresh" onClick={fetchAll}>↻ Refresh</button>
                  </div>
                  <div className="stats-grid">
                    {[
                      { icon:"📦", val: defaultPkgs.length,  label:"Default Packages",  color:"#6366f1" },
                      { icon:"👥", val: users.length,         label:"Total Users",        color:"#f59e0b" },
                      { icon:"✈",  val: activeBookings,       label:"Active Bookings",    color:"#f59e0b" },
                      { icon:"🏁", val: completed,            label:"Completed Trips",    color:"#10b981" },
                      { icon:"🚫", val: cancelled,            label:"Cancellations",      color:"#ef4444" },
                      { icon:"💰", val: `₹${Number(totalRevenue).toLocaleString("en-IN")}`, label:"Revenue Collected", color:"#10b981" },
                    ].map((s, i) => (
                      <div key={i} className="stat-card" style={{ "--sc": s.color }}>
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-val">{s.val}</div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="admin-table-section">
                    <div className="table-section-head">Recent Bookings</div>
                    <div className="admin-table-wrap">
                      <table>
                        <thead><tr><th>Destination</th><th>User</th><th>Start Date</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                          {[...bookings].sort((a, b) => b.id - a.id).slice(0, 10).map(b => (
                            <tr key={b.id}>
                              <td style={{ fontWeight:500 }}>{b.destination}</td>
                              <td style={{ color:"var(--muted)", fontSize:"0.85rem" }}>{b.userEmail || "—"}</td>
                              <td style={{ color:"var(--muted)" }}>{b.startDate || "—"}</td>
                              <td>₹{Number(b.totalAmount||0).toLocaleString("en-IN")}</td>
                              <td>{statusBadge(b)}</td>
                            </tr>
                          ))}
                          {bookings.length === 0 && <tr><td colSpan={5} className="table-empty">No bookings yet</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PACKAGES */}
              {activeTab === "packages" && (
                <div>
                  <div className="admin-page-header">
                    <h2 className="admin-page-title">Packages</h2>
                    <span className="section-count">{defaultPkgs.length} default packages</span>
                    <div className="search-bar" style={{ marginBottom: 0, marginLeft: "auto", marginRight: 16, width: 250 }}>
                      <span className="search-icon">🔍</span>
                      <input className="search-input" placeholder="Search packages..." value={searchPackages} onChange={e => setSearchPackages(e.target.value)} />
                      {searchPackages && <button className="search-clear" onClick={() => setSearchPackages("")}>✕</button>}
                    </div>
                    <button className="btn-primary" style={{ width:"auto", padding:"9px 20px" }}
                      onClick={() => setPkgModal("add")}>+ Add Package</button>
                  </div>
                  <div className="admin-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th><th>Name</th><th>Type</th><th>Dest Type</th>
                          <th>Duration</th><th>Price</th><th>Slots Used</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaultPkgs
                          .filter(p => p.name?.toLowerCase().includes(searchPackages.toLowerCase()) || p.type?.toLowerCase().includes(searchPackages.toLowerCase()) || p.destinationType?.toLowerCase().includes(searchPackages.toLowerCase()))
                          .map((p, i) => (
                          <tr key={p.id}>
                            <td style={{ color:"var(--muted)" }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td><span className="badge badge-info">{p.type || "DEFAULT"}</span></td>
                            <td>
                              {p.destinationType === "INTERNATIONAL"
                                ? <span className="badge badge-warning">🌍 Intl</span>
                                : <span className="badge badge-success">🇮🇳 National</span>}
                            </td>
                            <td>{p.duration}d</td>
                            <td style={{ fontWeight:600, color:"var(--accent)" }}>₹{Number(p.price).toLocaleString("en-IN")}</td>
                            <td>
                              <span style={{ fontSize:"0.82rem", color:"var(--muted2)" }}>
                                {p.bookedSlots || 0}/{p.totalSlots || 15}
                              </span>
                            </td>
                            <td>
                              <div style={{ display:"flex", gap:6 }}>
                                <button className="btn-link" onClick={() => setPkgModal(p)}>✏️ Edit</button>
                                <button className="btn-cancel-sm"
                                  disabled={deletingId === p.id}
                                  onClick={() => deletePackage(p.id)}>
                                  {deletingId === p.id ? "…" : "🗑 Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {defaultPkgs.length === 0 && (
                          <tr><td colSpan={8} className="table-empty">
                            No default packages yet. Click "+ Add Package" to create one.
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* USERS */}
              {activeTab === "users" && (
                <div>
                  <div className="admin-page-header">
                    <h2 className="admin-page-title">Users</h2>
                    <span className="section-count">{users.length} total</span>
                    <div className="search-bar" style={{ marginBottom: 0, marginLeft: "auto", width: 250 }}>
                      <span className="search-icon">🔍</span>
                      <input className="search-input" placeholder="Search users..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} />
                      {searchUsers && <button className="search-clear" onClick={() => setSearchUsers("")}>✕</button>}
                    </div>
                  </div>
                  <div className="admin-table-wrap">
                    <table>
                      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Bookings</th><th>Actions</th></tr></thead>
                      <tbody>
                        {users
                          .filter(u => u.name?.toLowerCase().includes(searchUsers.toLowerCase()) || u.email?.toLowerCase().includes(searchUsers.toLowerCase()) || u.role?.toLowerCase().includes(searchUsers.toLowerCase()))
                          .map((u, i) => {
                          const count = bookings.filter(b => b.userEmail === u.email).length;
                          return (
                            <tr key={u.id || i}>
                              <td style={{ color:"var(--muted)" }}>{i+1}</td>
                              <td style={{ fontWeight:500 }}>{u.name || "—"}</td>
                              <td style={{ color:"var(--muted)", fontSize:"0.88rem" }}>{u.email}</td>
                              <td>{u.role === "ADMIN" ? <span className="badge badge-warning">Admin</span> : <span className="badge badge-info">User</span>}</td>
                              <td><span className="badge badge-success">{count}</span></td>
                              <td><button className="btn-link" onClick={() => setViewUserEmail(u.email)}>View Bookings</button></td>
                            </tr>
                          );
                        })}
                        {users.length === 0 && <tr><td colSpan={6} className="table-empty">No users found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BOOKINGS */}
              {activeTab === "bookings" && (
                <div>
                  <div className="admin-page-header">
                    <h2 className="admin-page-title">All Bookings</h2>
                    <span className="section-count">{bookings.length} total</span>
                    <div className="search-bar" style={{ marginBottom: 0, marginLeft: "auto", width: 250 }}>
                      <span className="search-icon">🔍</span>
                      <input className="search-input" placeholder="Search bookings..." value={searchBookings} onChange={e => setSearchBookings(e.target.value)} />
                      {searchBookings && <button className="search-clear" onClick={() => setSearchBookings("")}>✕</button>}
                    </div>
                  </div>
                  <div className="admin-table-wrap">
                    <table>
                      <thead><tr><th>Destination</th><th>User</th><th>Dates</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {bookings
                          .filter(b => b.destination?.toLowerCase().includes(searchBookings.toLowerCase()) || b.userEmail?.toLowerCase().includes(searchBookings.toLowerCase()) || b.bookingStatus?.toLowerCase().includes(searchBookings.toLowerCase()) || b.travelStatus?.toLowerCase().includes(searchBookings.toLowerCase()))
                          .map(b => (
                          <tr key={b.id}>
                            <td style={{ fontWeight:500 }}>{b.destination}</td>
                            <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{b.userEmail||"—"}</td>
                            <td style={{ fontSize:"0.82rem", color:"var(--muted)" }}>{b.startDate} → {b.endDate||"?"}</td>
                            <td>
                              <div>₹{Number(b.totalAmount||0).toLocaleString("en-IN")}</div>
                              {b.paidAmount > 0 && <div style={{ fontSize:"0.76rem", color:"var(--muted)" }}>Paid: ₹{Number(b.paidAmount).toLocaleString("en-IN")}</div>}
                            </td>
                            <td>
                              {b.paymentStatus === "FULL"    ? <span className="badge badge-success">Full</span>
                               : b.paymentStatus === "PARTIAL" ? <span className="badge badge-warning">Partial</span>
                               : <span className="badge badge-danger">Unpaid</span>}
                            </td>
                            <td>{statusBadge(b)}</td>
                            <td>
                              {b.bookingStatus !== "CANCELLED" && (
                                <button className="btn-cancel-sm" onClick={() => cancelBooking(b.id)}>Cancel</button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {bookings.length === 0 && <tr><td colSpan={7} className="table-empty">No bookings found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NOTIFY */}
              {activeTab === "notify" && (
                <div>
                  <div className="admin-page-header">
                    <h2 className="admin-page-title">Send Notification</h2>
                  </div>
                  <div className="notify-card">
                    <p className="notify-desc">Sends via <code>POST /notify/send?email=&subject=&message=</code></p>
                    {notifyMsg && (
                      <div className={`alert ${notifyMsg.startsWith("success:") ? "alert-success" : "alert-error"} mb-16`}>
                        {notifyMsg.replace(/^(success|error):/, "")}
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Recipient Email</label>
                      <input className="form-input" type="email" placeholder="user@example.com"
                        value={notify.email} onChange={e => setNotify(n => ({ ...n, email: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input className="form-input" placeholder="Booking Confirmed"
                        value={notify.subject} onChange={e => setNotify(n => ({ ...n, subject: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea className="form-input" rows={5} placeholder="Your message here…"
                        value={notify.message} onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                        style={{ resize: "vertical" }} />
                    </div>
                    <button className="btn-primary" style={{ width:"auto", padding:"13px 32px" }}
                      onClick={sendNotification} disabled={notifyLoading}>
                      {notifyLoading ? <span className="btn-loading"><span className="btn-spinner" /> Sending…</span> : "Send Notification →"}
                    </button>
                  </div>
                </div>
              )}
            </>
        }
      </main>

      {/* Package add/edit modal */}
      {pkgModal && (
        <PackageModal
          pkg={pkgModal === "add" ? null : pkgModal}
          onClose={() => setPkgModal(null)}
          onSuccess={msg => { setPkgModal(null); showToast(msg); fetchAll(); }}
        />
      )}

      {viewUserEmail && (
        <UserBookingsModal email={viewUserEmail} onClose={() => setViewUserEmail(null)} />
      )}

      {confirmModal && (
        <div className="tm-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="tm-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="tm-modal-head">
              <div className="tm-modal-title">{confirmModal.title}</div>
              <button className="tm-modal-close" onClick={() => setConfirmModal(null)}>✕</button>
            </div>
            <div className="tm-modal-body" style={{ padding: "16px 0", color: "var(--muted)", fontSize: "0.95rem" }}>
              {confirmModal.message}
            </div>
            <div className="tm-modal-actions" style={{ marginTop: 16 }}>
              <button className="btn-ghost" onClick={() => setConfirmModal(null)}>
                {confirmModal.cancelText || "Cancel"}
              </button>
              <button
                className="btn-primary"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                }}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}