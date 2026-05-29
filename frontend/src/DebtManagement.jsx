import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function formatIdr(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DebtManagement() {
  const [activeTab, setActiveTab] = useState('Hutang');
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    due_date: todayInputValue(),
    supplier_id: '',
    customer_name: '',
  });

  const token = useMemo(() => localStorage.getItem('token'), []);
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const loadDebts = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await axios.get(`${API_BASE}/debts`, {
        headers,
        params: { type: activeTab },
      });
      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      setItems([]);
      setErrorMessage(error.response?.data?.message || 'Gagal memuat data hutang/piutang.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/suppliers`, { headers });
      setSuppliers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setSuppliers([]);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [activeTab]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openModal = () => {
    setForm({
      amount: '',
      due_date: todayInputValue(),
      supplier_id: '',
      customer_name: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      await axios.post(`${API_BASE}/debts`, {
        type: activeTab,
        amount: Number(form.amount),
        due_date: form.due_date,
        supplier_id: activeTab === 'Hutang' ? Number(form.supplier_id) : null,
        customer_name: activeTab === 'Piutang' ? form.customer_name.trim() : null,
      }, { headers });
      closeModal();
      await loadDebts();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      alert(error.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await axios.patch(`${API_BASE}/debts/${id}/status`, {}, { headers });
      await loadDebts();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal memperbarui status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      await axios.delete(`${API_BASE}/debts/${id}`, { headers });
      await loadDebts();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus data.');
    }
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hutang & Piutang</h1>
            <p className="text-sm text-gray-500">Kelola kewajiban toko ke supplier dan piutang pelanggan per cabang.</p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
          >
            Tambah {activeTab}
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {['Hutang', 'Piutang'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition duration-200 ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            >
              {tab === 'Hutang' ? 'Hutang (Toko)' : 'Piutang (Pelanggan)'}
            </button>
          ))}
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
            {errorMessage}
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Pihak</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Nominal</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Memuat data...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Belum ada data {activeTab.toLowerCase()}.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {item.type === 'Hutang' ? item.supplier?.name || '-' : item.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatIdr(item.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(item.due_date)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === 'Lunas' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(item.id)}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition duration-150"
                        >
                          Tandai Lunas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-100 transition duration-150"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">Tambah {activeTab}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nominal</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder="Masukkan nominal"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  value={form.due_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {activeTab === 'Hutang' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Supplier</label>
                  <select
                    required
                    value={form.supplier_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="Masukkan nama pelanggan"
                  />
                </div>
              )}

                      <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
