import { Link } from 'react-router-dom';

export default function Finance() {
  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Keuangan</h1>
        <p className="text-sm text-gray-500">Pilih modul keuangan yang ingin dikelola.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Link
          to="/finance/expenses"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 hover:bg-blue-50 transition duration-150 group"
        >
          <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition duration-150">
            Pengeluaran Operasional
          </div>
          <p className="mt-1 text-xs text-gray-500">Catat dan kelola pengeluaran harian toko</p>
        </Link>
        <Link
          to="/finance/reports"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 hover:bg-blue-50 transition duration-150 group"
        >
          <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition duration-150">
            Financial Reports
          </div>
          <p className="mt-1 text-xs text-gray-500">Laporan keuangan dan analisis performa</p>
        </Link>
      </div>
    </div>
  );
}
