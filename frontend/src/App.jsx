import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BranchProvider } from './BranchContext';
import Navbar from './Navbar';
import Branches from './Branches';

function App() {
  return (
    <BranchProvider>
      <BrowserRouter>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <div className="mx-auto max-w-7xl p-6">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="mt-2 text-gray-600">
                    Mulai dari sini untuk melihat ringkasan cabang dan performa operasional.
                  </p>
                </div>
              }
            />
            <Route
              path="/inventory"
              element={
                <div className="mx-auto max-w-7xl p-6">
                  <h1 className="text-2xl font-bold text-gray-900">Inventori</h1>
                  <p className="mt-2 text-gray-600">Filter produk per cabang dan kelola stok dengan lebih baik.</p>
                </div>
              }
            />
            <Route path="/admin/branches" element={<Branches />} />
            <Route
              path="/settings"
              element={
                <div className="mx-auto max-w-7xl p-6">
                  <h1 className="text-2xl font-bold text-gray-900">Pengaturan Multi-Cabang</h1>
                  <p className="mt-2 text-gray-600">Pengaturan global untuk cabang dan manajemen user.</p>
                </div>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </BranchProvider>
  );
}

export default App;
