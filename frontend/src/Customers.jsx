import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Edit2 } from 'lucide-react';
import CustomerFormModal from './CustomerFormModal';

const API_URL = 'http://localhost:5000/api/customers';

const Customers = () => {
  const token = useMemo(() => localStorage.getItem('token'), []);
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(token));
  const [errorMessage, setErrorMessage] = useState(() => (token ? '' : 'Silakan login terlebih dahulu.'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const isSavingRef = useRef(false);

  const refreshCustomers = useCallback(async () => {
    if (!token) {
      setCustomers([]);
      setLoading(false);
      setErrorMessage('Silakan login terlebih dahulu.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const response = await axios.get(API_URL, { headers: authHeaders });
      const data = response?.data?.data ?? response?.data ?? [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Gagal memuat pelanggan.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    axios
      .get(API_URL, { headers: authHeaders })
      .then((response) => {
        if (!alive) return;
        const data = response?.data?.data ?? response?.data ?? [];
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!alive) return;
        setErrorMessage(error?.response?.data?.message || 'Gagal memuat pelanggan.');
        setCustomers([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [authHeaders, token]);

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
    if (!token) {
      setErrorMessage('Silakan login terlebih dahulu.');
      return;
    }
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setErrorMessage('');
      if (customerId) {
        await axios.put(`${API_URL}/${customerId}`, payload, { headers: authHeaders });
      } else {
        await axios.post(API_URL, payload, { headers: authHeaders });
      }
      await refreshCustomers();
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 409
          ? 'No HP sudah terpakai. Gunakan nomor yang berbeda.'
          : (error?.response?.data?.message || 'Gagal menyimpan pelanggan.');
      setErrorMessage(msg);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!token) {
      setErrorMessage('Silakan login terlebih dahulu.');
      return;
    }

    const ok = window.confirm(`Hapus pelanggan "${customer?.name || ''}"?`);
    if (!ok) return;

    try {
      setErrorMessage('');
      await axios.delete(`${API_URL}/${customer.id}`, { headers: authHeaders });
      await refreshCustomers();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Gagal menghapus pelanggan.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 md:p-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
        <h1 className="text-5xl md:text-7xl font-black text-brand-ice uppercase tracking-tighter">
          Database Pelanggan
        </h1>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-brand-ice text-brand-dark font-black px-6 py-3 rounded-full hover:bg-white hover:scale-105 transition-all w-fit"
        >
          + Tambah Pelanggan
        </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {customers.map((customer, index) => (
            <div
              key={customer?.id ?? `${customer?.phone ?? 'customer'}-${index}`}
              className="relative bg-brand-slate/30 backdrop-blur-md rounded-2xl border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(163,193,214,0.15)]"
            >
              <div className="absolute top-4 right-4 flex gap-2">
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
      )}

      {isModalOpen && (
        <CustomerFormModal
          isOpen
          initialCustomer={editingCustomer}
          onClose={closeModal}
          onSubmit={handleSubmitCustomer}
        />
      )}
    </div>
  );
};

export default Customers;
