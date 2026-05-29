import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Clock, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import CustomerFormModal from './CustomerFormModal';
import CustomerHistoryModal from './CustomerHistoryModal';

const API_URL = 'http://localhost:5000/api/customers';

const Customers = () => {
  const initialToken = localStorage.getItem('token');

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(initialToken));
  const [errorMessage, setErrorMessage] = useState(() => (initialToken ? '' : 'Silakan login terlebih dahulu.'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const isSavingRef = useRef(false);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const buildApiErrorMessage = (error, fallback) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.message;
    const details = error?.response?.data?.error;
    if (status === 401) return 'Sesi login tidak valid. Silakan login ulang.';
    if (msg && details) return `${msg}: ${details}`;
    return msg || fallback;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let alive = true;

    Promise.resolve().then(() => {
      if (!alive) return;
      setLoading(true);
      setErrorMessage('');
    });

    axios
      .get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search: debouncedSearch },
      })
      .then((response) => {
        if (!alive) return;
        const data = response?.data?.data ?? [];
        setCustomers(Array.isArray(data) ? data : []);
        setTotalPages(Number(response?.data?.totalPages) || 1);
        setTotalData(Number(response?.data?.totalData) || 0);
      })
      .catch((error) => {
        if (!alive) return;
        setErrorMessage(buildApiErrorMessage(error, 'Gagal memuat pelanggan.'));
        setCustomers([]);
        setTotalPages(1);
        setTotalData(0);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, [debouncedSearch, limit, page, reloadNonce]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const openCreateModal = () => { setEditingCustomer(null); setIsModalOpen(true); };
  const openEditModal = (customer) => { setEditingCustomer(customer); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingCustomer(null); };

  const handleSubmitCustomer = async (payload, customerId) => {
    const token = localStorage.getItem('token');
    if (!token) { setErrorMessage('Silakan login terlebih dahulu.'); throw new Error('NO_TOKEN'); }
    if (isSavingRef.current) return;
    try {
      isSavingRef.current = true;
      setErrorMessage('');
      if (customerId) {
        await axios.put(`${API_URL}/${customerId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(API_URL, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setPage(1);
      setReloadNonce((v) => v + 1);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDeleteCustomer = async (customer) => {
    const token = localStorage.getItem('token');
    if (!token) { setErrorMessage('Silakan login terlebih dahulu.'); return; }
    const ok = window.confirm(`Hapus pelanggan "${customer?.name || ''}"?`);
    if (!ok) return;
    try {
      setErrorMessage('');
      await axios.delete(`${API_URL}/${customer.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setPage(1);
      setReloadNonce((v) => v + 1);
    } catch (error) {
      setErrorMessage(buildApiErrorMessage(error, 'Gagal menghapus pelanggan.'));
    }
  };

  const closeHistoryModal = () => {
    setIsHistoryOpen(false);
    setHistoryCustomer(null);
    setHistoryItems([]);
    setHistoryError('');
    setHistoryPage(1);
    setHistoryTotalPages(1);
  };

  const fetchHistory = useCallback(async (customer, nextPage) => {
    const token = localStorage.getItem('token');
    if (!token || !customer?.id) return;
    try {
      setHistoryLoading(true);
      setHistoryError('');
      const response = await axios.get(`${API_URL}/${customer.id}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: nextPage, limit: 10 },
      });
      const data = response?.data?.data ?? [];
      setHistoryItems(Array.isArray(data) ? data : []);
      setHistoryTotalPages(Number(response?.data?.totalPages) || 1);
      setHistoryPage(Number(response?.data?.currentPage) || nextPage || 1);
    } catch (error) {
      setHistoryError(buildApiErrorMessage(error, 'Gagal memuat riwayat transaksi.'));
      setHistoryItems([]);
      setHistoryTotalPages(1);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const openHistoryModal = async (customer) => {
    const token = localStorage.getItem('token');
    if (!token) { setErrorMessage('Silakan login terlebih dahulu.'); return; }
    setHistoryCustomer(customer);
    setIsHistoryOpen(true);
    await fetchHistory(customer, 1);
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Database Pelanggan</h1>
          <p className="text-sm text-gray-500">Kelola data pelanggan dan riwayat transaksi.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); if (page !== 1) setPage(1); }}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              placeholder="Cari nama / no HP..."
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} />
            Tambah Pelanggan
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
          {errorMessage}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No. HP</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Poin</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Memuat data...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  Belum ada pelanggan. Klik "Tambah Pelanggan" untuk mulai.
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr
                  key={customer?.id ?? `${customer?.phone ?? 'customer'}-${index}`}
                  className="border-b border-gray-100 hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(customer?.name || 'customer')}`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full bg-gray-100"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-medium text-gray-800">{customer?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer?.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer?.email || '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-500">
                    {Number.isFinite(Number(customer?.loyalty_points)) ? Number(customer.loyalty_points) : 0} pts
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[180px] truncate">{customer?.address || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openHistoryModal(customer)}
                        className="text-gray-400 hover:text-blue-600 transition duration-150"
                        aria-label="Riwayat transaksi"
                      >
                        <Clock size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(customer)}
                        className="text-gray-400 hover:text-blue-600 transition duration-150"
                        aria-label="Edit pelanggan"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer)}
                        className="text-gray-400 hover:text-rose-500 transition duration-150"
                        aria-label="Hapus pelanggan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && customers.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Total {totalData} pelanggan &bull; Halaman {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={loading || page <= 1}
              className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={loading || totalPages <= page}
              className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CustomerFormModal
          isOpen
          initialCustomer={editingCustomer}
          onClose={closeModal}
          onSubmit={handleSubmitCustomer}
        />
      )}

      {isHistoryOpen && (
        <CustomerHistoryModal
          isOpen
          customer={historyCustomer}
          loading={historyLoading}
          errorMessage={historyError}
          items={historyItems}
          currentPage={historyPage}
          totalPages={historyTotalPages}
          onPrev={() => {
            const next = Math.max(1, historyPage - 1);
            if (next !== historyPage) fetchHistory(historyCustomer, next);
          }}
          onNext={() => {
            const next = Math.min(historyTotalPages, historyPage + 1);
            if (next !== historyPage) fetchHistory(historyCustomer, next);
          }}
          onClose={closeHistoryModal}
        />
      )}
    </div>
  );
};

export default Customers;
