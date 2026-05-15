import { createElement, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Building2, ClipboardList, CreditCard, LogOut, Settings, ShoppingCart, Users, Wallet, Truck } from 'lucide-react';
import BestSellerCard from './BestSellerCard';

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

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <BestSellerCard />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {menu.map(({ to, title, desc, Icon, highlight }) => (
                <Link
                  key={to}
                  to={to}
                  className={[
                    'rounded-[24px] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                    highlight
                      ? 'border-brand-200 ring-1 ring-brand-100 bg-brand-50/70 hover:bg-brand-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        'flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm',
                        highlight ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      {createElement(Icon, { size: 18 })}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{title}</div>
                      <div className="mt-1 text-sm text-slate-500">{desc}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
