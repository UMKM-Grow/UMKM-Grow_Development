import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BranchContext from './BranchContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

function formatPeriode(value) {
  if (!value) return '-';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

const EMPTY_FORM = {
  user_id: '',
  periode: '',
  base_salary: '',
  bonus: '',
  deductions: '',
  notes: '',
};

function PayrollModal({ open, onClose, onSubmit, employees, branchId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError('');
    }
  }, [open]);

  const totalBersih = useMemo(() => {
    const base = Number(form.base_salary) || 0;
    const bonus = Number(form.bonus) || 0;
    const deductions = Number(form.deductions) || 0;
    return base + bonus - deductions;
  }, [form.base_salary, form.bonus, form.deductions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.user_id) return setError('Pilih karyawan terlebih dahulu.');
    if (!form.periode) return setError('Periode wajib diisi.');
    if (!form.base_salary || Number(form.base_salary) < 0) return setError('Gaji pokok tidak valid.');

    setLoading(true);
    try {
      await onSubmit({ ...form, branch_id: branchId });
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data penggajian.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Input Gaji Baru</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Karyawan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Karyawan <span className="text-red-500">*</span>
            </label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Karyawan --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Periode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periode (Bulan & Tahun) <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              name="periode"
              value={form.periode}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gaji Pokok */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gaji Pokok (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="base_salary"
              value={form.base_salary}
              onChange={handleChange}
              min="0"
              placeholder="Contoh: 3000000"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bonus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Performa (Rp)</label>
            <input
              type="number"
              name="bonus"
              value={form.bonus}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Potongan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Potongan / Kasbon (Rp)</label>
            <input
              type="number"
              name="deductions"
              value={form.deductions}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Opsional..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Gaji Bersih:</span>
              <span className={`text-lg font-bold ${totalBersih >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatIdr(totalBersih)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">= Gaji Pokok + Bonus − Potongan</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan Gaji'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Payroll() {
  const { selectedBranchId } = useContext(BranchContext);
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [filterPeriode, setFilterPeriode] = useState('');

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = selectedBranchId ? { branch_id: selectedBranchId } : {};
      const res = await axios.get(`${API_BASE}/payroll`, {
        headers: authHeaders(),
        params,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setPayrolls(data);
    } catch (err) {
      if (err?.response?.status === 401) return handleAuthError();
      setErrorMessage('Gagal memuat data penggajian.');
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleAuthError, selectedBranchId]);

  const loadEmployees = useCallback(async () => {
    try {
      const params = selectedBranchId ? { branch_id: selectedBranchId } : {};
      const res = await axios.get(`${API_BASE}/payroll/employees`, {
        headers: authHeaders(),
        params,
      });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEmployees([]);
    }
  }, [authHeaders, selectedBranchId]);

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
  }, [loadPayrolls, loadEmployees]);

  const handleCreate = useCallback(
    async (form) => {
      await axios.post(`${API_BASE}/payroll`, form, { headers: authHeaders() });
      await loadPayrolls();
    },
    [authHeaders, loadPayrolls]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Yakin hapus data penggajian ini?')) return;
      try {
        await axios.delete(`${API_BASE}/payroll/${id}`, { headers: authHeaders() });
        await loadPayrolls();
      } catch (err) {
        if (err?.response?.status === 401) return handleAuthError();
        alert(err?.response?.data?.message || 'Gagal menghapus data penggajian.');
      }
    },
    [authHeaders, handleAuthError, loadPayrolls]
  );

  const filteredPayrolls = useMemo(() => {
    if (!filterPeriode) return payrolls;
    return payrolls.filter((p) => p.periode === filterPeriode);
  }, [payrolls, filterPeriode]);

  const totalGaji = useMemo(() => {
    return filteredPayrolls.reduce((sum, p) => sum + (Number(p.total_salary) || 0), 0);
  }, [filteredPayrolls]);

  // unique periods for filter
  const allPeriods = useMemo(() => {
    const s = new Set(payrolls.map((p) => p.periode));
    return [...s].sort().reverse();
  }, [payrolls]);

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Penggajian Karyawan</h1>
            <p className="text-sm text-gray-500">Kelola data gaji, bonus, dan potongan karyawan</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
          >
            + Input Gaji Baru
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Penggajian</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">{filteredPayrolls.length}</p>
            <p className="text-xs text-gray-500">data tersaring</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Gaji Dibayar</p>
            <p className="mt-2 text-2xl font-bold text-emerald-500">{formatIdr(totalGaji)}</p>
            <p className="text-xs text-gray-500">dari data tersaring</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Jumlah Karyawan</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">{employees.length}</p>
            <p className="text-xs text-gray-500">di cabang ini</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 gap-4">
            <span className="text-sm font-semibold text-gray-800">Riwayat Penggajian</span>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Filter periode:</label>
              <select
                value={filterPeriode}
                onChange={(e) => setFilterPeriode(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="">Semua Periode</option>
                {allPeriods.map((p) => (
                  <option key={p} value={p}>{formatPeriode(p)}</option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 text-sm text-rose-600">{errorMessage}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Karyawan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Gaji Pokok</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Bonus</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Potongan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Bersih</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catatan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">Memuat data...</td></tr>
                ) : filteredPayrolls.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">Belum ada data penggajian.</td></tr>
                ) : (
                  filteredPayrolls.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 font-medium text-gray-800">{p.user?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-blue-50 text-blue-600">
                          {p.user?.role || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatPeriode(p.periode)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">{formatIdr(p.base_salary)}</td>
                      <td className="px-6 py-4 text-right text-sm text-emerald-500">
                        {Number(p.bonus) > 0 ? `+${formatIdr(p.bonus)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-rose-500">
                        {Number(p.deductions) > 0 ? `-${formatIdr(p.deductions)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-500">{formatIdr(p.total_salary)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px] truncate">{p.notes || '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-gray-400 hover:text-rose-500 transition duration-150"
                          aria-label="Hapus"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PayrollModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        employees={employees}
        branchId={selectedBranchId}
      />
    </div>
  );
}
