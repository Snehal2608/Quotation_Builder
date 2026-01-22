import React, { useState, useEffect } from "react";
import axios from "axios";
import Notification from "../components/Notification";
import { useNavigate } from "react-router-dom";
import { fileToBase64 } from "../utils/fileToBase64";
import { Eye, EyeOff } from "lucide-react"; // Added imports

const Register = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Added state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [notify, setNotify] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const countryCodes = [
    { code: "+91", name: "India" },
    { code: "+1", name: "USA / Canada" },
    { code: "+44", name: "United Kingdom" },
    { code: "+61", name: "Australia" },
    { code: "+971", name: "UAE" },
    { code: "+65", name: "Singapore" },
    { code: "+81", name: "Japan" },
    { code: "+49", name: "Germany" },
    { code: "+33", name: "France" },
  ];

  const [countryCode, setCountryCode] = useState("+91");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (!logoFile) return setLogoPreview(null);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(logoFile);
  }, [logoFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let logoBase64 = null;
      if (logoFile) {
        logoBase64 = await fileToBase64(logoFile);
      }

      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        phoneNo: phone,
        countryCode,
        logoBase64,
      });

      setNotify({
        type: "success",
        message: "Admin registered successfully!",
      });

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Registration failed",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-teal-100">
      {notify.message && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify({ type: "", message: "" })}
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

        <h2 className="mb-8 text-3xl font-extrabold text-center text-teal-900">
          Register Admin
        </h2>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-teal-200 rounded-xl bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
            required
          />

          <div className="flex gap-3">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-[40%] p-3 border border-teal-200 rounded-xl bg-teal-50 focus:outline-none"
            >
              {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="flex-1 p-3 border border-teal-200 rounded-xl bg-teal-50 focus:outline-none"
              required
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-teal-200 rounded-xl bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
            required
          />

          <div className="relative"> {/* Password Wrapper */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-teal-200 rounded-xl bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
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

          <div>
            <label className="block mb-1 text-sm font-medium text-teal-700">
              Upload Logo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full p-2 border border-teal-200 rounded-lg"
            />

            {logoPreview && (
              <img
                src={logoPreview}
                alt="logo preview"
                className="object-contain w-24 h-24 p-1 mt-2 border border-teal-200 rounded-lg"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 text-lg font-semibold text-white transition bg-teal-500 shadow-md rounded-xl hover:bg-teal-600"
          >
            Register Admin
          </button>

          <p className="mt-4 text-sm text-center text-teal-600">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-teal-600 cursor-pointer hover:underline"
            >
              Login here
            </span>
          </p>
        </form>

        <style>{`
          input:-webkit-autofill {
            background-color: #f0fdfa !important;
            -webkit-box-shadow: 0 0 0 1000px #f0fdfa inset !important;
            box-shadow: 0 0 0 1000px #f0fdfa inset !important;
            color: #000 !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Register;