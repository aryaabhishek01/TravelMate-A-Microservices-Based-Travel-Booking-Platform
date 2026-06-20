import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer sessionStorage, fall back to localStorage
  const email   = sessionStorage.getItem("email")   || localStorage.getItem("email")   || "";
  const isAdmin = (sessionStorage.getItem("role")   || localStorage.getItem("role"))   === "ADMIN";

  const logout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const isOnAdmin = location.pathname === "/admin";

  return (
    <nav className="navbar">
      <div
        className="navbar-brand"
        onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
      >
        <span className="brand-icon">✈</span>
        <span className="brand-text">TravelMate</span>
      </div>

      <div className="navbar-center">
        {isAdmin && (
          <>
            <button
              className={`nav-tab ${isOnAdmin ? "active" : ""}`}
              onClick={() => navigate("/admin")}
            >
              <span>⚙</span> Admin Panel
            </button>
            <button
              className={`nav-tab ${!isOnAdmin ? "active" : ""}`}
              onClick={() => navigate("/dashboard")}
            >
              <span>🗺</span> Explore
            </button>
          </>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="user-avatar">
            {email.charAt(0).toUpperCase()}
          </div>
          <span className="navbar-email">
            {email.length > 22 ? email.slice(0, 22) + "…" : email}
          </span>
        </div>
        <button className="navbar-logout" onClick={logout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}