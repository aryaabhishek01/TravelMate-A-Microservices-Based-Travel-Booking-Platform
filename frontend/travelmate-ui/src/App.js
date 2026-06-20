import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import "./index.css";

function ProtectedRoute({ children }) {
  // Check sessionStorage first, fall back to localStorage
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

// Silently redirects Razorpay tracker URLs and any other unmatched paths
function CatchAll() {
  const location = useLocation();
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  // Suppress console noise for known Razorpay tracker paths
  if (location.pathname.startsWith("/hybridaction")) {
    return null; // render nothing, no navigation
  }
  return <Navigate to={token ? "/dashboard" : "/"} replace />;
}

function App() {
  const isLoggedIn = !!(sessionStorage.getItem("token") || localStorage.getItem("token"));

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Catch-all: redirect tracker/unknown paths back to the right place */}
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;