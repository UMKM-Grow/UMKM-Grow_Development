import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Clock, Edit2, Search } from 'lucide-react';
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
  const [limit] = useState(9);
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

    return () => {
      alive = false;
    };
  }, [debouncedSearch, limit, page, reloadNonce]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmitCustomer = async (payload, customerId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Silakan login terlebih dahulu.');
      throw new Error('NO_TOKEN');
    }
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
    if (!token) {
      setErrorMessage('Silakan login terlebih dahulu.');
      return;
    }

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
    if (!token) return;
    if (!customer?.id) return;

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
    if (!token) {
      setErrorMessage('Silakan login terlebih dahulu.');
      return;
    }
    setHistoryCustomer(customer);
    setIsHistoryOpen(true);
    await fetchHistory(customer, 1);
  };

  const goPrevPage = () => {
    const next = Math.max(1, page - 1);
    if (next !== page) setPage(next);
  };

  const goNextPage = () => {
    const next = Math.min(totalPages, page + 1);
    if (next !== page) setPage(next);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 md:p-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
        <h1 className="text-5xl md:text-7xl font-black text-brand-ice uppercase tracking-tighter">
          Database Pelanggan
        </h1>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <Search size={18} />
            </span>
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (page !== 1) setPage(1);
              }}
              className="w-full bg-brand-slate/30 backdrop-blur-md border border-white/10 text-white placeholder:text-white/50 focus:border-brand-ice focus:outline-none rounded-full pl-11 pr-4 py-3 font-semibold"
              placeholder="Cari nama / no HP..."
            />
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="bg-brand-ice text-brand-dark font-black px-6 py-3 rounded-full hover:bg-white hover:scale-105 transition-all w-fit"
          >
            + Tambah Pelanggan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-brand-ice/80 font-semibold">Memuat...</div>
      ) : errorMessage ? (
        <div className="text-brand-ice/80 font-semibold">{errorMessage}</div>
      ) : customers.length === 0 ? (
        <div className="bg-brand-slate/30 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-white/80 font-semibold">
          Belum ada pelanggan. Klik "+ Tambah Pelanggan" untuk mulai.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {customers.map((customer, index) => (
              <div
                key={customer?.id ?? `${customer?.phone ?? 'customer'}-${index}`}
                className="relative bg-brand-slate/30 backdrop-blur-md rounded-2xl border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(163,193,214,0.15)]"
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openHistoryModal(customer)}
                    className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-brand-dark/60 transition-colors"
                    aria-label="Riwayat transaksi"
                  >
                    <Clock size={16} className="text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(customer)}
                    className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-brand-dark/60 transition-colors"
                    aria-label="Edit pelanggan"
                  >
                    <Edit2 size={16} className="text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(customer)}
                    className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-red-500/70 transition-colors"
                    aria-label="Hapus pelanggan"
                  >
                    🗑️
                  </button>
                </div>

                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                    customer?.name || 'customer'
                  )}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full bg-brand-ice/20 p-1 mb-4"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                <div className="text-xl font-black text-white tracking-wide">
                  {customer?.name || 'Nama Pelanggan'}
                </div>
                <div className="mt-1 text-brand-ice font-semibold">{customer?.phone || '-'}</div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-white/60 font-bold uppercase tracking-widest text-[11px]">Email</div>
                    <div className="text-white/80 font-semibold text-right break-all">
                      {customer?.email || '-'}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-white/60 font-bold uppercase tracking-widest text-[11px]">Poin</div>
                    <div className="text-white/80 font-semibold text-right">
                      {Number.isFinite(Number(customer?.loyalty_points))
                        ? Number(customer.loyalty_points)
                        : 0}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-white/60 font-bold uppercase tracking-widest text-[11px]">Alamat</div>
                  <div className="mt-2 text-white/80 font-semibold text-sm whitespace-pre-line">
                    {customer?.address || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-white/60 font-bold text-sm">
              Total {totalData} pelanggan • Halaman {page} / {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrevPage}
                disabled={loading || page <= 1}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold disabled:opacity-60"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goNextPage}
                disabled={loading || totalPages <= page}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold disabled:opacity-60"
              >
                Next
              </button>
            </div>
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
