import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import logger from "../logger";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!data.name || !data.email || !data.password) {
      // Logger: warn on incomplete form submission
      logger.warn("Register", "Registration attempted with missing fields");
      setError("All fields are required.");
      return;
    }
    if (data.password.length < 8) {
      // Logger: warn on short password
      logger.warn("Register", "Registration attempted with password shorter than 8 characters");
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    // Logger: info when registration call is initiated
    logger.info("Register", `Registration attempt for email: ${data.email}`);
    try {
      await API.post("/auth/register", data);
      // Logger: info on successful registration
      logger.info("Register", `Registration successful for ${data.email} — redirecting to login`);
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      // Logger: error when registration fails
      logger.error("Register", `Registration failed for ${data.email}`, err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") register();
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-plane">✈</span>
          <span>TravelMate</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start exploring the world with us</p>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span> {success}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            placeholder="John Doe"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            onKeyDown={handleKey}
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            onKeyDown={handleKey}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Min. 8 characters"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            onKeyDown={handleKey}
            autoComplete="new-password"
          />
        </div>

        <button
          className="btn-primary"
          onClick={register}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="btn-spinner" /> Creating account…
            </span>
          ) : (
            "Create Account →"
          )}
        </button>

        <p className="auth-link">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}