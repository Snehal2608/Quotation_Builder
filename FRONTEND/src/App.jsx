import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components & Layout
import Header from "./components/Header";
import Notify from "./components/Notification";

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
import { AuthProvider } from "./context/AuthContext"; // Added AuthProvider import
import { RateProvider } from "./context/RateContext";
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
  const [notify, setNotify] = useState(null);

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

  const WithHeader = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
    </div>
  );

  return (
    <AuthProvider> {/* Wrapped with AuthProvider */}
      <RateProvider>
        <QuoteProvider>

          {notify && (
            <Notify
              type={notify.type}
              message={notify.message}
              onClose={() => setNotify(null)}
            />
          )}

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
                path="/manage-rates"
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
      </RateProvider>
    </AuthProvider>
  );
}

export default App;