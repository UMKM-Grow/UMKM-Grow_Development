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

  // Update from_branch_id ketika selectedBranchId berubah
  useEffect(() => {
    if (selectedBranchId) {
      setForm((prev) => ({ ...prev, from_branch_id: selectedBranchId }));
      loadProducts(selectedBranchId);
      loadMutations();
    }
  }, [selectedBranchId]);

  // Load products dari branch yang dipilih
  const loadProducts = async (branchId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products?branch_id=${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      const productsData = Array.isArray(data) ? data : data?.data ?? [];
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load mutation history
  const loadMutations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mutations?branch_id=${selectedBranchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
      // Validasi
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
          'Authorization': `Bearer ${token}`,
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
      
      // Broadcast event ke semua listeners (termasuk Inventory page)
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

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    return product ? `${product.nama_produk} (Stok: ${product.stok})` : '';
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
    error: 'bg-red-50 border border-red-200 text-red-800',
    success: 'bg-green-50 border border-green-200 text-green-800',
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Transfer Mutasi Stok</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pindahkan stok barang antar cabang dengan keamanan transaksi database penuh (ACID Transaction).
      </p>

      {message && (
        <div className={`mt-4 rounded-lg p-4 ${messageStyles[messageType] || messageStyles.error}`}>
          {messageText}
        </div>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Form Mutasi */}
        <form onSubmit={handleSubmit} className="lg:col-span-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900">Form Mutasi</h2>

          <label className="mt-4 block text-sm font-medium text-gray-700">Cabang Asal</label>
          <input
            type="text"
            value={getBranchName(form.from_branch_id)}
            disabled
            className="mt-1 w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">Pilih Barang</label>
          <select
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
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

          <label className="mt-4 block text-sm font-medium text-gray-700">Jumlah (Qty)</label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            required
            min="1"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Masukkan jumlah"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">Cabang Tujuan</label>
          <select
            name="to_branch_id"
            value={form.to_branch_id}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">-- Pilih Cabang Tujuan --</option>
            {getTargetBranches().map((branch) => (
              <option key={branch.id_cabang} value={branch.id_cabang}>
                {branch.nama_cabang}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Catatan <span className="text-xs text-gray-500">(Opsional)</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows="3"
            placeholder="Contoh: Bantuan stok akhir pekan"
          />

          <button
            type="submit"
            disabled={submitting || loading}
            className="mt-6 w-full inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Proses Mutasi'}
          </button>
        </form>

        {/* Tabel Riwayat Mutasi */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Mutasi</h2>
          <p className="mt-1 text-xs text-gray-500">Menampilkan mutasi masuk dan keluar dari/ke cabang ini</p>

          {mutations.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Belum ada riwayat mutasi.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Tanggal</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Barang</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Dari</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Ke</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mutations.map((mutation) => {
                    const isOutgoing = mutation.from_branch_id === selectedBranchId;
                    return (
                      <tr key={mutation.id_mutasi} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">
                          {new Date(mutation.tanggal).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-3 py-2 text-gray-900 font-medium">
                          {mutation.product?.nama_produk || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {mutation.fromBranch?.nama_cabang || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {mutation.toBranch?.nama_cabang || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-900">
                          {isOutgoing ? (
                            <span className="text-red-600">-{mutation.quantity}</span>
                          ) : (
                            <span className="text-green-600">+{mutation.quantity}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              isOutgoing
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
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
  );
}
