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

          {/* Total Bersih (otomatis) */}
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Gaji Bersih:</span>
              <span className={`text-lg font-bold ${totalBersih >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatIdr(totalBersih)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">= Gaji Pokok + Bonus − Potongan</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penggajian Karyawan</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola data gaji, bonus, dan potongan karyawan</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            + Input Gaji Baru
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Total Penggajian</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{filteredPayrolls.length}</p>
            <p className="text-xs text-gray-400">data tersaring</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Total Gaji Dibayar</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{formatIdr(totalGaji)}</p>
            <p className="text-xs text-gray-400">dari data tersaring</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Jumlah Karyawan</p>
            <p className="mt-2 text-2xl font-bold text-purple-600">{employees.length}</p>
            <p className="text-xs text-gray-400">di cabang ini</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 gap-4">
            <span className="text-sm font-semibold text-gray-900">Riwayat Penggajian</span>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Filter periode:</label>
              <select
                value={filterPeriode}
                onChange={(e) => setFilterPeriode(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Periode</option>
                {allPeriods.map((p) => (
                  <option key={p} value={p}>
                    {formatPeriode(p)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border-b border-red-100 px-5 py-3 text-sm text-red-700">{errorMessage}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Karyawan</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Periode</th>
                  <th className="px-5 py-3 text-right">Gaji Pokok</th>
                  <th className="px-5 py-3 text-right">Bonus</th>
                  <th className="px-5 py-3 text-right">Potongan</th>
                  <th className="px-5 py-3 text-right">Total Bersih</th>
                  <th className="px-5 py-3">Catatan</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-gray-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                      Belum ada data penggajian.
                    </td>
                  </tr>
                ) : (
                  filteredPayrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-medium text-gray-900">{p.user?.name || '-'}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-blue-50 text-blue-700">
                          {p.user?.role || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{formatPeriode(p.periode)}</td>
                      <td className="px-5 py-4 text-right text-gray-700">{formatIdr(p.base_salary)}</td>
                      <td className="px-5 py-4 text-right text-green-600">
                        {Number(p.bonus) > 0 ? `+${formatIdr(p.bonus)}` : '-'}
                      </td>
                      <td className="px-5 py-4 text-right text-red-500">
                        {Number(p.deductions) > 0 ? `-${formatIdr(p.deductions)}` : '-'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-green-700">{formatIdr(p.total_salary)}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-[160px] truncate">{p.notes || '-'}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                        >
                          Hapus
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
