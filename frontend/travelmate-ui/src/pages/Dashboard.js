import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import PackageCard from "../components/PackageCard";
import BookingModal from "../components/BookingModal";
import BookingCard from "../components/BookingCard";
import CustomPackageTab from "../components/CustomPackageTab";
import ChatBox from "../components/ChatBox";
import logger from "../logger";

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="toast">
      <span>✓</span> {message}
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

export default function Dashboard() {
  // Prefer sessionStorage; fall back to localStorage for legacy logins
  const email = sessionStorage.getItem("email") || localStorage.getItem("email");

  const [allPackages, setAllPackages] = useState([]);
  const [bookings,    setBookings]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState("");
  const [tab,         setTab]         = useState("explore");
  const [search,      setSearch]      = useState("");
  const [tripFilter,  setTripFilter]  = useState("ALL");
  const [pkgError,    setPkgError]    = useState("");   // package-load error
  const [bookError,   setBookError]   = useState("");   // bookings-load error

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 4500); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setPkgError("");
    setBookError("");
    // Logger: info when fetch cycle begins
    logger.info("Dashboard", `Fetching packages and bookings for user: ${email}`);

    // ── Fetch packages ──────────────────────────────────────────
    let packages = [];
    try {
      // Primary: returns public + user-private packages
      const pkgRes = await API.get(`/trips/for-user?email=${encodeURIComponent(email)}`);
      packages = Array.isArray(pkgRes.data) ? pkgRes.data : [];
      sessionStorage.setItem("tm_packages", JSON.stringify(packages));
      // Logger: debug — count packages successfully loaded from API
      logger.debug("Dashboard", `Packages loaded from API: ${packages.length}`);
    } catch (err) {
      // Logger: warn when primary API call fails
      logger.warn("Dashboard", "Primary package fetch failed — checking session cache", err.message);
      // Try session cache first
      const cached = sessionStorage.getItem("tm_packages");
      if (cached) {
        packages = JSON.parse(cached);
        // Logger: debug — packages loaded from session cache
        logger.debug("Dashboard", `Packages served from cache: ${packages.length}`);
      } else {
        // Last resort: try the public /trips/all endpoint
        try {
          const fallbackRes = await API.get("/trips/all");
          packages = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
          sessionStorage.setItem("tm_packages", JSON.stringify(packages));
          // Logger: debug — packages loaded via fallback
          logger.debug("Dashboard", `Fallback /trips/all packages: ${packages.length}`);
        } catch (fallbackErr) {
          // Logger: error — all fetch strategies failed
          logger.error("Dashboard", "All package fetch strategies failed", fallbackErr.message);
          setPkgError(
            "⚠️ Could not load packages. Make sure all backend services are running and try again."
          );
        }
      }
    }
    setAllPackages(packages);

    // ── Fetch bookings ─────────────────────────────────────────
    let bookingList = [];
    try {
      const bookRes = await API.get(`/booking/user?email=${encodeURIComponent(email)}`);
      bookingList = Array.isArray(bookRes.data) ? bookRes.data : [];
      sessionStorage.setItem("tm_bookings", JSON.stringify(bookingList));
      // Logger: debug — bookings loaded for user
      logger.debug("Dashboard", `Bookings loaded: ${bookingList.length}`);
    } catch (bookErr) {
      // Logger: warn on booking fetch failure
      logger.warn("Dashboard", "Bookings fetch failed — checking session cache", bookErr.message);
      const cached = sessionStorage.getItem("tm_bookings");
      if (cached) {
        bookingList = JSON.parse(cached);
        // Logger: debug — bookings from cache
        logger.debug("Dashboard", `Bookings served from cache: ${bookingList.length}`);
      } else {
        // Logger: error — bookings unavailable
        logger.error("Dashboard", "Bookings unavailable: API failed and no cache found");
        setBookError(
          "⚠️ Could not load your trips. Make sure booking-service is running."
        );
      }
    }
    setBookings(bookingList);

    setLoading(false);
    logger.info("Dashboard", "Data fetch cycle complete");
  }, [email]);

  useEffect(() => {
    // Instant paint from session cache
    const cachedPkg  = sessionStorage.getItem("tm_packages");
    const cachedBook = sessionStorage.getItem("tm_bookings");
    if (cachedPkg)  setAllPackages(JSON.parse(cachedPkg));
    if (cachedBook) setBookings(JSON.parse(cachedBook));

    fetchAll();
  }, [fetchAll]);

  // ── EXPLORE: only admin default packages (ownerEmail === null / undefined / "") ──
  const defaultPackages = allPackages.filter(
    p => p.ownerEmail === null || p.ownerEmail === undefined || p.ownerEmail === ""
  );
  const filteredExplore = defaultPackages.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.destinationType?.toLowerCase().includes(search.toLowerCase())
  );

  // ── MY TRIPS filter ──────────────────────────────────────────
  const filteredTrips = bookings.filter(b => {
    if (tripFilter === "ALL")       return true;
    if (tripFilter === "CONFIRMED") return b.bookingStatus === "CONFIRMED" && b.travelStatus !== "COMPLETED";
    if (tripFilter === "ONGOING")   return b.travelStatus === "ONGOING";
    if (tripFilter === "COMPLETED") return b.travelStatus === "COMPLETED";
    if (tripFilter === "CANCELLED") return b.bookingStatus === "CANCELLED";
    return true;
  });

  // ── Stats ────────────────────────────────────────────────────
  const activeTrips    = bookings.filter(b => b.bookingStatus !== "CANCELLED" && b.travelStatus !== "COMPLETED").length;
  const completedTrips = bookings.filter(b => b.travelStatus === "COMPLETED").length;
  const customTrips    = bookings.filter(b => b.isCustom).length;

  if (loading && allPackages.length === 0 && bookings.length === 0) return (
    <div className="page-loading">
      <div className="spinner" />
      <span>Loading your travel world…</span>
    </div>
  );

  return (
    <div className="dashboard">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1>Explore. Book. <span className="hero-highlight">Wander.</span></h1>
          <p>Hello, <strong>{email?.split("@")[0]}</strong> — where are you headed next?</p>
        </div>
        <div className="dash-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-val">{defaultPackages.length}</span>
            <span className="hero-stat-label">Packages</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-val">{activeTrips}</span>
            <span className="hero-stat-label">Active Trips</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-val">{completedTrips}</span>
            <span className="hero-stat-label">Completed</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-val">{customTrips}</span>
            <span className="hero-stat-label">Custom</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="dash-tabs">
        {[
          { id: "explore", icon: "🌍", label: "Explore Packages",  count: defaultPackages.length },
          { id: "trips",   icon: "✈",  label: "My Trips",          count: bookings.length },
          { id: "custom",  icon: "✨",  label: "Custom Package",    count: null },
        ].map(t => (
          <button
            key={t.id}
            className={`dash-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
            {t.count !== null && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ══ EXPLORE ══ */}
      {tab === "explore" && (
        <>
          <div className="explore-header">
            <p className="explore-subtext">✅ Curated packages crafted by our travel experts — available to all travellers</p>
          </div>

          {/* API error banner */}
          {pkgError && (
            <div className="api-error-banner">
              <span className="api-error-icon">🔌</span>
              <div className="api-error-body">
                <div className="api-error-title">Services Unreachable</div>
                <div className="api-error-msg">{pkgError}</div>
              </div>
              <button className="btn-retry" onClick={fetchAll}>↺ Retry</button>
            </div>
          )}

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search destinations or package types…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
          </div>

          {loading && allPackages.length === 0 && !pkgError
            ? <div className="empty-state"><div className="spinner" /></div>
            : filteredExplore.length === 0
              ? <div className="empty-state">
                  <div className="empty-icon">🗺</div>
                  <div>
                    {pkgError
                      ? "Packages could not be loaded. Check if services are running."
                      : search
                        ? `No packages match "${search}".`
                        : "No packages available yet. Ask an admin to add some!"}
                  </div>
                  {!pkgError && (
                    <button className="btn-retry" onClick={fetchAll}>↺ Refresh</button>
                  )}
                </div>
              : <div className="pkg-grid">
                  {filteredExplore.map(p => (
                    <PackageCard key={p.id} pkg={p} onBook={setSelected} />
                  ))}
                </div>
          }
        </>
      )}

      {/* ══ MY TRIPS ══ */}
      {tab === "trips" && (
        <>
          <div className="trips-header">
            <h2 className="trips-title">My Travel Journal</h2>
            <p className="trips-sub">All trips booked by you — default packages &amp; your custom trips</p>
          </div>

          {/* API error banner */}
          {bookError && (
            <div className="api-error-banner">
              <span className="api-error-icon">🔌</span>
              <div className="api-error-body">
                <div className="api-error-title">Could Not Load Trips</div>
                <div className="api-error-msg">{bookError}</div>
              </div>
              <button className="btn-retry" onClick={fetchAll}>↺ Retry</button>
            </div>
          )}

          {/* Trip status filter pills */}
          <div className="trip-filter-row">
            {[
              { val: "ALL",       label: `All (${bookings.length})` },
              { val: "CONFIRMED", label: `Upcoming (${bookings.filter(b => b.bookingStatus === "CONFIRMED" && b.travelStatus !== "COMPLETED").length})` },
              { val: "ONGOING",   label: `Ongoing (${bookings.filter(b => b.travelStatus === "ONGOING").length})` },
              { val: "COMPLETED", label: `Completed (${bookings.filter(b => b.travelStatus === "COMPLETED").length})` },
              { val: "CANCELLED", label: `Cancelled (${bookings.filter(b => b.bookingStatus === "CANCELLED").length})` },
            ].map(f => (
              <button
                key={f.val}
                className={`filter-pill ${tripFilter === f.val ? "active" : ""}`}
                onClick={() => setTripFilter(f.val)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredTrips.length === 0
            ? <div className="empty-state">
                <div className="empty-icon">✈</div>
                <div>
                  {bookings.length === 0
                    ? "No trips booked yet."
                    : "No trips match this filter."}
                </div>
                {bookings.length === 0 && (
                  <button
                    className="btn-primary mt-16"
                    style={{ width: "auto", padding: "12px 28px" }}
                    onClick={() => setTab("explore")}
                  >
                    Explore Packages
                  </button>
                )}
              </div>
            : <div className="booking-grid">
                {filteredTrips.map(b => (
                  <BookingCard key={b.id} booking={b} onRefresh={fetchAll} onToast={showToast} />
                ))}
              </div>
          }
        </>
      )}

      {/* ══ CUSTOM ══ */}
      {tab === "custom" && (
        <div style={{
          display: "flex", justifyContent: "center",
          padding: "8px 0 32px",
        }}>
          <CustomPackageTab
            email={email}
            onToast={showToast}
            onSwitchToTrips={() => { setTab("trips"); fetchAll(); }}
          />
        </div>
      )}

      {/* ── Booking Modal (for default packages only) ── */}
      {selected && (
        <BookingModal
          pkg={selected}
          email={email}
          onClose={() => setSelected(null)}
          onSuccess={msg => { setSelected(null); showToast(msg); setTab("trips"); fetchAll(); }}
        />
      )}
      
      {/* ── Floating Chat Widget ── */}
      <ChatBox currentUser={email?.split("@")[0]} />
    </div>
  );
}