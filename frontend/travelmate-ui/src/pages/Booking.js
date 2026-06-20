import { useState } from "react";
import API from "../services/api";

export default function Booking() {
  const [data, setData] = useState({
    userEmail: "",
    destination: "",
    days: 5,
    people: 2,
    totalAmount: 10000,
    fullPayment: false
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const bookTrip = async () => {
    setError("");
    setSuccess("");
    try {
      await API.post("/booking/create", data);
      setSuccess("Booking Done");
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: 20 }}>Book Trip</h2>
      {error && (
        <div className="alert alert-error mb-16">
          <span className="alert-icon">⚠</span> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-16">
          <span className="alert-icon">✓</span> {success}
        </div>
      )}
      <div className="form-group">
        <input 
          className="form-input" 
          placeholder="Email" 
          onChange={(e)=>setData({...data,userEmail:e.target.value})} 
        />
      </div>
      <div className="form-group">
        <input 
          className="form-input" 
          placeholder="Destination" 
          onChange={(e)=>setData({...data,destination:e.target.value})} 
        />
      </div>
      <button className="btn-primary" onClick={bookTrip}>Book</button>
    </div>
  );
}