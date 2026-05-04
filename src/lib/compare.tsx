"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface CompareContextType {
  compareIds: number[];
  toggleCompare: (id: number) => void;
  isCompared: (id: number) => boolean;
  clearAll: () => void;
  removeFromCompare: (id: number) => void;
  count: number;
}

const CompareContext = createContext<CompareContextType>({
  compareIds: [],
  toggleCompare: () => {},
  isCompared: () => false,
  clearAll: () => {},
  removeFromCompare: () => {},
  count: 0,
});

const STORAGE_KEY = "npb_compare";
const MAX_COMPARE = 4;

function loadCompare(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => {
    setCompareIds(loadCompare());
  }, []);

  const toggleCompare = useCallback((id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((cid) => cid !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((id: number) => {
    setCompareIds((prev) => {
      const next = prev.filter((cid) => cid !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isCompared = useCallback((id: number) => compareIds.includes(id), [compareIds]);

  const clearAll = useCallback(() => {
    setCompareIds([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }, []);

  return (
    <CompareContext.Provider value={{ compareIds, toggleCompare, isCompared, clearAll, removeFromCompare, count: compareIds.length }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
