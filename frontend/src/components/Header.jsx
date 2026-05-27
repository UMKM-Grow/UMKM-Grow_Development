import { useContext } from "react";
import BranchContext from "../BranchContext";
import { LogOut } from "lucide-react";

export default function Header() {
  const { selectedBranch } = useContext(BranchContext);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="border-b border-gray-200 bg-white p-4 shadow-sm flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Cabang aktif: <span className="font-medium">{selectedBranch?.nama_cabang || "-"}</span>
      </div>
      <div className="flex items-center gap-4">
        {user.name ? (
          <>
            <div className="text-right text-sm">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}