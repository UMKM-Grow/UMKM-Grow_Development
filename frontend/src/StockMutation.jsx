import { useContext, useEffect, useState } from 'react';
import BranchContext from './BranchContext';

const MUTATION_EVENT = 'stock-mutation-updated';

export default function StockMutation() {
  const { branches, selectedBranchId } = useContext(BranchContext);
  const [form, setForm] = useState({
    product_id: '',
    from_branch_id: selectedBranchId || '',
    to_branch_id: '',
    quantity: '',
    notes: '',
  });
  const [products, setProducts] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (selectedBranchId) {
      setForm((prev) => ({ ...prev, from_branch_id: selectedBranchId }));
      loadProducts(selectedBranchId);
      loadMutations();
    }
  }, [selectedBranchId]);

  const loadProducts = async (branchId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data?.data ?? []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMutations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mutations?branch_id=${selectedBranchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMutations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load mutations:', error);
      setMutations([]);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      if (!form.product_id || !form.to_branch_id || !form.quantity) {
        setMessage('error|Semua field harus diisi');
        setSubmitting(false);
        return;
      }

      if (parseInt(form.quantity) <= 0) {
        setMessage('error|Jumlah harus lebih dari 0');
        setSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mutations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: parseInt(form.product_id),
          from_branch_id: parseInt(form.from_branch_id),
          to_branch_id: parseInt(form.to_branch_id),
          quantity: parseInt(form.quantity),
          notes: form.notes || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`error|${data.error || 'Gagal memproses mutasi'}`);
        return;
      }

      setMessage('success|Mutasi stok berhasil diproses!');
      window.dispatchEvent(new Event(MUTATION_EVENT));
      setForm({
        product_id: '',
        from_branch_id: selectedBranchId,
        to_branch_id: '',
        quantity: '',
        notes: '',
      });
      loadMutations();
    } catch (error) {
      console.error('Mutation error:', error);
      setMessage(`error|${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.id_cabang === parseInt(branchId));
    return branch ? branch.nama_cabang : '';
  };

  const getTargetBranches = () => {
    return branches.filter((b) => b.id_cabang !== parseInt(form.from_branch_id));
  };

  const [messageType, messageText] = message.split('|');
  const messageStyles = {
    error: 'bg-rose-50 border border-rose-200 text-rose-600',
    success: 'bg-emerald-50 border border-emerald-200 text-emerald-600',
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Transfer Mutasi Stok</h1>
          <p className="text-sm text-gray-500">
            Pindahkan stok barang antar cabang dengan keamanan transaksi database penuh (ACID Transaction).
          </p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg p-4 text-sm font-medium ${messageStyles[messageType] || messageStyles.error}`}>
            {messageText}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          {/* Form Mutasi */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit"
          >
            <h2 className="text-base font-semibold text-gray-800 mb-4">Form Mutasi</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Cabang Asal</label>
            <input
              type="text"
              value={getBranchName(form.from_branch_id)}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Barang</label>
            <select
              name="product_id"
              value={form.product_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-4"
            >
              <option value="">-- Pilih Barang --</option>
              {loading ? (
                <option disabled>Memuat...</option>
              ) : products.length === 0 ? (
                <option disabled>Tidak ada barang di cabang ini</option>
              ) : (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nama_produk || product.name}
                  </option>
                ))
              )}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Qty)</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-4"
              placeholder="Masukkan jumlah"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Cabang Tujuan</label>
            <select
              name="to_branch_id"
              value={form.to_branch_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-4"
            >
              <option value="">-- Pilih Cabang Tujuan --</option>
              {getTargetBranches().map((branch) => (
                <option key={branch.id_cabang} value={branch.id_cabang}>
                  {branch.nama_cabang}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan <span className="text-xs text-gray-400">(Opsional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-4"
              rows="3"
              placeholder="Contoh: Bantuan stok akhir pekan"
            />

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-blue-600 text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Memproses...' : 'Proses Mutasi'}
            </button>
          </form>

          {/* Tabel Riwayat Mutasi */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800">Riwayat Mutasi</h2>
            <p className="mt-1 text-xs text-gray-500 mb-4">
              Menampilkan mutasi masuk dan keluar dari/ke cabang ini
            </p>

            {mutations.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada riwayat mutasi.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Barang</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dari</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ke</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutations.map((mutation) => {
                      const isOutgoing = mutation.from_branch_id === selectedBranchId;
                      return (
                        <tr
                          key={mutation.id_mutasi}
                          className="border-b border-gray-100 hover:bg-gray-50 transition duration-150"
                        >
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(mutation.tanggal).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {mutation.product?.nama_produk || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {mutation.fromBranch?.nama_cabang || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {mutation.toBranch?.nama_cabang || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {isOutgoing ? (
                              <span className="text-rose-500">-{mutation.quantity}</span>
                            ) : (
                              <span className="text-emerald-500">+{mutation.quantity}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isOutgoing
                                  ? 'bg-rose-100 text-rose-600'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}
                            >
                              {isOutgoing ? 'Keluar' : 'Masuk'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
