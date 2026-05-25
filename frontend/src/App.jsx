import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useContext, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import HRM from "./HRM";
import POS from "./POS";
import CRM from "./CRM";
import Finance from "./Finance";
import Expenses from "./Expenses";
import FinancialReports from "./FinancialReports";
import Settings from "./Settings";
import Absensi from "./Absensi";
import SupplierManagement from "./SupplierManagement";
import Branches from "./Branches";
import StockMutation from "./StockMutation";
import Members from "./Members";
import DebtManagement from "./DebtManagement";
import Navbar from "./Navbar";
import { BranchProvider } from "./BranchContext";
import BranchContext from "./BranchContext";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AuthenticatedLayout({ children }) {
  const { reloadBranches } = useContext(BranchContext);

  useEffect(() => {
    reloadBranches();
  }, [reloadBranches]);

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <BranchProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/pos"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <POS />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/inventory"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Inventory />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/suppliers"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <SupplierManagement />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/absensi"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Absensi />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/crm"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <CRM />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/finance"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Finance />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/finance/expenses"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Expenses />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/finance/reports"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <FinancialReports />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/hrm"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <HRM />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Settings />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/branches"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Branches />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/inventory/mutations"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <StockMutation />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/members"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Members />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/debts"
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <DebtManagement />
                </AuthenticatedLayout>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BranchProvider>
    </BrowserRouter>
  );
}

export default App;
