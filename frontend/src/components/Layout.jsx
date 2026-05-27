import { useState, useContext, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BranchContext from "./BranchContext";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { reloadBranches } = useContext(BranchContext);

  useEffect(() => {
    reloadBranches();
  }, [reloadBranches]);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800">
      {/* Sidebar Kiri */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Area Konten Kanan */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}