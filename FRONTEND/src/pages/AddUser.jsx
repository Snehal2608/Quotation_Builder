import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Notification from "../components/Notification";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const AddUser = () => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notify, setNotify] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const countryCodes = [
    { code: "+91", name: "India" },
    { code: "+1", name: "USA" },
    { code: "+44", name: "UK" },
    { code: "+61", name: "Australia" },
    { code: "+971", name: "UAE" },
    { code: "+974", name: "Qatar" },
    { code: "+966", name: "Saudi Arabia" },
    { code: "+81", name: "Japan" },
    { code: "+65", name: "Singapore" },
    { code: "+60", name: "Malaysia" },
  ];

  const [countryCode, setCountryCode] = useState("+91");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");

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

    const onlyDigits = newUser.phone.replace(/\D/g, "");
    if (onlyDigits.length !== 10) {
      setNotify({ type: "error", message: "Phone number must be exactly 10 digits." });
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(newUser.email.trim())) {
      setNotify({ type: "error", message: "Only Gmail allowed." });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/admin/add-user",
        {
          name: newUser.name,
          email: newUser.email,
          phoneNo: onlyDigits,
          countryCode,
          password: newUser.password,
          role: "user",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotify({ type: "success", message: "User added successfully." });
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Failed to add user",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {notify.message && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify({ type: "", message: "" })}
        />
      )}

      <Header />

      <div className="flex items-start justify-center min-h-[90vh] px-6 pt-12">
        <div className="w-full max-w-lg p-10 bg-white border border-gray-200 rounded-3xl">

          
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-5 py-2.5 mb-8 font-bold text-teal-900 transition border border-gray-200 bg-gray-50 rounded-2xl hover:bg-gray-100 shadow-sm"
          >
            <ArrowLeft size={20} /> Back
          </button>

          <h2 className="mb-8 text-3xl font-extrabold text-center text-teal-900">
            Add New User
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="input-style"
              required
            />

            <input
              type="email"
              placeholder="Email (Gmail only)"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="input-style"
              required
            />

            <div className="flex gap-3">
              <div className="relative w-[42%]">
                <div onClick={() => setOpenDropdown(!openDropdown)} className="country-select">
                  {countryCode} — {countryCodes.find((c) => c.code === countryCode)?.name}
                </div>

                {openDropdown && (
                  <div className="absolute z-50 w-full p-2 mt-1 bg-white border border-gray-200 rounded-xl">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full p-2 mb-2 border border-gray-200 rounded-lg outline-none"
                    />
                    <div className="overflow-y-auto max-h-40">
                      {countryCodes
                        .filter((c) =>
                          `${c.code} ${c.name}`.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((c) => (
                          <div
                            key={c.code}
                            onClick={() => {
                              setCountryCode(c.code);
                              setOpenDropdown(false);
                              setSearch("");
                            }}
                            className="p-2 rounded cursor-pointer hover:bg-gray-100"
                          >
                            {c.code} — {c.name}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Phone"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                className="flex-1 input-style"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full input-style"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute text-teal-900 right-3 top-3"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              className="py-3 mt-2 font-semibold text-white bg-teal-900 rounded-xl hover:bg-teal-800"
            >
              Add User
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .input-style {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          font-size: 15px;
          outline: none;
        }
        .input-style:focus {
          border-color: #134e4a;
        }
        .country-select {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          background: white;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};

export default AddUser;
