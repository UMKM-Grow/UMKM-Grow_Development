import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import HRM from './HRM';
import POS from './POS';
import CRM from './CRM';
import Finance from './Finance';
import Settings from './Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/hrm" element={<HRM />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;