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
import Payroll from "./Payroll";
import Broadcast from "./Broadcast";
import Layout from "./components/Layout";
import { BranchProvider } from "./BranchContext";
import BranchContext from "./BranchContext";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
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
                <Layout>
                  <Dashboard />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Layout>
                  <Dashboard />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/pos"
            element={
              <RequireAuth>
                <Layout>
                  <POS />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/inventory"
            element={
              <RequireAuth>
                <Layout>
                  <Inventory />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/suppliers"
            element={
              <RequireAuth>
                <Layout>
                  <SupplierManagement />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/absensi"
            element={
              <RequireAuth>
                <Layout>
                  <Absensi />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/crm"
            element={
              <RequireAuth>
                <Layout>
                  <CRM />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/finance"
            element={
              <RequireAuth>
                <Layout>
                  <Finance />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/finance/expenses"
            element={
              <RequireAuth>
                <Layout>
                  <Expenses />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/finance/reports"
            element={
              <RequireAuth>
                <Layout>
                  <FinancialReports />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/hrm"
            element={
              <RequireAuth>
                <Layout>
                  <HRM />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Layout>
                  <Settings />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/branches"
            element={
              <RequireAuth>
                <Layout>
                  <Branches />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/inventory/mutations"
            element={
              <RequireAuth>
                <Layout>
                  <StockMutation />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/members"
            element={
              <RequireAuth>
                <Layout>
                  <Members />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/debts"
            element={
              <RequireAuth>
                <Layout>
                  <DebtManagement />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/payroll"
            element={
              <RequireAuth>
                <Layout>
                  <Payroll />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/broadcast"
            element={
              <RequireAuth>
                <Layout>
                  <Broadcast />
                </Layout>
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
