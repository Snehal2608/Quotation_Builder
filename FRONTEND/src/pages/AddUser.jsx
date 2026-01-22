import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Notification from "../components/Notification";
import { Eye, EyeOff } from "lucide-react"; // Added imports

const AddUser = () => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false); // Added state

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
    { code: "+93", name: "Afghanistan" },
    { code: "+355", name: "Albania" },
    { code: "+213", name: "Algeria" },
    { code: "+54", name: "Argentina" },
    { code: "+43", name: "Austria" },
    { code: "+32", name: "Belgium" },
    { code: "+55", name: "Brazil" },
    { code: "+56", name: "Chile" },
    { code: "+86", name: "China" },
    { code: "+57", name: "Colombia" },
    { code: "+420", name: "Czech Republic" },
    { code: "+45", name: "Denmark" },
    { code: "+20", name: "Egypt" },
    { code: "+358", name: "Finland" },
    { code: "+33", name: "France" },
    { code: "+49", name: "Germany" },
    { code: "+30", name: "Greece" },
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
      setNotify({
        type: "error",
        message: "Phone number must be exactly 10 digits.",
      });
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

      setNotify({
        type: "success",
        message: "User added successfully.",
      });

      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.response?.data?.message || "Failed to add user",
      });
    }
  };

  return (
    <div className="min-h-screen bg-teal-100">
      {notify.message && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify({ type: "", message: "" })}
        />
      )}

      <Header />

      <div className="flex items-start justify-center min-h-[90vh] px-6 pt-12">
        <div className="w-full max-w-lg p-10 transition-all bg-white border border-teal-100 shadow-2xl rounded-3xl hover:shadow-teal-500/40">

          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 mb-6 text-teal-600 transition border border-teal-500 rounded-xl hover:bg-teal-100"
          >
            ← Back
          </button>

          <h2 className="mb-8 text-3xl font-extrabold text-center text-teal-900">
            Add New User
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) =>
                setNewUser({ ...newUser, name: e.target.value })
              }
              className="input-style"
              required
            />

            <input
              type="email"
              placeholder="Email (Gmail only)"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className="input-style"
              required
            />

            <div className="flex gap-3">
              <div className="relative w-[42%]">
                <div
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="country-select"
                >
                  {countryCode} —{" "}
                  {countryCodes.find((c) => c.code === countryCode)?.name}
                </div>

                {openDropdown && (
                  <div className="absolute z-50 w-full p-2 mt-1 bg-white border shadow rounded-xl">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full p-2 mb-2 border rounded-lg"
                    />
                    <div className="overflow-y-auto max-h-40">
                      {countryCodes
                        .filter((c) =>
                          `${c.code} ${c.name}`
                            .toLowerCase()
                            .includes(search.toLowerCase())
                        )
                        .map((c) => (
                          <div
                            key={c.code}
                            onClick={() => {
                              setCountryCode(c.code);
                              setOpenDropdown(false);
                              setSearch("");
                            }}
                            className="p-2 rounded cursor-pointer hover:bg-teal-100"
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

            <div className="relative"> {/* Password Wrapper */}
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="w-full input-style"
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
              type="submit"
              className="py-3 mt-2 font-semibold text-white transition-all bg-teal-500 shadow-md rounded-xl hover:bg-teal-600 hover:shadow-lg"
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
          border: 1px solid #5eead4;
          font-size: 15px;
          transition: 0.2s;
        }
        .input-style:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 2px rgba(20,184,166,0.2);
          outline: none;
        }
        .country-select {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #5eead4;
          cursor: pointer;
          background: white;
        }
      `}</style>
    </div>
  );
};

export default AddUser;