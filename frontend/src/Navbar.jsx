import { Link } from 'react-router-dom';
import { useContext } from 'react';
import BranchContext from './BranchContext';

export default function Navbar() {
  const { branches, selectedBranchId, setSelectedBranchId } = useContext(BranchContext);

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
            <Link to="/admin/branches" className="hover:text-gray-900">
              Cabang
            </Link>
            <Link to="/settings" className="hover:text-gray-900">
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Cabang aktif</label>
          <select
            value={selectedBranchId ?? ''}
            onChange={(event) => setSelectedBranchId(Number(event.target.value) || null)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Pilih Cabang</option>
            {branches.map((branch) => (
              <option key={branch.id_cabang} value={branch.id_cabang}>
                {branch.nama_cabang}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
