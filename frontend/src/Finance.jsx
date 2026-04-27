import { Link } from 'react-router-dom';

export default function Finance() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Keuangan</h1>
            <div className="mt-1 text-sm text-gray-500">Pilih modul yang ingin dikelola</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/finance/expenses"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Pengeluaran Operasional
            </Link>
            <Link
              to="/finance/reports"
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Financial Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
