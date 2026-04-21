import React from 'react';
import { X } from 'lucide-react';

const formatRupiah = (value) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 'Rp 0';
  return `Rp ${numericValue.toLocaleString('id-ID')}`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID');
};

const CustomerHistoryModal = ({
  isOpen,
  customer,
  loading,
  errorMessage,
  items,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-brand-slate/20 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60 font-bold">
              Riwayat Belanja
            </div>
            <div className="text-2xl font-black text-brand-ice uppercase tracking-tight">
              {customer?.name || 'Pelanggan'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-brand-dark/60 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-brand-ice/80 font-semibold">Memuat...</div>
          ) : errorMessage ? (
            <div className="text-brand-ice/80 font-semibold">{errorMessage}</div>
          ) : !items || items.length === 0 ? (
            <div className="bg-brand-dark/40 border border-white/10 rounded-2xl p-6 text-white/80 font-semibold">
              Belum ada riwayat transaksi.
            </div>
          ) : (
            <div className="bg-brand-dark/30 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-white/70 font-bold uppercase tracking-widest text-[11px]">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-white/70 font-bold uppercase tracking-widest text-[11px]">
                        ID Transaksi
                      </th>
                      <th className="px-4 py-3 text-white/70 font-bold uppercase tracking-widest text-[11px]">
                        Total
                      </th>
                      <th className="px-4 py-3 text-white/70 font-bold uppercase tracking-widest text-[11px]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row?.id} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white/80 font-semibold whitespace-nowrap">
                          {formatDateTime(row?.date)}
                        </td>
                        <td className="px-4 py-3 text-white/80 font-mono">
                          {row?.id ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-white/80 font-semibold whitespace-nowrap">
                          {formatRupiah(row?.total_price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 font-bold">
                            {row?.status || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-white/60 font-bold text-sm">
              Halaman {currentPage || 1} / {totalPages || 1}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPrev}
                disabled={loading || (currentPage || 1) <= 1}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold disabled:opacity-60"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={loading || (totalPages || 1) <= (currentPage || 1)}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryModal;
