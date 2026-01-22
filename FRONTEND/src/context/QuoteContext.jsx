import React, { createContext, useContext, useEffect, useState } from "react";

const QuoteContext = createContext();

export const QuoteProvider = ({ children }) => {
  const [quoteItems, setQuoteItems] = useState([]);

  // ✅ LOAD QUOTE FROM localStorage ON FIRST LOAD
  useEffect(() => {
    const saved = localStorage.getItem("quote");
    if (saved) {
      setQuoteItems(JSON.parse(saved));
    }
  }, []);

  // ✅ SAVE QUOTE TO localStorage ON CHANGE
  useEffect(() => {
    localStorage.setItem("quote", JSON.stringify(quoteItems));
  }, [quoteItems]);

  const addItem = (item) => {
    setQuoteItems((prev) => [...prev, item]);
  };

  const resetQuote = () => {
    setQuoteItems([]);
    localStorage.removeItem("quote"); // ✅ clear storage on reset
  };

  return (
    <QuoteContext.Provider
      value={{
        quoteItems,
        addItem,
        resetQuote,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => useContext(QuoteContext);
