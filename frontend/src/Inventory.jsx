import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Edit2, Trash2 } from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import BranchContext from './BranchContext';

const API_URL = 'http://localhost:5000/api/products';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const isSavingRef = useRef(false);

  const { selectedBranchId } = useContext(BranchContext);

  const refreshProducts = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await axios.get(API_URL, {
        params: {
          page: 1,
          limit: 1000,
          search: '',
          branch_id: selectedBranchId || undefined,
        },
      });
      const data = response?.data?.data ?? response?.data ?? [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Gagal memuat produk.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await axios.get(API_URL, {
          params: {
            page: 1,
            limit: 1000,
            search: '',
            branch_id: selectedBranchId || undefined,
          },
        });
        const data = response?.data?.data ?? response?.data ?? [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Gagal memuat produk.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedBranchId]);

  const formatRupiah = (value) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) return 'Rp 0';
    return `Rp ${numericValue.toLocaleString('id-ID')}`;
  };

  const getProductImageSources = (product) => {
    const productId = product?.id ?? 0;
    const seed = encodeURIComponent(String(product?.id ?? product?.sku ?? productId));
    const raw = `${product?.name ?? ''} ${product?.sku ?? ''}`.trim().toLowerCase();

    let tags = 'product,apparel';
    if (raw.includes('kemeja') || raw.includes('shirt') || raw.includes('workshirt')) tags = 'shirt,workwear,office';
    else if (raw.includes('kaos') || raw.includes('tshirt') || raw.includes('t-shirt')) tags = 'tshirt,streetwear,apparel';
    else if (raw.includes('jaket') || raw.includes('jacket') || raw.includes('hoodie')) tags = 'jacket,streetwear,apparel';
    else if (raw.includes('celana') || raw.includes('pants') || raw.includes('trousers')) tags = 'pants,apparel,fashion';
    else if (raw.includes('rok') || raw.includes('skirt')) tags = 'skirt,apparel,fashion';
    else if (raw.includes('sepatu') || raw.includes('shoes') || raw.includes('sneakers')) tags = 'sneakers,shoes,streetwear';
    else if (raw.includes('tas') || raw.includes('bag')) tags = 'bag,leather,accessories';
    else if (raw.includes('batik')) tags = 'batik,shirt,fashion';
    else if (raw.includes('hijab') || raw.includes('kerudung')) tags = 'hijab,fashion,apparel';

    return {
      primary: `https://loremflickr.com/400/600/${tags}?lock=${productId}`,
      fallback: `https://picsum.photos/seed/${seed}/400/600?grayscale`
    };
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async (payload, productId) => {
    if (isSavingRef.current) return;
    try {
      isSavingRef.current = true;
      setErrorMessage('');
      const payloadWithBranch = {
        ...payload,
        branch_id: selectedBranchId || null,
      };

      if (productId) {
        await axios.put(`${API_URL}/${productId}`, payloadWithBranch);
      } else {
        await axios.post(API_URL, payloadWithBranch);
      }
      await refreshProducts();
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 409
          ? 'SKU sudah terpakai. Gunakan SKU yang berbeda.'
          : (error?.response?.data?.message || 'Gagal menyimpan produk.');
      setErrorMessage(msg);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDeleteProduct = async (product) => {
    const ok = window.confirm(`Hapus produk "${product?.name || ''}"?`);
    if (!ok) return;

    try {
      setErrorMessage('');
      await axios.delete(`${API_URL}/${product.id}`);
      await refreshProducts();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 md:p-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
        <h1 className="text-5xl md:text-7xl font-black text-brand-ice uppercase tracking-tighter">
          Katalog Produk
        </h1>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-brand-ice text-brand-dark font-black px-6 py-3 rounded-full hover:bg-white hover:scale-105 transition-all w-fit"
        >
          Tambah Produk Baru
        </button>
      </div>

      {loading ? (
        <div className="text-brand-ice/80 font-semibold">Memuat...</div>
      ) : errorMessage ? (
        <div className="text-brand-ice/80 font-semibold">{errorMessage}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <div
              key={product?.id ?? product?.sku ?? `${product?.name ?? 'product'}-${index}`}
              className="relative bg-brand-slate/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(163,193,214,0.2)]"
            >
              <div className="w-full aspect-[3/4] bg-brand-frost rounded-xl mb-5 overflow-hidden relative border border-white/5">
                {(() => {
                  const { primary, fallback } = getProductImageSources(product);
                  return (
                    <img
                      src={primary}
                      data-fallback={fallback}
                      onError={(e) => {
                        const img = e.currentTarget;
                        const next = img.dataset.fallback;
                        if (!next) return;
                        img.dataset.fallback = '';
                        img.src = next;
                      }}
                      alt={product?.name || 'Produk'}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  );
                })()}
              </div>

              <h2 className="text-xl font-bold text-white tracking-wide uppercase">
                {product?.name || 'Nama Produk'}
              </h2>
              <p className="text-brand-ice font-semibold mt-1">{formatRupiah(product?.base_price)}</p>

              <button
                type="button"
                onClick={() => openEditModal(product)}
                className="mt-5 w-full bg-brand-ice text-brand-dark font-bold py-2.5 rounded-lg hover:bg-white transition-colors"
              >
                Kelola Varian
              </button>

              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-brand-dark/60 transition-colors"
                  aria-label="Edit produk"
                >
                  <Edit2 size={16} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(product)}
                  className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-red-500/70 transition-colors"
                  aria-label="Hapus produk"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
