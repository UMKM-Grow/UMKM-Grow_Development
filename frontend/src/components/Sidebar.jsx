import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Dashboard,
  Inventory,
  GitBranch,
  Users,
  Truck,
  CreditCard,
  MoneyCheck,
  User,
  Settings,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: Dashboard },
  { name: "Inventory", path: "/inventory", icon: Inventory },
  { name: "Mutasi Stok", path: "/inventory/mutations", icon: GitBranch },
  { name: "Cabang", path: "/admin/branches", icon: Users },
  { name: "Members", path: "/members", icon: User },
  { name: "Suppliers", path: "/suppliers", icon: Truck },
  { name: "Hutang & Piutang", path: "/debts", icon: CreditCard },
  { name: "Gaji Karyawan", path: "/payroll", icon: MoneyCheck },
  { name: "Broadcast Promo", path: "/broadcast", icon: MessageCircle },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <aside className={`flex flex-col h-full transition-all duration-300 w-64 bg-white border-r border-gray-200 ${
      !isOpen ? "w-20" : ""
    }`}>
      {/* Tombol Panah Floating */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors duration-200 z-10"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Menu */}
      <nav className="flex-1 flex-col pt-16 space-y-1 px-3">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex w-items-center pr-4 ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-gray-50 text-gray-700"
              } rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 group`}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <item.icon className={`h-5 w-5 ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  } flex-shrink-0`} />
                )}
                {/* Menu Text */}
                <div className={`whitespace-nowrap transition-all duration-200 ${
                  !isOpen && !isHovered
                    ? "opacity-0 pointer-events-none absolute"
                    : ""
                }`}>
                  {item.name}
                </div>
                {/* Tooltip */}
                {!isOpen && (
                  <div className="absolute left-14 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </div>
              {/* Active Indicator */}
              {isOpen && isActive && (
                <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button at bottom */}
      <div className="mt-auto pb-4">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className={`flex w-items-center pr-4 hover:bg-gray-50 text-gray-700 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 group`}
          onMouseEnter={() => setHoveredItem("logout")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-gray-500 flex-shrink-0" />
            {/* Menu Text */}
            <div className={`whitespace-nowrap transition-all duration-200 ${
              !isOpen && !hoveredItem === "logout"
                ? "opacity-0 pointer-events-none absolute"
                : ""
            }`}>
              Keluar
            </div>
            {/* Tooltip */}
            {!isOpen && hoveredItem === "logout" && (
              <div className="absolute left-14 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                Keluar
              </div>
            )}
          </div>
        </button>
      </div>
    </aside>
  );
}