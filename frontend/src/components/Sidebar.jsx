import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LayoutList,
  GitBranch,
  Users,
  Truck,
  CreditCard,
  Banknote,
  User,
  Settings,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  UserCheck,
  ChartNoAxesColumn,
  DollarSign,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "POS", path: "/pos", icon: ShoppingCart },
  { name: "Inventory", path: "/inventory", icon: LayoutList },
  { name: "Mutasi Stok", path: "/inventory/mutations", icon: GitBranch },
  { name: "Cabang", path: "/admin/branches", icon: Users },
  { name: "Members", path: "/members", icon: User },
  { name: "Suppliers", path: "/suppliers", icon: Truck },
  { name: "Hutang & Piutang", path: "/debts", icon: CreditCard },
  { name: "Gaji Karyawan", path: "/payroll", icon: Banknote },
  { name: "Absensi", path: "/absensi", icon: UserCheck },
  { name: "CRM", path: "/crm", icon: ChartNoAxesColumn },
  { name: "Keuangan", path: "/finance", icon: DollarSign },
  { name: "Broadcast Promo", path: "/broadcast", icon: MessageCircle },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  return (
    <aside
      className={`relative flex flex-col h-full transition-all duration-300 bg-white border-r border-gray-200 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo / Brand Area */}
      <div
        className={`flex items-center h-16 px-4 border-b border-gray-100 overflow-hidden ${
          isOpen ? "justify-start gap-3" : "justify-center"
        }`}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">UG</span>
        </div>
        <span
          className={`font-semibold text-gray-900 text-sm whitespace-nowrap transition-all duration-200 ${
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          }`}
        >
          UMKM Grow
        </span>
      </div>

      {/* Tombol Panah Floating */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-20 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all duration-200"
        title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-r-full" />
                )}

                {/* Icon */}
                <Icon
                  className={`flex-shrink-0 h-5 w-5 ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  }`}
                />

                {/* Label */}
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${
                    isOpen
                      ? "opacity-100"
                      : "opacity-0 w-0 overflow-hidden pointer-events-none"
                  }`}
                >
                  {item.name}
                </span>
              </Link>

              {/* Tooltip — hanya muncul saat sidebar kolaps */}
              {!isOpen && (
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {item.name}
                  {/* Arrow */}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-100 p-2">
        <div className="relative group">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200`}
          >
            <LogOut className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-rose-500" />
            <span
              className={`whitespace-nowrap transition-all duration-200 ${
                isOpen
                  ? "opacity-100"
                  : "opacity-0 w-0 overflow-hidden pointer-events-none"
              }`}
            >
              Keluar
            </span>
          </button>

          {/* Tooltip logout */}
          {!isOpen && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Keluar
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
