import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Notification from "../components/Notification";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notify, setNotify] = useState({ type: "", message: "" });
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+91",
  });

  const token = localStorage.getItem("token");

  const countryCodes = [
    { code: "+91", name: "India" },
    { code: "+1", name: "USA" },
    { code: "+44", name: "UK" },
    { code: "+61", name: "Australia" },
    { code: "+971", name: "UAE" },
    { code: "+974", name: "Qatar" },
    { code: "+966", name: "Saudi Arabia" },
    { code: "+65", name: "Singapore" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/admin/single-user/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const u = res.data;
        const digits = u.phoneNo.replace(/\D/g, "");
        const local = digits.slice(-10);
        const country = "+" + digits.slice(0, digits.length - 10);

        setUserData({
          name: u.name,
          email: u.email,
          phone: local,
          countryCode: country || "+91",
        });
      } catch (err) {
        setNotify({ type: "error", message: "Error loading user data" });
      }
    };
    fetchUser();
  }, [id, token]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(userData.email.trim())) {
        setNotify({ type: "error", message: "Only Gmail allowed" });
        return;
      }

      const onlyDigits = userData.phone.replace(/\D/g, "");
      if (onlyDigits.length !== 10) {
        setNotify({ type: "error", message: "Phone must be 10 digits" });
        return;
      }

      await axios.put(
        `http://localhost:5000/api/admin/edit-user/${id}`,
        {
          name: userData.name,
          email: userData.email,
          phoneNo: onlyDigits,
          countryCode: userData.countryCode,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotify({ type: "success", message: "User updated successfully!" });
      setTimeout(() => navigate("/admin"), 1200);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Update failed",
      });
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen px-6 pt-10 bg-teal-100">
      {notify.message && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify({ type: "", message: "" })}
        />
      )}

      {/* Box size kept exactly as original (max-w-lg and rounded-3xl) */}
      <div
        className="w-full max-w-lg p-10 bg-white rounded-3xl shadow-2xl border border-teal-100 
                   transition-all duration-300 hover:shadow-teal-500/40 hover:scale-[1.01]"
      >
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 px-4 py-2 mb-6 text-teal-600 transition-all border border-teal-500 rounded-xl hover:bg-teal-100"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h2 className="mb-6 text-3xl font-extrabold tracking-wide text-center text-teal-900">
          Edit User
        </h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <input
            type="text"
            placeholder="Full Name"
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            className="bg-white input-style"
            required
          />

          <input
            type="email"
            placeholder="Email (Gmail only)"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            className="bg-white input-style"
            required
          />

          <div className="flex w-full gap-3">
            <select
              value={userData.countryCode}
              onChange={(e) => setUserData({ ...userData, countryCode: e.target.value })}
              className="w-[40%] p-3 border border-teal-200 rounded-xl outline-none focus:border-teal-500"
            >
              {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Phone"
              value={userData.phone}
              maxLength={10}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  phone: e.target.value.replace(/\D/g, ""),
                })
              }
              className="flex-1 bg-white input-style"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 text-white bg-teal-500 rounded-2xl font-semibold 
                       shadow-lg hover:bg-teal-600 hover:scale-[1.02] active:scale-[0.97] 
                       transition-all duration-300"
          >
            Save Changes
          </button>
        </form>
      </div>

      <style>{`
        .input-style {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #5eead4;
          font-size: 15px;
          transition: 0.2s;
          outline: none;
        }
        .input-style:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 10px rgba(20, 184, 166, 0.35);
        }
      `}</style>
    </div>
  );
};

export default EditUser;