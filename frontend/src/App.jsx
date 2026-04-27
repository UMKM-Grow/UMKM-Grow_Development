import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import HRM from './HRM';
import POS from './POS';
import CRM from './CRM';
import Finance from './Finance';
import Expenses from './Expenses';
import Settings from './Settings';
import Absensi from './Absensi';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/pos" element={<RequireAuth><POS /></RequireAuth>} />
        <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
        <Route path="/absensi" element={<RequireAuth><Absensi /></RequireAuth>} />
        <Route path="/crm" element={<RequireAuth><CRM /></RequireAuth>} />
        <Route path="/finance" element={<RequireAuth><Finance /></RequireAuth>} />
        <Route path="/finance/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
        <Route path="/hrm" element={<RequireAuth><HRM /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
