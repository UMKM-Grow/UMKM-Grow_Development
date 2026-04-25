import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [productRes, customerRes] = await Promise.all([
          axios.get(`${API_BASE}/products`, { headers }),
          axios.get(`${API_BASE}/customers`, { headers }),
        ]);

        if (!cancelled) {
          setProducts(Array.isArray(productRes.data) ? productRes.data : []);
          setCustomers(Array.isArray(customerRes.data) ? customerRes.data : []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCustomers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  function addToCart(product) {
    if (!product) return;
    if ((Number(product.stock) || 0) <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, Number(product.stock) || existing.quantity + 1);
        return prev.map((i) => (i.product_id === product.id ? { ...i, quantity: nextQty } : i));
      }

      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: 1,
          stock: Number(product.stock) || 0,
        },
      ];
    });
  }

  function incQty(productId) {
    const p = products.find((x) => x.id === productId);
    const maxStock = Number(p?.stock);

    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const nextQty = i.quantity + 1;
        return {
          ...i,
          quantity: Number.isFinite(maxStock) ? Math.min(nextQty, maxStock) : nextQty,
        };
      })
    );
  }

  function decQty(productId) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((i) => i.product_id !== productId);
      return prev.map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i));
    });
  }

  async function onCheckout() {
    if (processing) return;
    if (cart.length === 0) return;

    setProcessing(true);
    try {
      const payload = {
        customer_id: customerId ? Number(customerId) : null,
        payment_method: paymentMethod,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await axios.post(`${API_BASE}/pos/checkout`, payload, { headers });

      alert('Transaksi Berhasil!');
      setCart([]);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Transaksi gagal';
      alert(message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-[100svh] w-full bg-brand-dark text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="text-left">
            <div className="text-xs uppercase tracking-[0.24em] text-white/60">Digital POS</div>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Kasir</h1>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => setPaymentMethod('Cash')}
              className={[
                'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                paymentMethod === 'Cash'
                  ? 'border-white/20 bg-white/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Qris')}
              className={[
                'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                paymentMethod === 'Qris'
                  ? 'border-white/20 bg-white/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              Qris
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-10">
          <div className="md:col-span-7">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="text-left">
                <div className="text-sm font-semibold">Produk</div>
                <div className="text-xs text-white/60">Klik cepat untuk masuk keranjang</div>
              </div>
              <div className="text-xs text-white/50">{loading ? 'Memuat…' : `${products.length} item`}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {(loading ? Array.from({ length: 8 }).map((_, idx) => ({ id: `s-${idx}` })) : products).map(
                (p) => {
                  if (loading) {
                    return (
                      <div
                        key={p.id}
                        className="h-[140px] rounded-2xl border border-white/10 bg-white/5"
                      />
                    );
                  }

                  const out = (Number(p.stock) || 0) <= 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      disabled={out}
                      className={[
                        'group flex h-full flex-col overflow-hidden rounded-2xl border text-left transition',
                        out
                          ? 'cursor-not-allowed border-white/5 bg-white/5 opacity-60'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
                      ].join(' ')}
                    >
                      <div className="relative h-[84px] w-full bg-gradient-to-br from-white/10 to-white/0">
                        {p.image_url ? (
                          <img
                            alt={p.name}
                            src={p.image_url}
                            className="h-full w-full object-cover opacity-90"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <div className="line-clamp-1 text-sm font-semibold">{p.name}</div>
                        <div className="text-xs text-white/70">{formatIdr(p.price)}</div>
                        <div className="mt-auto text-[11px] text-white/50">Stok: {p.stock ?? 0}</div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="sticky top-4 rounded-3xl bg-brand-slate/30 p-4 backdrop-blur-md border border-white/10 md:border-l md:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <div className="text-sm font-semibold">Keranjang</div>
                  <div className="text-xs text-white/60">Struk belanja</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  disabled={cart.length === 0 || processing}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Reset
                </button>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-left text-xs font-semibold text-white/70">Pelanggan</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none ring-0 focus:border-white/20"
                >
                  <option value="">Umum (tanpa pelanggan)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 max-h-[42vh] overflow-auto rounded-2xl border border-white/10 bg-white/5">
                {cart.length === 0 ? (
                  <div className="p-4 text-left text-sm text-white/60">Keranjang masih kosong.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0 text-left">
                          <div className="truncate text-sm font-semibold">{item.name}</div>
                          <div className="text-xs text-white/60">{formatIdr(item.price)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decQty(item.product_id)}
                            disabled={processing}
                            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-lg leading-none transition hover:bg-white/10 disabled:opacity-50"
                          >
                            -
                          </button>
                          <div className="w-10 text-center text-sm font-semibold">{item.quantity}</div>
                          <button
                            type="button"
                            onClick={() => incQty(item.product_id)}
                            disabled={processing}
                            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-lg leading-none transition hover:bg-white/10 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-left text-xs font-semibold text-white/60">Total</div>
                <div className="mt-1 text-left font-display text-4xl font-semibold tracking-tight">
                  {formatIdr(total)}
                </div>
                <div className="mt-1 text-left text-xs text-white/50">Metode: {paymentMethod}</div>
              </div>

              <button
                type="button"
                onClick={onCheckout}
                disabled={processing || cart.length === 0}
                className="mt-4 w-full rounded-2xl bg-white px-4 py-4 text-base font-semibold text-brand-dark transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? 'MEMPROSES…' : 'BAYAR SEKARANG'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
