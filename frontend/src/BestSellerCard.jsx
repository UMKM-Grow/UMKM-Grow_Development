import { useContext, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import BranchContext from './BranchContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BestSellerCard() {
  const { selectedBranchId } = useContext(BranchContext);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedBranchId) {
      setBestSellers([]);
      return;
    }

    const controller = new AbortController();
    const token = localStorage.getItem('token');

    const fetchBestSellers = async () => {
      setLoading(true);
      setError('');

      try {
        const url = new URL(`${API_BASE}/analytics/best-seller`);
        url.searchParams.set('branch_id', selectedBranchId);

        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const payload = await response.json();
        setBestSellers(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          if (err.message === 'Server returned 401') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          setError('Gagal memuat data best seller.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();

    return () => controller.abort();
  }, [selectedBranchId]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-soft p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">🏆 Top 5 Produk Terlaris</h2>
          <p className="mt-1 text-sm text-slate-500">
            Menampilkan produk terlaris di cabang yang dipilih.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Trophy size={22} />
        </div>
      </div>

      <div className="mt-6 min-h-[200px]">
        {!selectedBranchId ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            Pilih cabang terlebih dahulu untuk melihat produk terlaris.
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            Memuat data...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-12 text-center text-sm text-red-700">
            {error}
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            Belum ada data penjualan di cabang ini.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Peringkat</th>
                  <th className="px-4 py-3 text-left font-medium">Nama Produk</th>
                  <th className="px-4 py-3 text-right font-medium">Jumlah Terjual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bestSellers.map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-4 py-3 text-slate-600">{item.rank}</td>
                    <td className="px-4 py-3 text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.total_terjual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
