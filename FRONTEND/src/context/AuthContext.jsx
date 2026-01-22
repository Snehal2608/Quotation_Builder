import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ SAFE VERSION: Prevents app crash if used outside provider
export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    return {
      isAuthenticated: false,
      login: () => {},
      logout: () => {},
    };
  }

  return ctx;
};