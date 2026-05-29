import { createElement, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  GitBranch,
  MessageCircle,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Banknote,
  UserCheck,
  ChartNoAxesColumn,
} from "lucide-react";
import BestSellerCard from "./BestSellerCard";
import LowStockAlert from "./LowStockAlert";

function readUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const user = useMemo(() => readUser(), []);

  const menu = useMemo(
    () => [
      { to: "/pos", title: "Kasir (POS)", desc: "Transaksi penjualan & checkout", Icon: ShoppingCart },
      { to: "/inventory", title: "Inventory", desc: "Produk & stok", Icon: Boxes },
      { to: "/inventory/mutations", title: "Mutasi Stok", desc: "Transfer stok antar cabang", Icon: GitBranch },
      { to: "/admin/branches", title: "Cabang", desc: "Manajemen cabang toko", Icon: Users },
      { to: "/members", title: "Members", desc: "Loyalitas & poin member", Icon: UserCheck },
      { to: "/suppliers", title: "Suppliers", desc: "Manajemen supplier", Icon: Truck },
      { to: "/debts", title: "Hutang & Piutang", desc: "Kewajiban & piutang toko", Icon: CreditCard },
      { to: "/payroll", title: "Gaji Karyawan", desc: "Penggajian & bonus", Icon: Banknote },
      { to: "/absensi", title: "Absensi", desc: "Check-in/out & riwayat", Icon: ClipboardList },
      { to: "/crm", title: "CRM", desc: "Pelanggan & relasi", Icon: ChartNoAxesColumn },
      { to: "/finance", title: "Keuangan", desc: "Modul manajemen keuangan", Icon: Wallet },
      { to: "/broadcast", title: "Broadcast Promo", desc: "Kirim promo via WhatsApp", Icon: MessageCircle },
      { to: "/hrm", title: "HRM", desc: "Manajemen karyawan", Icon: Building2 },
      { to: "/settings", title: "Settings", desc: "Pengaturan aplikasi", Icon: Settings },
    ],
    [],
  );

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {user?.name
            ? `Halo, ${user.name}. Pilih modul untuk mulai bekerja.`
            : "Pilih modul untuk mulai bekerja."}
        </p>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 mb-6">
        <LowStockAlert />
        <BestSellerCard />
      </div>

      {/* Feature Menu Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu Fitur</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {menu.map(({ to, title, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center hover:bg-blue-50 hover:border-blue-200 transition duration-150 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm group-hover:bg-blue-600 group-hover:border-blue-600 transition duration-150">
                {createElement(Icon, { size: 18, className: "text-gray-500 group-hover:text-white transition duration-150" })}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-800 leading-tight">{title}</div>
                <div className="mt-0.5 text-[10px] text-gray-500 leading-tight hidden sm:block">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
