import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ExpenseFormModal from './ExpenseFormModal';
import BranchContext from './BranchContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}

function extractArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('token');
    setErrorMessage('Sesi login berakhir. Silakan login ulang.');
    window.setTimeout(() => {
      window.location.href = '/login';
    }, 0);
  }, []);

  const { selectedBranchId } = useContext(BranchContext);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setItems([]);
        setErrorMessage('Silakan login terlebih dahulu.');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const params = selectedBranchId ? { branch_id: selectedBranchId } : undefined;
      const res = await axios.get(`${API_BASE}/expenses`, { headers, params });
      const list = extractArrayPayload(res.data);
      setItems(list);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        handleAuthError();
        setItems([]);
        return;
      }
      if (status === 503) {
        setErrorMessage('Backend belum tersambung ke database. Pastikan MySQL berjalan.');
        setItems([]);
        return;
      }
      setErrorMessage('Gagal memuat data pengeluaran.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, selectedBranchId]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadExpenses();
    }, 0);
    return () => clearTimeout(t);
  }, [loadExpenses]);

  const totalNominal = useMemo(() => {
    return items.reduce((sum, x) => sum + (Number(x?.nominal) || 0), 0);
  }, [items]);

  async function handleCreateExpense(form) {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Silakan login terlebih dahulu.');
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 0);
      throw new Error('Silakan login terlebih dahulu.');
    }
    const headers = { Authorization: `Bearer ${token}` };

    const fd = new FormData();
    fd.append('tanggal', form.tanggal);
    fd.append('kategori', form.kategori);
    fd.append('nominal', String(form.nominal));
    fd.append('keterangan', form.keterangan || '');
    if (selectedBranchId) fd.append('branch_id', String(selectedBranchId));
    if (form.file) fd.append('bukti', form.file);

    try {
      await axios.post(`${API_BASE}/expenses`, fd, { headers });
      alert('Pengeluaran berhasil disimpan');
      setOpen(false);
      await loadExpenses();
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || 'Gagal menyimpan pengeluaran.';
      if (status === 401) {
        handleAuthError();
        throw new Error('Sesi login berakhir. Silakan login ulang.');
      }
      if (status === 503) {
        throw new Error('Backend belum tersambung ke database. Pastikan MySQL berjalan.');
      }
      throw new Error(message);
    }
  }

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengeluaran Operasional</h1>
            <p className="text-sm text-gray-500">Catatan pengeluaran operasional toko.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
          >
            + Catat Pengeluaran
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <span className="text-sm font-semibold text-gray-800">Daftar Pengeluaran</span>
            <span className="text-sm text-gray-500">
              Total: <span className="font-semibold text-rose-500">{formatIdr(totalNominal)}</span>
            </span>
          </div>

          {errorMessage ? (
            <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-600">{errorMessage}</div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nominal</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bukti</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={5}>Memuat data...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={5}>Belum ada data pengeluaran.</td></tr>
                ) : (
                  items.map((x) => {
                    const proofUrl = x?.bukti_foto ? `${SERVER_BASE}/uploads/${x.bukti_foto}` : null;
                    return (
                      <tr key={x.id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 text-sm text-gray-700">{x.tanggal || '-'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{x.kategori || '-'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-rose-500">-{formatIdr(Number(x?.nominal) || 0)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{x.keterangan || '-'}</td>
                        <td className="px-6 py-4">
                          {proofUrl ? (
                            <a href={proofUrl} target="_blank" rel="noreferrer"
                              className="bg-white text-gray-700 font-medium text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200">
                              Lihat Struk
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExpenseFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
}
