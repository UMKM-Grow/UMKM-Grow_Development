import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, Users, LayoutDashboard, DollarSign, Activity } from 'lucide-react';

const Dashboard = () => {
  const modules = [
    { name: 'Katalog Produk', path: '/inventory', icon: <Package size={24} />, color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Manajemen Pemasok', path: '/suppliers', icon: <Truck size={24} />, color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Keuangan', path: '/finance', icon: <DollarSign size={24} />, color: 'bg-blue-100 text-blue-600' },
    { name: 'SDM / Pegawai', path: '/hrm', icon: <Users size={24} />, color: 'bg-orange-100 text-orange-600' },
    { name: 'POS (Kasir)', path: '/pos', icon: <LayoutDashboard size={24} />, color: 'bg-purple-100 text-purple-600' },
    { name: 'CRM (Pelanggan)', path: '/crm', icon: <Activity size={24} />, color: 'bg-rose-100 text-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-8">Selamat datang di Sistem Manajemen UMKM-Grow!</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Link 
              key={mod.name} 
              to={mod.path}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center group"
            >
              <div className={`p-4 rounded-full ${mod.color} group-hover:scale-110 transition-transform`}>
                {mod.icon}
              </div>
              <h2 className="font-semibold text-gray-800 text-lg">{mod.name}</h2>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
