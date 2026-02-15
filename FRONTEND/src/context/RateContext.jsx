import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RateContext = createContext();
export const useRates = () => useContext(RateContext);

export const RateProvider = ({ children }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth() || {};

  const fetchRates = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/rates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Always ensure rates is an array to prevent crashes
      setRates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching rates:", err);
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