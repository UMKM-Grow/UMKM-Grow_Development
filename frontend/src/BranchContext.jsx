import { createContext, useState, useMemo } from 'react';

const BranchContext = createContext({
  selectedBranchId: null,
  setSelectedBranchId: () => {},
});

export function BranchProvider({ children }) {
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const value = useMemo(
    () => ({
      selectedBranchId,
      setSelectedBranchId,
    }),
    [selectedBranchId]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export default BranchContext;
