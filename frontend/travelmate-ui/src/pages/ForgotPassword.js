import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError("Email is required");
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/auth/forgot-password", { email });
      setStep(2);
      setSuccess("OTP sent successfully to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setError("OTP is required");
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await API.post("/auth/validate-otp", { email, otp });
      if (res.data.isValid) {
        setStep(3);
        setSuccess("OTP verified successfully. Please set a new password.");
      } else {
        setError("Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to validate OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/auth/reset-password", { 
        email, 
        otp, 
        newPassword 
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
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

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          {step === 1 && "Enter your email to receive an OTP"}
          {step === 2 && "Enter the OTP sent to your email"}
          {step === 3 && "Create a new, strong password"}
        </p>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid #28a745', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="alert-icon">✔</span> {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Sending…
                </span>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleValidateOtp}>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                className="form-input"
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Verifying…
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Resetting…
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
