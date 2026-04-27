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
      <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Riwayat Belanja</div>
            <div className="text-2xl font-bold text-gray-900">{customer?.name || 'Pelanggan'}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-sm font-semibold text-gray-500">Memuat...</div>
          ) : errorMessage ? (
            <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada riwayat transaksi.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        ID Transaksi
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Total
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row?.id} className="border-t border-gray-200">
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-700">
                          {formatDateTime(row?.date)}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700">
                          {row?.id ?? '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-700">
                          {formatRupiah(row?.total_price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
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
            <div className="text-sm text-gray-500">
              Halaman {currentPage || 1} / {totalPages || 1}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPrev}
                disabled={loading || (currentPage || 1) <= 1}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={loading || (totalPages || 1) <= (currentPage || 1)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
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
