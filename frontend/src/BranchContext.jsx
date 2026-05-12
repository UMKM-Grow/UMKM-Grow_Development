import { createContext, useEffect, useState } from 'react';

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
      const response = await fetch('http://localhost:4000/api/branches');
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
