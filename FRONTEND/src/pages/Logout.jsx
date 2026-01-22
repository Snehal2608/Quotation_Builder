import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuote } from "../context/QuoteContext";

const Logout = () => {
  const navigate = useNavigate();
  const { resetQuote } = useQuote();

  useEffect(() => {
    // 🔥 CLEAR QUOTATION DATA (SAFE GUARD)
    if (resetQuote) resetQuote();

    // Clear Auth Data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login
    navigate("/login");
  }, [navigate, resetQuote]);

  return null;
};

export default Logout;
