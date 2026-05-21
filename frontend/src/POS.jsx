import { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BranchContext from './BranchContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function getCategoryFromName(name) {
  const raw = normalizeText(name);
  if (!raw) return 'Food';
  if (/(kopi|coffee|teh|tea|susu|milk|jus|juice|minum|drink)/.test(raw)) return 'Beverage';
  if (/(roti|bread|donat|donut|croissant|bagel|bun|bakery)/.test(raw)) return 'Bakery';
  if (/(cake|kue|brownies|dessert|pudding|es krim|ice cream|cookies|cookie)/.test(raw)) return 'Dessert';
  return 'Food';
}

function CartIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.65 16H19a2 2 0 0 0 2-1.65L23 6H6" />
    </svg>
  );
}

function extractArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeProductsForPos(list) {
  return list.map((p) => {
    const variants = Array.isArray(p?.variants) ? p.variants : [];
    const stockFromVariants = variants.reduce((sum, v) => sum + (Number(v?.stock) || 0), 0);
    const stock = Number.isFinite(Number(p?.stock)) ? Number(p.stock) : stockFromVariants;
    const price = Number(p?.price ?? p?.base_price ?? 0) || 0;
    return {
      ...p,
      price,
      stock,
    };
  });
}

function normalizeCustomersForPos(list) {
  return list.map((c) => ({
    id: c?.id,
    name: c?.name,
    phone: c?.phone,
  }));
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [discountInput, setDiscountInput] = useState('');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [heldCart, setHeldCart] = useState([]);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const { selectedBranchId } = useContext(BranchContext);

  const categories = useMemo(() => ['All', 'Beverage', 'Food', 'Bakery', 'Dessert'], []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [productRes, customerRes, settingRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/products`, {
            headers,
            params: selectedBranchId ? { branch_id: selectedBranchId } : undefined,
          }),
          axios.get(`${API_BASE}/customers`, { headers }),
          axios.get(`${API_BASE}/settings`, { headers })
        ]);

        if (!cancelled) {
          if (productRes.status === 'fulfilled') {
            const rawProducts = extractArrayPayload(productRes.value.data);
            setProducts(normalizeProductsForPos(rawProducts));
          } else {
            setProducts([]);
          }

          if (customerRes.status === 'fulfilled') {
            const rawCustomers = extractArrayPayload(customerRes.value.data);
            setCustomers(normalizeCustomersForPos(rawCustomers));
          } else {
            setCustomers([]);
          }

          if (settingRes.status === 'fulfilled') {
            const settingData = settingRes.value.data;
            setServiceChargePercent(parseFloat(settingData.service_charge_percent) || 0);
            setTaxPercent(parseFloat(settingData.tax_percent) || 0);
          } else {
            // Default values if settings fetch fails
            setServiceChargePercent(0);
            setTaxPercent(0);
          }
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCustomers([]);
          setServiceChargePercent(0);
          setTaxPercent(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  const filteredProducts = useMemo(() => {
    const q = normalizeText(search);

    return products.filter((p) => {
      const name = normalizeText(p?.name);
      const category = getCategoryFromName(p?.name);
      const matchCategory = activeCategory === 'All' ? true : category === activeCategory;
      const matchSearch = q ? name.includes(q) : true;
      return matchCategory && matchSearch;
    });
  }, [products, search, activeCategory]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const discount = useMemo(() => {
    const raw = Number(discountInput);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.min(Math.floor(raw), subtotal);
  }, [discountInput, subtotal]);

  const total = useMemo(() => {
    const baseTotal = Math.max(0, subtotal - discount);
    const serviceChargeAmount = baseTotal * (serviceChargePercent / 100);
    const subtotalWithServiceCharge = baseTotal + serviceChargeAmount;
    const taxAmount = subtotalWithServiceCharge * (taxPercent / 100);
    return Math.max(0, subtotalWithServiceCharge + taxAmount);
  }, [subtotal, discount, serviceChargePercent, taxPercent]);

  async function refreshData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [productRes, customerRes, settingRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/products`, { headers }),
        axios.get(`${API_BASE}/customers`, { headers }),
        axios.get(`${API_BASE}/settings`, { headers })
      ]);

      if (productRes.status === 'fulfilled') {
        const rawProducts = extractArrayPayload(productRes.value.data);
        setProducts(normalizeProductsForPos(rawProducts));
      } else {
        setProducts([]);
      }

      if (customerRes.status === 'fulfilled') {
        const rawCustomers = extractArrayPayload(customerRes.value.data);
        setCustomers(normalizeCustomersForPos(rawCustomers));
      } else {
        setCustomers([]);
      }

      if (settingRes.status === 'fulfilled') {
        const settingData = settingRes.value.data;
        setServiceChargePercent(parseFloat(settingData.service_charge_percent) || 0);
        setTaxPercent(parseFloat(settingData.tax_percent) || 0);
      } else {
        // Default values if settings fetch fails
        setServiceChargePercent(0);
        setTaxPercent(0);
      }
    } catch {
      setProducts([]);
      setCustomers([]);
      setServiceChargePercent(0);
      setTaxPercent(0);
    } finally {
      setLoading(false);
    }
  }

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
        branch_id: selectedBranchId || null,
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
      setDiscountInput('');
      setCashReceivedInput('');
      await refreshData();
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

  function clearCart() {
    if (processing) return;
    setCart([]);
    setDiscountInput('');
    setCashReceivedInput('');
  }

  function holdCart() {
    if (processing) return;
    if (cart.length === 0) return;
    setHeldCart(cart);
    clearCart();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:pr-[32%]">
        <div className="text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Point of Sale</h1>
          <div className="mt-1 text-sm text-gray-500">Process customer transactions</div>
        </div>

        <div className="mt-6">
          <div className="rounded-lg bg-white shadow-sm p-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = c === activeCategory;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCategory(c)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      active
                        ? 'bg-black text-white'
                        : 'bg-transparent text-gray-700 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">Products</div>
              <div className="text-xs text-gray-500">Tap an item to add it to cart</div>
            </div>
            <div className="text-xs text-gray-500">
              {loading ? 'Loading…' : `${filteredProducts.length} items`}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(loading ? Array.from({ length: 8 }).map((_, idx) => ({ id: `s-${idx}` })) : filteredProducts).map(
              (p) => {
                if (loading) {
                  return <div key={p.id} className="h-[190px] rounded-lg bg-white shadow-sm" />;
                }

                const out = (Number(p.stock) || 0) <= 0;
                const low = (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) < 10;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={out}
                    className={[
                      'rounded-lg bg-white shadow-sm text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200',
                      out ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="h-[110px] rounded-t-lg bg-gray-100 flex items-center justify-center">
                      <CartIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="p-4">
                      <div className="line-clamp-1 text-sm font-semibold text-gray-900">{p.name}</div>
                      <div className="mt-1 text-sm font-semibold text-blue-600">{formatIdr(p.price)}</div>
                      <div className="mt-3 text-xs text-gray-500">
                        {low ? (
                          <span className="bg-red-500 text-white px-2 py-1 rounded">Stock: {p.stock ?? 0}</span>
                        ) : (
                          <span>Stock: {p.stock ?? 0}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow-lg p-6 md:fixed md:inset-y-0 md:right-0 md:mt-0 md:w-[32%] md:min-w-[360px] md:max-w-[460px] md:overflow-y-auto">
        <div className="text-left">
          <div className="text-lg font-bold text-gray-900">Shopping Cart</div>
          <div className="mt-1 text-sm text-gray-500">{cart.length} items</div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-800">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">General (no customer)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 max-h-[36vh] overflow-auto rounded-lg border border-gray-100">
          {cart.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Cart is empty.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.product_id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-left">
                      <div className="truncate text-sm font-semibold text-gray-900">{item.name}</div>
                      <div className="mt-1 text-xs text-gray-500">{formatIdr(item.price)}</div>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-900">
                      {formatIdr(item.price * item.quantity)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decQty(item.product_id)}
                        disabled={processing}
                        className="h-9 w-9 rounded-md border border-gray-200 bg-white text-lg leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        -
                      </button>
                      <div className="w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</div>
                      <button
                        type="button"
                        onClick={() => incQty(item.product_id)}
                        disabled={processing}
                        className="h-9 w-9 rounded-md border border-gray-200 bg-white text-lg leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-800">Discount (Rp)</label>
          <input
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value)}
            type="number"
            inputMode="numeric"
            min="0"
            className="mt-2 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="0"
          />
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>Subtotal</div>
            <div className="font-semibold text-gray-900">{formatIdr(subtotal)}</div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
            <div>Discount</div>
            <div className="font-semibold text-red-600">-{formatIdr(discount)}</div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="text-sm font-semibold text-gray-800">Total</div>
            <div className="text-2xl font-bold text-gray-900">{formatIdr(total)}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-semibold text-gray-800">Payment Method</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Cash', 'Transfer', 'QRIS'].map((m) => {
              const active = paymentMethod === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={[
                    'rounded-md border px-3 py-2 text-sm font-semibold transition',
                    active
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50',
                  ].join(' ')}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-800">Cash Received</label>
          <input
            value={cashReceivedInput}
            onChange={(e) => setCashReceivedInput(e.target.value)}
            type="number"
            inputMode="numeric"
            min="0"
            className="mt-2 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="0"
          />
          {paymentMethod === 'Cash' && cashReceivedInput ? (
            <div className="mt-2 text-xs text-gray-500">
              Change:{' '}
              <span className="font-semibold text-gray-900">
                {formatIdr(Math.max(0, (Number(cashReceivedInput) || 0) - total))}
              </span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={processing || cart.length === 0}
          className="mt-6 w-full rounded-md bg-gray-800 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? 'Processing…' : 'Pay'}
        </button>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={clearCart}
            disabled={processing || cart.length === 0}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            Clear Cart
          </button>
          <button
            type="button"
            onClick={holdCart}
            disabled={processing || cart.length === 0}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            Hold
          </button>
        </div>

        {heldCart.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (processing) return;
              if (cart.length > 0) return;
              setCart(heldCart);
              setHeldCart([]);
            }}
            disabled={processing || cart.length > 0}
            className="mt-4 w-full rounded-md border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Restore Hold
          </button>
        ) : null}
      </div>
    </div>
  );
}
