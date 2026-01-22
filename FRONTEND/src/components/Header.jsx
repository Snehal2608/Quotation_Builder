import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, IndianRupee, FileText, LogOut } from "lucide-react";
import axios from "axios";

const Header = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [adminLogo, setAdminLogo] = useState(null);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  /* =============================
      FETCH ADMIN LOGO (UPDATED)
      ============================= */
  useEffect(() => {
    const fetchAdminLogo = async () => {
      try {
        if (user?.role === "user" && user.adminId) {
          const res = await axios.get(
            `http://localhost:5000/api/auth/admin-logo/${user.adminId}`
          );
          if (res.data.logoBase64) {
            setAdminLogo(res.data.logoBase64);
          }
        } else if (user?.role === "admin" && user.logoBase64) {
          setAdminLogo(user.logoBase64);
        }
      } catch {
        setAdminLogo(null);
      }
    };

    fetchAdminLogo();
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { name: "Generate Quote", path: "/generate-quotation", icon: FileText },
  ];

  if (user?.role === "admin") {
    navItems.push(
      { name: "Manage Rates", path: "/manage-rates", icon: IndianRupee },
      { name: "Admin", path: "/admin", icon: Settings }
    );
  }

  const displayName =
    user?.name || user?.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-teal-100 shadow-md">
      <div className="container flex items-center justify-between px-6 py-3 mx-auto">

        {/* LOGO / TITLE */}
        <Link
          to="/generate-quotation"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          {adminLogo ? (
            <img
              src={adminLogo}
              alt="logo"
              className="object-contain h-12 max-w-[180px]"
            />
          ) : (
            <span className="text-2xl font-extrabold tracking-wide text-teal-900">
              Quotation System
            </span>
          )}
        </Link>

        {/* NAVIGATION */}
        {isLoggedIn && (
          <nav className="flex items-center gap-2 md:gap-4">

            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-4 py-2 text-sm font-medium text-teal-600 transition-all rounded-xl hover:bg-teal-100 hover:text-teal-900"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}

            {/* USER BADGE */}
            <div className="items-center hidden px-4 py-2 bg-teal-100 border border-teal-100 sm:flex rounded-xl">
              <span className="text-sm text-teal-600">
                Welcome{" "}
                <b className="font-semibold text-teal-900">
                  {displayName}
                </b>
              </span>
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                px-4 py-2
                text-sm font-semibold
                text-white
                bg-teal-500
                rounded-xl
                shadow-md
                transition-all
                hover:bg-teal-600
                hover:shadow-lg
                active:scale-[0.97]
              "
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;