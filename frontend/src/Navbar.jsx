import { Link, useNavigate } from "react-router-dom";
import { useContext, useMemo } from "react";
import BranchContext from "./BranchContext";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { selectedBranch } = useContext(BranchContext);
  const navigate = useNavigate();

  const user = useMemo(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="border-b border-gray-200 bg-white p-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-bold text-lg text-gray-900">
            UMKM Grow
          </Link>
          <nav className="flex items-center gap-3 text-sm text-gray-600">
            <Link to="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/inventory" className="hover:text-gray-900">
              Inventory
            </Link>
            <Link to="/inventory/mutations" className="hover:text-gray-900">
              Mutasi Stok
            </Link>
            <Link to="/admin/branches" className="hover:text-gray-900">
              Cabang
            </Link>
            <Link to="/members" className="hover:text-gray-900">
              Members
            </Link>
            <Link to="/suppliers" className="hover:text-gray-900">
              Suppliers
            </Link>
            <Link to="/debts" className="hover:text-gray-900">
              Hutang & Piutang
            </Link>
            <Link to="/payroll" className="hover:text-gray-900">
              Gaji Karyawan
            </Link>
            <Link to="/settings" className="hover:text-gray-900">
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
            <span className="text-gray-500">Cabang aktif:</span>{" "}
            <span className="font-semibold text-gray-900">
              {selectedBranch?.nama_cabang || "-"}
            </span>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            {user && (
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
