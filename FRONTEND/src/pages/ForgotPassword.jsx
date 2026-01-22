import React, { useState } from "react";
import axios from "axios";
import Notification from "../components/Notification";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });

      setNotify({ type: "success", message: "OTP sent to your Gmail!" });

      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 1000);

    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Failed to send OTP",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 font-sans bg-teal-100">
      {notify && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}

      {/* Exact original width max-w-md and padding p-10 */}
      <div className="w-full max-w-md p-10 bg-white border border-teal-100 shadow-2xl rounded-3xl transition-all duration-300 hover:scale-[1.01]">

        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 px-4 py-2 mb-6 font-medium text-teal-600 transition-all border border-teal-500 rounded-xl hover:bg-teal-50 hover:scale-105"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h2 className="mb-2 text-3xl font-extrabold text-center text-teal-900">
          Forgot Password
        </h2>
        <p className="mb-8 text-sm text-center text-teal-600">
          Enter your email to receive a verification code.
        </p>

        <div className="flex flex-col gap-1 mb-6">
          <label className="ml-1 text-xs font-bold text-teal-800 uppercase">Gmail Address</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 text-teal-900 transition-all bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>

        <button
          onClick={handleSendOtp}
          className="w-full py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg hover:bg-teal-600 hover:scale-[1.02] active:scale-[0.97] transition-all"
        >
          Send OTP
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;