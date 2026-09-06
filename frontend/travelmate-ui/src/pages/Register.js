import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import logger from "../logger";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(1); // 1 = form, 2 = OTP
  const [data, setData]   = useState({ name: "", email: "", password: "" });
  const [otp,  setOtp]    = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0); // seconds remaining for resend

  /* ── helpers ── */
  const isValidEmail = (email) => {
    // at least 3 chars before @
    const atIdx = email.indexOf("@");
    return atIdx >= 3;
  };

  const isValidName = (name) => /^[a-zA-Z ]+$/.test(name);

  /* ── Step-1: request OTP ── */
  const requestOtp = async () => {
    setError("");
    if (!data.name || !data.email || !data.password) {
      logger.warn("Register", "Registration attempted with missing fields");
      setError("All fields are required.");
      return;
    }
    if (!isValidName(data.name)) {
      setError("Name must contain only alphabets and spaces.");
      return;
    }
    if (!isValidEmail(data.email)) {
      setError("Email must have at least 3 characters before @.");
      return;
    }
    if (data.password.length < 8) {
      logger.warn("Register", "Registration attempted with password shorter than 8 characters");
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    logger.info("Register", `OTP request for email: ${data.email}`);
    try {
      await API.post("/auth/send-otp", { email: data.email, name: data.name, password: data.password });
      setStep(2);
      startCooldown();
    } catch (err) {
      logger.error("Register", "OTP send failed", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step-2: verify OTP & create account ── */
  const verifyAndRegister = async () => {
    setError("");
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }
    setLoading(true);
    logger.info("Register", `OTP verification for email: ${data.email}`);
    try {
      await API.post("/auth/register", { ...data, otp });
      logger.info("Register", `Registration successful for ${data.email}`);
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      logger.error("Register", "Registration failed", err.response?.data || err.message);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP cooldown ── */
  const startCooldown = () => {
    setOtpCooldown(30);
    const interval = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    if (otpCooldown > 0) return;
    setError(""); setOtp("");
    setLoading(true);
    try {
      await API.post("/auth/send-otp", { email: data.email });
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      if (step === 1) requestOtp();
      else verifyAndRegister();
    }
  };

  /* ── Name input handler: allow only alphabets + space ── */
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (/^[a-zA-Z ]*$/.test(val)) {
      setData({ ...data, name: val });
    }
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

        {step === 1 ? (
          <>
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
                onChange={handleNameChange}
                onKeyDown={handleKey}
                autoComplete="name"
              />
              <small style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 4, display: "block" }}>
                Alphabets and spaces only
              </small>
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
              <small style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 4, display: "block" }}>
                At least 3 characters before @
              </small>
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
              onClick={requestOtp}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Sending OTP…
                </span>
              ) : (
                "Get OTP →"
              )}
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Verify OTP</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong style={{ color: "#f59e0b" }}>{data.email}</strong>
            </p>

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

            {/* OTP box */}
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                className="form-input"
                placeholder="6-digit OTP"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={handleKey}
                autoComplete="one-time-code"
                style={{ letterSpacing: "0.3em", fontSize: "1.2rem", textAlign: "center" }}
              />
            </div>

            <button
              className="btn-primary"
              onClick={verifyAndRegister}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Verifying…
                </span>
              ) : (
                "Verify & Create Account →"
              )}
            </button>

            {/* Resend + Back */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button
                style={{
                  background: "none", border: "none", cursor: otpCooldown > 0 ? "default" : "pointer",
                  color: otpCooldown > 0 ? "#64748b" : "#f59e0b",
                  fontSize: "0.85rem", padding: 0, fontFamily: "inherit",
                }}
                onClick={resendOtp}
                disabled={loading || otpCooldown > 0}
              >
                {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : "Resend OTP"}
              </button>
              <button
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", fontSize: "0.85rem", padding: 0, fontFamily: "inherit",
                }}
                onClick={() => { setStep(1); setError(""); setOtp(""); }}
              >
                ← Change details
              </button>
            </div>
          </>
        )}

        <p className="auth-link">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}