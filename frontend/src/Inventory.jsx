import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Edit2, Plus, Trash2 } from "lucide-react";
import ProductFormModal from "./ProductFormModal";
import BranchContext from "./BranchContext";

const API_URL = "http://localhost:5000/api/products";
const MUTATION_EVENT = "stock-mutation-updated";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const isSavingRef = useRef(false);
  const pollingIntervalRef = useRef(null);

  const { selectedBranchId } = useContext(BranchContext);

  const normalizeProductStock = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const variantStockTotal = variants.reduce(
      (sum, variant) => sum + (Number(variant?.stock) || 0),
      0,
    );
    const baseStock = Number(product?.stok) || 0;
    const minimumStock = Number(product?.stok_minimum) || 10;
    const displayStock = Math.max(baseStock, variantStockTotal);

    return {
      ...product,
      stok: displayStock,
      stok_total: baseStock + variantStockTotal,
      stok_minimum: minimumStock,
    };
  };

  const refreshProducts = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await axios.get(API_URL, {
        params: { page: 1, limit: 1000, search: "", branch_id: selectedBranchId || undefined },
      });
      const data = response?.data?.data ?? response?.data ?? [];
      setProducts(Array.isArray(data) ? data.map(normalizeProductStock) : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Gagal memuat produk.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const response = await axios.get(API_URL, {
          params: { page: 1, limit: 1000, search: "", branch_id: selectedBranchId || undefined },
        });
        const data = response?.data?.data ?? response?.data ?? [];
        setProducts(Array.isArray(data) ? data.map(normalizeProductStock) : []);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || "Gagal memuat produk.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedBranchId]);

  useEffect(() => {
    const handleMutationUpdate = () => refreshProducts();
    window.addEventListener(MUTATION_EVENT, handleMutationUpdate);
    return () => window.removeEventListener(MUTATION_EVENT, handleMutationUpdate);
  }, []);

  useEffect(() => {
    const startPolling = () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => refreshProducts(), 10000);
    };
    startPolling();
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, []);

  const formatRupiah = (value) => {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return "Rp 0";
    return `Rp ${numericValue.toLocaleString("id-ID")}`;
  };

  const openCreateModal = () => { setEditingProduct(null); setIsModalOpen(true); };
  const openEditModal = (product) => { setEditingProduct(product); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const handleSubmitProduct = async (payload, productId) => {
    if (isSavingRef.current) return;
    try {
      isSavingRef.current = true;
      setErrorMessage("");
      const payloadWithBranch = { ...payload, branch_id: selectedBranchId || null };
      if (productId) {
        await axios.put(`${API_URL}/${productId}`, payloadWithBranch);
      } else {
        await axios.post(API_URL, payloadWithBranch);
      }
      window.dispatchEvent(new Event(MUTATION_EVENT));
      await refreshProducts();
    } catch (error) {
      const status = error?.response?.status;
      const msg = status === 409
        ? "SKU sudah terpakai. Gunakan SKU yang berbeda."
        : error?.response?.data?.message || "Gagal menyimpan produk.";
      setErrorMessage(msg);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDeleteProduct = async (product) => {
    const ok = window.confirm(`Hapus produk "${product?.name || ""}"?`);
    if (!ok) return;
    try {
      setErrorMessage("");
      await axios.delete(`${API_URL}/${product.id}`);
      window.dispatchEvent(new Event(MUTATION_EVENT));
      await refreshProducts();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Gagal menghapus produk.");
    }
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Katalog Produk</h1>
          <p className="text-sm text-gray-500">Kelola produk dan stok inventaris toko.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm flex items-center gap-2"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
          {errorMessage}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Memuat data...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  Belum ada produk. Klik "Tambah Produk" untuk mulai.
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const stok = Number(product.stok) || 0;
                const stokMin = Number(product.stok_minimum) || 10;
                const isLow = stok <= stokMin;
                return (
                  <tr
                    key={product?.id ?? product?.sku ?? `${product?.name ?? "product"}-${index}`}
                    className="border-b border-gray-100 hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="font-medium text-gray-800">{product?.name || "Nama Produk"}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{product?.sku || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatRupiah(product?.base_price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={isLow ? "text-rose-500 font-semibold" : "text-gray-700"}>
                        {stok}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">/ min {stokMin}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isLow
                          ? "bg-rose-100 text-rose-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}>
                        {isLow ? "Stok Rendah" : "Tersedia"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="text-gray-400 hover:text-blue-600 transition duration-150"
                          aria-label="Edit produk"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          className="text-gray-400 hover:text-rose-500 transition duration-150"
                          aria-label="Hapus produk"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ProductFormModal
          isOpen
          initialProduct={editingProduct}
          onClose={closeModal}
          onSubmit={handleSubmitProduct}
        />
      )}
    </div>
  );
};

export default Inventory;
