import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ExpenseFormModal from './ExpenseFormModal';

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
      const res = await axios.get(`${API_BASE}/expenses`, { headers });
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
  }, [handleAuthError]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Operational Expenses</h1>
            <div className="mt-1 text-sm text-gray-500">Catatan pengeluaran operasional</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Catat Pengeluaran
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">Daftar Pengeluaran</div>
            <div className="text-sm text-gray-500">
              Total: <span className="font-semibold text-gray-900">{formatIdr(totalNominal)}</span>
            </div>
          </div>

          {errorMessage ? (
            <div className="border-b border-gray-200 bg-white px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Nominal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={5}>
                      Belum ada data pengeluaran.
                    </td>
                  </tr>
                ) : (
                  items.map((x) => {
                    const proofUrl = x?.bukti_foto ? `${SERVER_BASE}/uploads/${x.bukti_foto}` : null;
                    return (
                      <tr key={x.id}>
                        <td className="px-4 py-4 text-gray-700">{x.tanggal || '-'}</td>
                        <td className="px-4 py-4 font-semibold text-gray-900">{x.kategori || '-'}</td>
                        <td className="px-4 py-4 font-semibold text-red-600">
                          -{formatIdr(Number(x?.nominal) || 0)}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{x.keterangan || '-'}</td>
                        <td className="px-4 py-4">
                          {proofUrl ? (
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
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
