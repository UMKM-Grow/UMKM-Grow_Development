import { useContext, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import BranchContext from "./BranchContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LowStockAlert() {
  const { selectedBranchId } = useContext(BranchContext);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedBranchId) {
      setLowStockProducts([]);
      return;
    }

    const controller = new AbortController();
    const token = localStorage.getItem("token");

    const fetchLowStock = async () => {
      setLoading(true);
      setError("");

      try {
        const url = new URL(`${API_BASE}/products/low-stock`);
        url.searchParams.set("branch_id", selectedBranchId);

        const response = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (response.status === 404) {
          setLowStockProducts([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const payload = await response.json();
        setLowStockProducts(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Gagal memuat data stok rendah.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();

    return () => controller.abort();
  }, [selectedBranchId]);

  return (
    <div className="rounded-[28px] border border-red-200 bg-red-50 shadow-soft p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-red-900">
            ⚠️ Peringatan Stok Menipis
          </h2>
          <p className="mt-1 text-sm text-red-600">
            Daftar produk yang stoknya di bawah batas minimum.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle size={22} />
        </div>
      </div>

      <div className="mt-6 min-h-[150px]">
        {!selectedBranchId ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-100/50 px-4 py-12 text-center text-sm text-red-500">
            Pilih cabang terlebih dahulu untuk melihat peringatan stok.
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-100/50 px-4 py-12 text-center text-sm text-red-500">
            Memuat data...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-300 bg-red-100 px-4 py-12 text-center text-sm text-red-700">
            {error}
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 px-4 py-12 text-center text-sm text-green-700">
            ✅ Semua stok produk aman!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-red-200 bg-white">
            <table className="min-w-full divide-y divide-red-200 text-sm">
              <thead className="bg-red-50 text-red-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Nama Produk
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Sisa Stok</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Batas Minimum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {lowStockProducts.map((item) => (
                  <tr key={item.id} className="bg-red-50/30">
                    <td className="px-4 py-3 text-red-900">{item.name}</td>
                    <td className="px-4 py-3 text-red-800 font-semibold">
                      {item.stok}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700">
                      {item.stok_minimum}
                    </td>
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
