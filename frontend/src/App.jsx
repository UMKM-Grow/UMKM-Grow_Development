import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Halaman Login (Setup by Luthfi nanti)</div>} />
        <Route path="/dashboard" element={<div>Dashboard (Setup by Zulfikri nanti)</div>} />
        <Route path="/pos" element={<div>Kasir POS (Setup by Bilal nanti)</div>} />
        <Route path="/inventory" element={<div>Inventori (Setup by Afnan nanti)</div>} />
        <Route path="/crm" element={<div>Pelanggan (Setup by Diska nanti)</div>} />
        <Route path="/finance" element={<div>Keuangan (Setup by Nabil nanti)</div>} />
        <Route path="/hrm" element={<div>HRD & Absensi (Setup by Luthfi nanti)</div>} />
        <Route path="/settings" element={<div>Pengaturan Multi-Cabang (Setup by Lavio)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;