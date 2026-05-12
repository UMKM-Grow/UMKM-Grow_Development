import { createElement, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Building2, ClipboardList, CreditCard, LogOut, Settings, ShoppingCart, Users, Wallet, Truck } from 'lucide-react';

function readUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => readUser(), []);

  const menu = useMemo(
    () => [
      {
        to: '/pos',
        title: 'Kasir (POS)',
        desc: 'Transaksi penjualan & checkout',
        Icon: ShoppingCart,
      },
      {
        to: '/inventory',
        title: 'Inventory',
        desc: 'Produk & stok',
        Icon: Boxes,
      },
      {
        to: '/crm',
        title: 'CRM',
        desc: 'Pelanggan & relasi',
        Icon: Users,
      },
      {
        to: '/finance',
        title: 'Keuangan',
        desc: 'Modul manajemen keuangan',
        Icon: Wallet,
      },
      {
        to: '/suppliers',
        title: 'Manajemen Pemasok',
        desc: 'Data supplier & riwayat PO',
        Icon: Truck,
      },
      {
        to: '/finance/expenses',
        title: 'Operational Expenses',
        desc: 'Catat pengeluaran operasional',
        Icon: CreditCard,
        highlight: true,
      },
      {
        to: '/absensi',
        title: 'Absensi',
        desc: 'Check-in/out & riwayat',
        Icon: ClipboardList,
      },
      {
        to: '/hrm',
        title: 'HRM',
        desc: 'Manajemen karyawan',
        Icon: Building2,
      },
      {
        to: '/settings',
        title: 'Settings',
        desc: 'Pengaturan aplikasi',
        Icon: Settings,
      },
    ],
    []
  );

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">Menu Fitur</h1>
              <div className="mt-1 text-sm text-gray-500">
                {user?.name ? `Halo, ${user.name}. Pilih modul untuk mulai bekerja.` : 'Pilih modul untuk mulai bekerja.'}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menu.map(({ to, title, desc, Icon, highlight }) => (
              <Link
                key={to}
                to={to}
                className={[
                  'rounded-lg border bg-white p-5 transition-colors',
                  highlight ? 'border-blue-200 ring-1 ring-blue-100 hover:bg-blue-50/30' : 'border-gray-200 hover:bg-gray-50',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-md',
                      highlight ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
                    ].join(' ')}
                  >
                    {createElement(Icon, { size: 18 })}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900">{title}</div>
                    <div className="mt-1 text-sm text-gray-500">{desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
