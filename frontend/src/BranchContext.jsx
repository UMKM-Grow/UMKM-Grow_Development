import { createContext, useState, useMemo, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BranchContext = createContext({
  branches: [],
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  setBranches: () => {},
  reloadBranches: () => {},
});

export function BranchProvider({ children }) {
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [branches, setBranches] = useState([]);

  const reloadBranches = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/branches`);
      const data = await response.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    }
  }, []);

  const value = useMemo(
    () => ({
      branches,
      selectedBranchId,
      setSelectedBranchId,
      setBranches,
      reloadBranches,
    }),
    [branches, selectedBranchId, reloadBranches]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export default BranchContext;
