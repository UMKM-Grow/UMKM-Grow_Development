import { useCallback, useEffect, useRef, useState } from 'react';
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CRM</h1>
            <div className="mt-1 text-sm text-gray-500">Kelola pelanggan dan riwayat transaksi</div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </span>
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (page !== 1) setPage(1);
                }}
                className="w-full rounded-md border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Cari nama / no HP..."
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Tambah Pelanggan
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm p-6">
          {loading ? (
            <div className="text-sm font-semibold text-gray-500">Memuat...</div>
          ) : errorMessage ? (
            <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada pelanggan. Klik "+ Tambah Pelanggan" untuk mulai.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {customers.map((customer, index) => (
                  <div
                    key={customer?.id ?? `${customer?.phone ?? 'customer'}-${index}`}
                    className="relative rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="absolute right-4 top-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openHistoryModal(customer)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                        aria-label="Riwayat transaksi"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(customer)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                        aria-label="Edit pelanggan"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
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
                      className="h-14 w-14 rounded-full bg-gray-100 p-1"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    <div className="mt-4 text-lg font-bold text-gray-900">{customer?.name || 'Nama Pelanggan'}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-700">{customer?.phone || '-'}</div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</div>
                        <div className="text-right font-semibold text-gray-700 break-all">{customer?.email || '-'}</div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Poin</div>
                        <div className="text-right font-semibold text-gray-700">
                          {Number.isFinite(Number(customer?.loyalty_points)) ? Number(customer.loyalty_points) : 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Alamat</div>
                      <div className="mt-2 whitespace-pre-line text-sm font-semibold text-gray-700">
                        {customer?.address || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  Total {totalData} pelanggan • Halaman {page} / {totalPages}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goPrevPage}
                    disabled={loading || page <= 1}
                    className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={goNextPage}
                    disabled={loading || totalPages <= page}
                    className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
