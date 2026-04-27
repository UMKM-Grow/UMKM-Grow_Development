import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Edit2, Trash2 } from 'lucide-react';
import ProductFormModal from './ProductFormModal';

const API_URL = 'http://localhost:5000/api/products';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const isSavingRef = useRef(false);

  const refreshProducts = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await axios.get(API_URL, { params: { page: 1, limit: 1000, search: '' } });
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
        const response = await axios.get(API_URL, { params: { page: 1, limit: 1000, search: '' } });
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
  }, []);

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
      if (productId) {
        await axios.put(`${API_URL}/${productId}`, payload);
      } else {
        await axios.post(API_URL, payload);
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Inventory</h1>
            <div className="mt-1 text-sm text-gray-500">Kelola katalog produk & varian</div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Tambah Produk
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm p-6">
          {loading ? (
            <div className="text-sm font-semibold text-gray-500">Memuat...</div>
          ) : errorMessage ? (
            <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          ) : products.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada produk.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <div
                  key={product?.id ?? product?.sku ?? `${product?.name ?? 'product'}-${index}`}
                  className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
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
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      );
                    })()}

                    <div className="absolute right-3 top-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                        aria-label="Edit produk"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
                        aria-label="Hapus produk"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-sm font-bold text-gray-900 line-clamp-2">{product?.name || 'Nama Produk'}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-700">
                      {formatRupiah(product?.base_price)}
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="mt-4 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Kelola Varian
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
