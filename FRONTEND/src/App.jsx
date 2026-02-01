import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components & Layout
import Header from "./components/Header";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import Admin from "./pages/Admin";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import GenerateQuotation from "./pages/GenerateQuotation";
import ManageRates from "./pages/ManageRates";
import AdminMessages from "./pages/AdminMessages";
import AdminQuotationNotifications from "./pages/AdminQuotationNotifications";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { QuoteProvider } from "./context/QuoteContext";

// --- HELPERS ---
const getRole = () => {
  try {
    const user = localStorage.getItem("user");
    if (user) return JSON.parse(user).role;
    return null;
  } catch {
    return null;
  }
};

function App() {
  const PrivateRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem("token");
    const userRole = getRole();

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // ✅ SAME bg-gray-100 for header + page (NO WHITE STRIP)
  const WithHeader = ({ children }) => (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="pt-6 bg-gray-100">{children}</main>
    </div>
  );

  return (
    <AuthProvider>
      <QuoteProvider>
        <Router>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />

            {/* RECOVERY */}
            <Route path="/verify-email/:userId/:choice" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <WithHeader>
                    <Admin />
                  </WithHeader>
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/add-user"
              element={
                <PrivateRoute requiredRole="admin">
                  <AddUser />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/edit/:id"
              element={
                <PrivateRoute requiredRole="admin">
                  <WithHeader>
                    <EditUser />
                  </WithHeader>
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/messages"
              element={
                <PrivateRoute requiredRole="admin">
                  <WithHeader>
                    <AdminMessages />
                  </WithHeader>
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/quotations"
              element={
                <PrivateRoute requiredRole="admin">
                  <WithHeader>
                    <AdminQuotationNotifications />
                  </WithHeader>
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/manage-rates"
              element={
                <PrivateRoute requiredRole="admin">
                  <WithHeader>
                    <ManageRates />
                  </WithHeader>
                </PrivateRoute>
              }
            />

            {/* USER */}
            <Route
              path="/generate-quotation"
              element={
                <PrivateRoute>
                  <WithHeader>
                    <GenerateQuotation />
                  </WithHeader>
                </PrivateRoute>
              }
            />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QuoteProvider>
    </AuthProvider>
  );
}

export default App;
