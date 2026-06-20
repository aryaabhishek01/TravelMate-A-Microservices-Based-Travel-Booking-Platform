import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/userSlice';
import logger from "../logger";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Removed forgot password states

  const login = async () => {
    if (!data.email || !data.password) {
      // Logger: warn when form is submitted with missing fields
      logger.warn("Login", "Login attempted with missing email or password");
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    // Logger: info when login attempt begins
    logger.info("Login", `Login attempt for email: ${data.email}`);
    try {
      const res = await API.post("/auth/login", data);
      
      const authData = {
        token: res.data.token,
        email: data.email,
        role: res.data.role
      };

      // ── Use sessionStorage so auth data clears when browser closes ──
      sessionStorage.setItem("token", authData.token);
      sessionStorage.setItem("email", authData.email);
      if (authData.role) sessionStorage.setItem("role", authData.role);
      // Keep a localStorage copy for backward-compat with any native reload
      localStorage.setItem("token", authData.token);
      localStorage.setItem("email", authData.email);
      if (authData.role) localStorage.setItem("role", authData.role);

      // Logger: info on successful login and navigation
      logger.info("Login", `Login successful — role: ${authData.role}, navigating to ${authData.role === "ADMIN" ? "/admin" : "/dashboard"}`);

      // Redux
      dispatch(setCredentials(authData));

      if (authData.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      window.location.reload();
    } catch (err) {
      // Logger: error when login API call fails
      logger.error("Login", `Login failed for ${data.email}`, err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") login();
  };

  // Removed forgot password handlers

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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to plan your next adventure</p>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span> {error}
          </div>
        )}

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
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Password</span>
            <Link 
              to="/forgot-password"
              style={{ color: 'var(--accent)', cursor: 'pointer', textTransform: 'none', textDecoration: 'none' }}
            >
              Forgot Password?
            </Link>
          </label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            onKeyDown={handleKey}
            autoComplete="current-password"
          />
        </div>

        <button
          className="btn-primary"
          onClick={login}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="btn-spinner" /> Signing in…
            </span>
          ) : (
            "Sign In →"
          )}
        </button>

        <p className="auth-link">
          New to TravelMate? <Link to="/register">Create an account</Link>
        </p>
      </div>

    </div>
  );
}