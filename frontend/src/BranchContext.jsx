import { createContext, useState, useMemo, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BranchContext = createContext({
  branches: [],
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  setBranches: () => {},
  reloadBranches: () => {},
  selectedBranch: null,
});

export function BranchProvider({ children }) {
  const user = useMemo(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const [selectedBranchId, setSelectedBranchIdState] = useState(
    Number(user?.branch_id) || null,
  );
  const [branches, setBranches] = useState([]);

  const setSelectedBranchId = useCallback((branchId) => {
    setSelectedBranchIdState(Number(branchId) || null);
  }, []);

  const reloadBranches = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/branches`);
      const data = await response.json();
      const branchList = Array.isArray(data) ? data : [];
      setBranches(branchList);

      const userBranchId = Number(user?.branch_id) || null;
      if (userBranchId) {
        const hasUserBranch = branchList.some(
          (branch) => Number(branch.id_cabang) === userBranchId,
        );
        setSelectedBranchIdState(hasUserBranch ? userBranchId : null);
        return;
      }

      if (branchList.length > 0) {
        setSelectedBranchIdState((current) => {
          if (
            current &&
            branchList.some(
              (branch) => Number(branch.id_cabang) === Number(current),
            )
          ) {
            return Number(current);
          }
          return Number(branchList[0].id_cabang) || null;
        });
      } else {
        setSelectedBranchIdState(null);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranches([]);
      setSelectedBranchIdState(null);
    }
  }, [user?.branch_id]);

  const selectedBranch = useMemo(
    () =>
      branches.find(
        (branch) => Number(branch.id_cabang) === Number(selectedBranchId),
      ) || null,
    [branches, selectedBranchId],
  );

  const value = useMemo(
    () => ({
      branches,
      selectedBranchId,
      selectedBranch,
      setSelectedBranchId,
      setBranches,
      reloadBranches,
    }),
    [
      branches,
      selectedBranchId,
      selectedBranch,
      setSelectedBranchId,
      reloadBranches,
    ],
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export default BranchContext;
