import React, { useState } from "react";
import axios from "axios";
import Notification from "../components/Notification";
import { useLocation, useNavigate } from "react-router-dom";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [notify, setNotify] = useState(null);
  const { state } = useLocation();
  const email = state?.email;
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", { email, otp });

      setNotify({ type: "success", message: "OTP verified!" });

      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 800);

    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Invalid OTP",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-teal-100">
      {notify && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}

      <div className="w-full max-w-md p-10 bg-white border border-teal-100 shadow-2xl rounded-3xl">

        <button
          onClick={() => navigate("/forgot-password")}
          className="px-4 py-2 mb-6 text-teal-600 transition-all border border-teal-500 rounded-xl hover:bg-teal-100 hover:scale-105"
        >
          ← Back
        </button>

        <h2 className="mb-6 text-3xl font-extrabold text-center text-teal-900">
          Verify OTP
        </h2>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-4 mb-5 border border-teal-200 rounded-xl bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />

        <button
          onClick={handleVerify}
          className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 hover:scale-[1.02] active:scale-[0.97] transition-all"
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
