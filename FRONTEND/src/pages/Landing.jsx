import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  // Disable scroll for this page (UNCHANGED)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-teal-100">
      <div className="relative w-full max-w-md p-10 overflow-hidden transition bg-white border border-teal-100 shadow-2xl rounded-3xl hover:shadow-teal-500/40">

        {/* Decorative gradients */}
        <div className="absolute w-56 h-56 bg-teal-500 rounded-full -top-20 -right-20 opacity-20 blur-3xl"></div>
        <div className="absolute w-56 h-56 bg-teal-600 rounded-full -bottom-20 -left-20 opacity-20 blur-3xl"></div>

        <h1 className="mb-10 text-4xl font-extrabold tracking-wide text-center text-teal-900">
          Quotation System
        </h1>

        <div className="relative z-10 flex flex-col gap-5">
          <Link
            to="/login"
            className="
              py-3
              font-semibold
              text-center
              text-white
              bg-teal-500
              rounded-2xl
              shadow-lg
              hover:bg-teal-600
              hover:shadow-xl
              transition-all
              transform hover:scale-[1.03]
              active:scale-[0.97]
            "
          >
            Login
          </Link>

          <Link
            to="/register"
            className="
              py-3
              font-semibold
              text-center
              text-teal-600
              bg-teal-100
              rounded-2xl
              shadow
              hover:bg-teal-200
              hover:shadow-lg
              transition-all
              transform hover:scale-[1.03]
              active:scale-[0.97]
            "
          >
            Register
          </Link>
        </div>
      </div>

      <footer className="mt-10 text-sm text-teal-600">
        © {new Date().getFullYear()} Quotation System. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
