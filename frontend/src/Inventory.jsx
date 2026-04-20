import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/products';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await axios.get(API_URL);
        const data = response?.data?.data ?? response?.data ?? [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Gagal memuat produk.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatRupiah = (value) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) return 'Rp 0';
    return `Rp ${numericValue.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 md:p-12">
      <h1 className="text-5xl md:text-7xl font-black text-brand-ice uppercase tracking-tighter mb-12">
        Katalog Produk
      </h1>

      {loading ? (
        <div className="text-brand-ice/80 font-semibold">Memuat...</div>
      ) : errorMessage ? (
        <div className="text-brand-ice/80 font-semibold">{errorMessage}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <div
              key={product?.id ?? product?.sku ?? `${product?.name ?? 'product'}-${index}`}
              className="bg-brand-slate/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(163,193,214,0.2)]"
            >
              <div className="w-full aspect-[3/4] bg-brand-frost rounded-xl mb-5 overflow-hidden relative border border-white/5" />

              <h2 className="text-xl font-bold text-white tracking-wide uppercase">
                {product?.name || 'Nama Produk'}
              </h2>
              <p className="text-brand-ice font-semibold mt-1">{formatRupiah(product?.base_price)}</p>

              <button className="mt-5 w-full bg-brand-ice text-brand-dark font-bold py-2.5 rounded-lg hover:bg-brand-ice/90 transition-colors">
                Kelola Varian
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
