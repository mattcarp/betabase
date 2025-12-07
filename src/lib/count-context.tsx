"use client";

import React, { createContext, useContext, useState } from "react";

interface CountContextType {
  count: number;
  increment: () => void;
}

const CountContext = createContext<CountContextType | undefined>(undefined);

export function CountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prev) => prev + 1);

  return <CountContext.Provider value={{ count, increment }}>{children}</CountContext.Provider>;
}

export function useCount() {
  const context = useContext(CountContext);
  if (context === undefined) {
    throw new Error("useCount must be used within a CountProvider");
  }
  return context;
}
