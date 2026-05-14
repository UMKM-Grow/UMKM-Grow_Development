import { createContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BranchContext = createContext({
  branches: [],
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  reloadBranches: () => {},
});

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const saved = localStorage.getItem('selectedBranchId');
    return saved ? Number(saved) : null;
  });

  const loadBranches = async () => {
    try {
      const response = await fetch(`${API_BASE}/branches`);
      const data = await response.json();
      setBranches(data);
      if (!selectedBranchId && data.length > 0) {
        setSelectedBranchId(data[0].id_cabang);
      }
    } catch (error) {
      console.error('Failed to load branches', error);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId !== null) {
      localStorage.setItem('selectedBranchId', String(selectedBranchId));
    } else {
      localStorage.removeItem('selectedBranchId');
    }
  }, [selectedBranchId]);

  return (
    <BranchContext.Provider
      value={{ branches, selectedBranchId, setSelectedBranchId, reloadBranches: loadBranches }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export default BranchContext;
