import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Notify from "../components/Notification";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react"; // Added imports

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Added state
  const [notify, setNotify] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      login(); 

      setNotify({ type: "success", message: "Login successful!" });

      setTimeout(() => {
        if (user.role === "admin") navigate("/admin");
        else navigate("/generate-quotation");
      }, 800);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Login failed",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-teal-100">
      {notify && (
        <Notify
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}

      <div className="relative w-full max-w-md p-10 overflow-hidden transition bg-white border border-teal-100 shadow-2xl rounded-3xl hover:shadow-teal-500/40">

        <div className="absolute w-56 h-56 bg-teal-500 rounded-full -top-20 -right-20 opacity-20 blur-3xl"></div>
        <div className="absolute w-56 h-56 bg-teal-600 rounded-full -bottom-20 -left-20 opacity-20 blur-3xl"></div>

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 mb-6 text-teal-600 transition border border-teal-500 rounded-xl hover:bg-teal-100"
        >
          ← Back
        </button>

        <form onSubmit={handleSubmit} className="relative z-10">
          <h2 className="mb-8 text-3xl font-extrabold text-center text-teal-900">
            Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 text-gray-800 placeholder-gray-400 bg-white border border-teal-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300"
            required
          />

          <div className="relative mb-3"> {/* Password Wrapper */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 text-gray-800 placeholder-gray-400 bg-white border border-teal-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute text-teal-500 right-3 top-3"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="px-4 py-2 mb-6 text-teal-600 transition border border-teal-500 rounded-xl hover:bg-teal-100"
          >
            Forgot Password?
          </button>

          <button
            type="submit"
            className="
              w-full py-3
              font-semibold text-white
              bg-teal-500 rounded-xl shadow-md
              hover:bg-teal-600 hover:shadow-lg
              transition-all
              transform hover:scale-[1.02]
              active:scale-[0.97]
            "
          >
            Login
          </button>
        </form>

        <style>{`
          input:-webkit-autofill {
            background-color: #ffffff !important;
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            box-shadow: 0 0 0 1000px #ffffff inset !important;
            color: #000 !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;