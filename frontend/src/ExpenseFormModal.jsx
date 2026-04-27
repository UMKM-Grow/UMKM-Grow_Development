import { useMemo, useState } from 'react';

const CATEGORIES = ['Listrik', 'Air', 'Gaji Karyawan', 'Sewa Tempat', 'Lain-lain'];

export default function ExpenseFormModal({ open, onClose, onSubmit }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [tanggal, setTanggal] = useState(today);
  const [kategori, setKategori] = useState(CATEGORIES[0]);
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        tanggal,
        kategori,
        nominal,
        keterangan,
        file,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="text-left">
            <div className="text-lg font-bold text-gray-900">Catat Pengeluaran</div>
            <div className="mt-1 text-sm text-gray-500">Pencatatan pengeluaran operasional</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">Nominal Rupiah</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="500000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="mt-2 w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Contoh: Bayar listrik bulan April"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">Unggah Bukti Fisik</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900"
            />
            <div className="mt-2 text-xs text-gray-500">Format gambar, max 5MB.</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
