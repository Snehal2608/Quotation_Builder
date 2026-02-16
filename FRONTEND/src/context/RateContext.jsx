import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RateContext = createContext();
export const useRates = () => useContext(RateContext);

export const RateProvider = ({ children }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, logout } = useAuth() || {}; // Assuming your AuthContext has a logout function

  const fetchRates = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/rates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Sync Error:", err.message);
      
      // If server says 403, the session is likely dead
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.warn("Session expired. Please log in again.");
        // Optional: logout(); 
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchRates();
  }, [isAuthenticated, fetchRates]);

  return (
    <RateContext.Provider value={{ rates, loading, fetchRates }}>
      {children}
    </RateContext.Provider>
  );
};