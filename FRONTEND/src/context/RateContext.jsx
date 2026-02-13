import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RateContext = createContext();

export const useRates = () => useContext(RateContext);

export const RateProvider = ({ children }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated;

  // useCallback ensures the function reference doesn't change on every render
  const fetchRates = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setRates([]);
      setError("User not logged in");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/rates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRates(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rates:", err);

      if (err.response?.status === 403) {
        setError("Access denied. Please log in again.");
      } else {
        setError("Failed to fetch rates");
      }

      setRates([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty array means this function is created only once on mount

  // Automatically fetch rates when authentication status changes
  useEffect(() => {
    if (!isAuthenticated) {
      setRates([]);
      setLoading(false);
      return;
    }

    fetchRates();
  }, [isAuthenticated, fetchRates]); // Added fetchRates as a stable dependency

  return (
    <RateContext.Provider
      value={{
        rates,
        loading,
        error,
        fetchRates,
      }}
    >
      {children}
    </RateContext.Provider>
  );
};