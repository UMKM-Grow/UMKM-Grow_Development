import { createContext, useState, useMemo } from 'react';

const BranchContext = createContext({
  branches: [],
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  setBranches: () => {},
});

export function BranchProvider({ children }) {
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [branches, setBranches] = useState([]);

  const value = useMemo(
    () => ({
      branches,
      selectedBranchId,
      setSelectedBranchId,
      setBranches,
    }),
    [branches, selectedBranchId]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export default BranchContext;
