import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import BranchContext from "./BranchContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MUTATION_EVENT = "stock-mutation-updated";

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(num);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getCategoryFromName(name) {
  const raw = normalizeText(name);
  if (!raw) return "Food";
  if (/(kopi|coffee|teh|tea|susu|milk|jus|juice|minum|drink)/.test(raw))
    return "Beverage";
  if (/(roti|bread|donat|donut|croissant|bagel|bun|bakery)/.test(raw))
    return "Bakery";
  if (
    /(cake|kue|brownies|dessert|pudding|es krim|ice cream|cookies|cookie)/.test(
      raw,
    )
  )
    return "Dessert";
  return "Food";
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
    const stockFromVariants = variants.reduce(
      (sum, v) => sum + (Number(v?.stock) || 0),
      0,
    );
    const stock = Number.isFinite(Number(p?.stock))
      ? Number(p.stock)
      : stockFromVariants;
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
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(false);
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const [heldCart, setHeldCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);
  const [shiftStatus, setShiftStatus] = useState("checking"); // 'checking', 'active', 'inactive'
  const [shiftData, setShiftData] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);
  const [saldoAwal, setSaldoAwal] = useState("");
  const [saldoAkhir, setSaldoAkhir] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [setting, setSetting] = useState(null);
  const { selectedBranchId } = useContext(BranchContext);

  useEffect(() => {
    let cancelled = false;

    const checkShiftStatus = async () => {
      if (!selectedBranchId) {
        if (!cancelled) {
          setShiftStatus("inactive");
          setShiftData(null);
          setLoadingShift(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoadingShift(true);
        }

        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;

        if (!user || !user.id) {
          if (!cancelled) {
            setShiftStatus("inactive");
            setShiftData(null);
            setLoadingShift(false);
          }
          return;
        }

        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const response = await axios.get(`${API_BASE}/shifts/active`, {
          headers,
          params: {
            user_id: user.id,
            branch_id: selectedBranchId,
          },
        });

        if (cancelled) return;

        if (response.data?.data) {
          setShiftStatus("active");
          setShiftData(response.data.data);
        } else {
          setShiftStatus("inactive");
          setShiftData(null);
        }
      } catch (error) {
        if (cancelled) return;

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }

        if (error.response?.status === 404) {
          setShiftStatus("inactive");
          setShiftData(null);
          return;
        }

        setShiftStatus("inactive");
        setShiftData(null);

        if (error.response?.status === 500) {
          alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
        } else if (!error.response) {
          alert(error?.message || "Terjadi kesalahan");
        }
      } finally {
        if (!cancelled) {
          setLoadingShift(false);
        }
      }
    };

    checkShiftStatus();

    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  const categories = useMemo(
    () => ["All", "Beverage", "Food", "Bakery", "Dessert"],
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const [productRes, customerRes, settingRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/products`, {
            headers,
            params: selectedBranchId
              ? { branch_id: selectedBranchId }
              : undefined,
          }),
          axios.get(`${API_BASE}/customers`, { headers }),
          axios.get(`${API_BASE}/settings`, { headers }),
        ]);

        if (!cancelled) {
          if (productRes.status === "fulfilled") {
            const rawProducts = extractArrayPayload(productRes.value.data);
            setProducts(normalizeProductsForPos(rawProducts));
          } else {
            setProducts([]);
          }

          if (customerRes.status === "fulfilled") {
            const rawCustomers = extractArrayPayload(customerRes.value.data);
            setCustomers(normalizeCustomersForPos(rawCustomers));
          } else {
            setCustomers([]);
          }

          if (settingRes.status === "fulfilled") {
            const settingData = settingRes.value.data;
            setSetting(settingData);
            setServiceChargePercent(
              parseFloat(settingData.service_charge_percent) || 0,
            );
            setTaxPercent(parseFloat(settingData.tax_percent) || 0);
          } else {
            // Default values if settings fetch fails
            setServiceChargePercent(0);
            setTaxPercent(0);
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          } else if (error.response && error.response.status === 500) {
            alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
          } else {
            setProducts([]);
            setCustomers([]);
            setServiceChargePercent(0);
            setTaxPercent(0);
          }
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
      const matchCategory =
        activeCategory === "All" ? true : category === activeCategory;
      const matchSearch = q ? name.includes(q) : true;
      return matchCategory && matchSearch;
    });
  }, [products, search, activeCategory]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  useEffect(() => {
    setAppliedPromo(false);
    setPromoDiscount(0);
    setPromoMessage("");
  }, [subtotal, selectedBranchId]);

  const discount = useMemo(() => {
    const raw = Number(promoDiscount);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.min(Math.floor(raw), subtotal);
  }, [promoDiscount, subtotal]);

  const subtotalAfterDiscount = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const serviceChargeAmount = useMemo(() => {
    return Math.round(subtotalAfterDiscount * (serviceChargePercent / 100));
  }, [subtotalAfterDiscount, serviceChargePercent]);

  const taxAmount = useMemo(() => {
    return Math.round(
      (subtotalAfterDiscount + serviceChargeAmount) * (taxPercent / 100),
    );
  }, [subtotalAfterDiscount, serviceChargeAmount, taxPercent]);

  const total = useMemo(() => {
    return Math.max(0, subtotalAfterDiscount + serviceChargeAmount + taxAmount);
  }, [subtotalAfterDiscount, serviceChargeAmount, taxAmount]);

  async function refreshData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [productRes, customerRes, settingRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/products`, {
          headers,
          params: selectedBranchId
            ? { branch_id: selectedBranchId }
            : undefined,
        }),
        axios.get(`${API_BASE}/customers`, { headers }),
        axios.get(`${API_BASE}/settings`, { headers }),
      ]);

      if (productRes.status === "fulfilled") {
        const rawProducts = extractArrayPayload(productRes.value.data);
        setProducts(normalizeProductsForPos(rawProducts));
      } else {
        setProducts([]);
      }

      if (customerRes.status === "fulfilled") {
        const rawCustomers = extractArrayPayload(customerRes.value.data);
        setCustomers(normalizeCustomersForPos(rawCustomers));
      } else {
        setCustomers([]);
      }

      if (settingRes.status === "fulfilled") {
        const settingData = settingRes.value.data;
        setSetting(settingData);
        setServiceChargePercent(
          parseFloat(settingData.service_charge_percent) || 0,
        );
        setTaxPercent(parseFloat(settingData.tax_percent) || 0);
      } else {
        // Default values if settings fetch fails
        setServiceChargePercent(0);
        setTaxPercent(0);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (error.response && error.response.status === 500) {
        alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
      } else {
        setProducts([]);
        setCustomers([]);
        setServiceChargePercent(0);
        setTaxPercent(0);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyPromo() {
    if (promoApplying) return;
    if (!promoCode.trim()) {
      setPromoMessage("Masukkan kode promo terlebih dahulu");
      return;
    }
    if (subtotal <= 0) {
      setPromoMessage("Keranjang kosong");
      return;
    }

    setPromoApplying(true);
    setPromoMessage("");
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.post(
        `${API_BASE}/promos/verify`,
        {
          kode_promo: promoCode.trim(),
          total_belanja: subtotal,
          branch_id: selectedBranchId || null,
        },
        { headers },
      );

      const isValidPromo = response.data?.valid !== false;
      const discountAmount = Number(response.data?.total_diskon) || 0;

      if (!isValidPromo || discountAmount <= 0) {
        setAppliedPromo(false);
        setPromoDiscount(0);
        setPromoMessage(response.data?.message || "Kode promo tidak valid");
        return;
      }

      setPromoDiscount(discountAmount);
      setAppliedPromo(true);
      setPromoMessage(
        `Promo berhasil diterapkan: -${formatIdr(discountAmount)}`,
      );
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        } else if (error.response.status === 500) {
          alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
          return;
        }
      }
      setAppliedPromo(false);
      setPromoDiscount(0);
      setPromoMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Kode promo tidak valid",
      );
    } finally {
      setPromoApplying(false);
    }
  }

  function addToCart(product) {
    if (!product) return;
    if ((Number(product.stock) || 0) <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        const nextQty = Math.min(
          existing.quantity + 1,
          Number(product.stock) || existing.quantity + 1,
        );
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: nextQty } : i,
        );
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
          quantity: Number.isFinite(maxStock)
            ? Math.min(nextQty, maxStock)
            : nextQty,
        };
      }),
    );
  }

  function decQty(productId) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1)
        return prev.filter((i) => i.product_id !== productId);
      return prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  }

  async function searchCustomer() {
    if (!customerPhone.trim()) {
      setSelectedCustomer(null);
      return;
    }
    setCustomerSearching(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.get(`${API_BASE}/members/search`, {
        headers,
        params: { nomor_telepon: customerPhone.trim() },
      });
      setSelectedCustomer(response.data.data || null);
    } catch (error) {
      console.error("Error searching customer:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (error.response && error.response.status === 500) {
        alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
      } else {
        setSelectedCustomer(null);
      }
    } finally {
      setCustomerSearching(false);
    }
  }

  async function onCheckout() {
    if (processing || loadingShift) return;
    if (cart.length === 0) return;

    if (!selectedBranchId) {
      alert("Silakan pilih cabang terlebih dahulu");
      return;
    }

    if (!shiftData || shiftStatus !== "active") {
      alert("Silakan buka shift terlebih dahulu sebelum melakukan transaksi");
      return;
    }

    if (paymentMethod === "Cash") {
      const cashReceived = Number(cashReceivedInput) || 0;
      if (cashReceived < total) {
        alert("Uang tunai yang diterima kurang dari total pembayaran");
        return;
      }
    }

    setProcessing(true);
    try {
      const payload = {
        customer_id:
          selectedCustomer?.id || (customerId ? Number(customerId) : null),
        branch_id: selectedBranchId || null,
        payment_method: paymentMethod,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        promo_code:
          appliedPromo && promoCode.trim()
            ? promoCode.trim().toUpperCase()
            : null,
        discount_amount: appliedPromo ? discount : 0,
      };

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const checkoutResponse = await axios.post(
        `${API_BASE}/pos/checkout`,
        payload,
        { headers },
      );

      console.log("[POS Checkout] selectedCustomer:", selectedCustomer);
      console.log("[POS Checkout] subtotal:", subtotal);
      console.log("[POS Checkout] discount:", discount);
      console.log("[POS Checkout] total:", total);

      let pointsAdded = 0;
      if (selectedCustomer && selectedCustomer.id && subtotal > 0) {
        try {
          const pointsRes = await axios.post(
            `${API_BASE}/members/add-points`,
            {
              member_id: selectedCustomer.id,
              amount: subtotal,
            },
            { headers },
          );
          console.log("[POS Checkout] pointsRes:", pointsRes.data);
          pointsAdded = pointsRes.data?.points_added || 0;
          if (pointsRes.data?.data) {
            setSelectedCustomer(pointsRes.data.data);
          }
        } catch (pointError) {
          console.error(
            "Error adding points:",
            pointError.response?.data || pointError.message,
          );
        }
      }

      // Prepare receipt data
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      const selectedCustomerData = customers.find(
        (c) => c.id === Number(customerId),
      );

      const checkoutData = checkoutResponse?.data?.data || {};
      const receipt = {
        transactionId: checkoutData.transaction_id || Date.now(),
        date: new Date().toLocaleDateString("id-ID"),
        time: new Date().toLocaleTimeString("id-ID"),
        cashierName: user?.name || "Kasir",
        customerName:
          selectedCustomerData?.name || selectedCustomer?.name || "Umum",
        items: [...cart],
        subtotal: Number(checkoutData.subtotal) || subtotalAfterDiscount,
        discount: Number(checkoutData.discount_amount) || discount,
        serviceChargeAmount:
          Number(checkoutData.service_charge_amount) || serviceChargeAmount,
        serviceChargePercent,
        taxAmount: Number(checkoutData.tax_amount) || taxAmount,
        taxPercent,
        paymentMethod: paymentMethod,
        cashReceived: Number(cashReceivedInput) || 0,
        change: Math.max(
          0,
          (Number(cashReceivedInput) || 0) -
            (Number(checkoutData.total_amount) || total),
        ),
        total: Number(checkoutData.total_amount) || total,
      };

      setReceiptData(receipt);
      setShowReceipt(true);

      // Broadcast event ke semua listeners (termasuk Inventory page)
      window.dispatchEvent(new Event(MUTATION_EVENT));

      await refreshData();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (error.response && error.response.status === 500) {
        alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
      } else {
        const message =
          error?.response?.data?.message || error?.message || "Transaksi gagal";
        alert(message);
      }
    } finally {
      setProcessing(false);
    }
  }

  function clearCart() {
    if (processing) return;
    setCart([]);
    setPromoCode("");
    setPromoDiscount(0);
    setPromoMessage("");
    setAppliedPromo(false);
    setCashReceivedInput("");
  }

  function holdCart() {
    if (processing) return;
    if (cart.length === 0) return;
    setHeldCart(cart);
    clearCart();
  }

  // Shift management functions
  const handleOpenShift = async () => {
    if (!saldoAwal || loadingShift) return;

    // Validate saldoAwal is a valid number and not negative
    const saldoAwalNumber = parseFloat(saldoAwal);
    if (isNaN(saldoAwalNumber) || saldoAwalNumber < 0) {
      alert("Saldo awal harus berupa angka yang valid dan tidak negatif");
      return;
    }

    setLoadingShift(true);
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user || !user.id || !selectedBranchId) {
        throw new Error("User atau branch tidak valid");
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.post(
        `${API_BASE}/shifts/start`,
        {
          user_id: user.id,
          branch_id: selectedBranchId,
          saldo_awal: saldoAwalNumber,
        },
        { headers },
      );

      if (response.data && response.data.data) {
        setShiftStatus("active");
        setShiftData(response.data.data);
        setSaldoAwal("");
        alert("Shift berhasil dibuka!");
      } else {
        throw new Error(response.data?.message || "Gagal membuka shift");
      }
    } catch (error) {
      console.error("Error opening shift:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (error.response && error.response.status === 500) {
        alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
      } else {
        alert(
          error.response?.data?.message ||
            error?.message ||
            "Gagal membuka shift",
        );
      }
    } finally {
      setLoadingShift(false);
    }
  };

  const handleCloseShift = async () => {
    if (!shiftData || loadingShift) return;

    // Show close modal instead of immediately closing
    setSaldoAkhir(shiftData.saldo_awal || 0); // Initialize with opening balance
    setShowCloseModal(true);
  };

  // Function to actually close the shift from modal
  const handleConfirmCloseShift = async () => {
    if (!shiftData || loadingShift || saldoAkhir === "") return;

    const saldoAkhirNumber = parseFloat(saldoAkhir);
    if (
      Number.isNaN(saldoAkhirNumber) ||
      saldoAkhirNumber < Number(shiftData.saldo_awal || 0)
    ) {
      alert(
        "Saldo akhir harus berupa angka valid dan tidak boleh lebih kecil dari saldo awal",
      );
      return;
    }

    setLoadingShift(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.put(
        `${API_BASE}/shifts/end`,
        {
          shift_id: shiftData.id,
          saldo_akhir: saldoAkhirNumber,
        },
        { headers },
      );

      if (response.data && response.data.data) {
        setShiftStatus("inactive");
        setShiftData(null);
        setShowCloseModal(false);
        setSaldoAkhir("");
        alert("Shift berhasil ditutup!");
      } else {
        throw new Error(response.data?.message || "Gagal menutup shift");
      }
    } catch (error) {
      console.error("Error closing shift:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (error.response && error.response.status === 500) {
        alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
      } else {
        alert(
          error.response?.data?.message ||
            error?.message ||
            "Gagal menutup shift",
        );
      }
    } finally {
      setLoadingShift(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 md:pr-[32%]">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Point of Sale
            </h1>
            <div className="mt-1 text-sm text-gray-500">
              Process customer transactions
            </div>
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
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-black text-white"
                          : "bg-transparent text-gray-700 hover:bg-gray-100",
                      ].join(" ")}
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
                <div className="text-sm font-semibold text-gray-900">
                  Products
                </div>
                <div className="text-xs text-gray-500">
                  Tap an item to add it to cart
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {loading ? "Loading…" : `${filteredProducts.length} items`}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {(loading
                ? Array.from({ length: 8 }).map((_, idx) => ({
                    id: `s-${idx}`,
                  }))
                : filteredProducts
              ).map((p) => {
                if (loading) {
                  return (
                    <div
                      key={p.id}
                      className="h-[190px] rounded-lg bg-white shadow-sm"
                    />
                  );
                }

                const out = (Number(p.stock) || 0) <= 0;
                const low =
                  (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) < 10;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={out}
                    className={[
                      "rounded-lg bg-white shadow-sm text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200",
                      out ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <div className="h-[110px] rounded-t-lg bg-gray-100 flex items-center justify-center">
                      <CartIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="p-4">
                      <div className="line-clamp-1 text-sm font-semibold text-gray-900">
                        {p.name}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-blue-600">
                        {formatIdr(p.price)}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {low ? (
                          <span className="bg-red-500 text-white px-2 py-1 rounded">
                            Stock: {p.stock ?? 0}
                          </span>
                        ) : (
                          <span>Stock: {p.stock ?? 0}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white shadow-lg p-6 md:fixed md:inset-y-0 md:right-0 md:mt-0 md:w-[32%] md:min-w-[360px] md:max-w-[460px] md:overflow-y-auto">
          <div className="text-left">
            <div className="text-lg font-bold text-gray-900">Shopping Cart</div>
            <div className="mt-1 text-sm text-gray-500">
              {cart.length} items
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-800">
              Customer
            </label>
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

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-800">
              Customer / Member
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Nomor telepon customer"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchCustomer();
                }}
                className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={searchCustomer}
                disabled={customerSearching}
                className="rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {customerSearching ? "Cari..." : "Cari"}
              </button>
            </div>

            {selectedCustomer ? (
              <div className="mt-3 rounded-lg bg-blue-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  {selectedCustomer.name}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {selectedCustomer.phone}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Poin:
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {selectedCustomer.loyalty_points} pts
                  </span>
                  <span className="text-xs text-gray-500">
                    • {selectedCustomer.level}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerPhone("");
                  }}
                  className="mt-2 text-xs font-semibold text-red-500 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            ) : customerPhone && !customerSearching ? (
              <div className="mt-3 text-xs text-gray-500">
                Customer tidak ditemukan
              </div>
            ) : null}
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
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatIdr(item.price)}
                        </div>
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
                        <div className="w-10 text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </div>
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
            <label className="block text-sm font-semibold text-gray-800">
              Input Kode Promo
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  if (appliedPromo) {
                    setAppliedPromo(false);
                    setPromoDiscount(0);
                    setPromoMessage("");
                  }
                }}
                type="text"
                className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. KEMERDEKAAN"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoApplying || !promoCode.trim() || subtotal <= 0}
                className="rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoApplying ? "Applying…" : "Terapkan"}
              </button>
            </div>
            {promoMessage ? (
              <div className="mt-2 text-sm text-gray-600">{promoMessage}</div>
            ) : null}
          </div>

          <div className="mt-5 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <div>Subtotal</div>
              <div className="font-semibold text-gray-900">
                {formatIdr(subtotal)}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
              <div>Diskon</div>
              <div className="font-semibold text-red-600">
                -{formatIdr(discount)}
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-sm font-semibold text-gray-800">
                Total Bayar
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatIdr(total)}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-gray-800">
              Payment Method
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Cash", "Transfer", "QRIS"].map((m) => {
                const active = paymentMethod === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={[
                      "rounded-md border px-3 py-2 text-sm font-semibold transition",
                      active
                        ? "border-blue-500 text-blue-600 bg-white"
                        : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tutup Shift Button */}
          {shiftStatus === "active" && (
            <div className="mt-5">
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={loadingShift}
                className="w-full rounded-md bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loadingShift ? "Menutup..." : "Tutup Shift"}
              </button>
            </div>
          )}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-800">
              Cash Received
            </label>
            <input
              value={cashReceivedInput}
              onChange={(e) => setCashReceivedInput(e.target.value)}
              type="number"
              inputMode="numeric"
              min="0"
              className="mt-2 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="0"
            />
            {paymentMethod === "Cash" && cashReceivedInput ? (
              <div className="mt-2 text-xs text-gray-500">
                Change:{" "}
                <span className="font-semibold text-gray-900">
                  {formatIdr(
                    Math.max(0, (Number(cashReceivedInput) || 0) - total),
                  )}
                </span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={processing || cart.length === 0 || loadingShift}
            className="mt-6 w-full rounded-md bg-gray-800 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing
              ? "Processing…"
              : loadingShift
                ? "Checking shift…"
                : "Pay"}
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

      {/* Shift Opening Modal */}
      {shiftStatus === "inactive" && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Shift Belum Dibuka
            </h2>
            <p className="text-gray-600 mb-6">
              Anda perlu membuka shift sebelum dapat melakukan transaksi.
            </p>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Saldo Awal
              </label>
              <input
                type="number"
                value={saldoAwal}
                onChange={(e) => setSaldoAwal(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan saldo awal"
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShiftStatus("checking")}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleOpenShift}
                disabled={loadingShift || !saldoAwal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingShift ? "Membuka..." : "Buka Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Closing Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tutup Shift
            </h2>
            <p className="text-gray-600 mb-6">
              Masukkan saldo akhir untuk menutup shift ini.
            </p>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Saldo Akhir
              </label>
              <input
                type="number"
                value={saldoAkhir}
                onChange={(e) => setSaldoAkhir(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan saldo akhir"
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                disabled={loadingShift || !saldoAkhir}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loadingShift ? "Menutup..." : "Tutup Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <style>{`
      @media print {
        body * {
          visibility: hidden;
        }
        #receipt-content, #receipt-content * {
          visibility: visible;
        }
        #receipt-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `}</style>

      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div id="receipt-content" className="p-6 font-mono text-sm">
              {/* Header Toko */}
              <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                <h2 className="text-lg font-bold">
                  {setting?.nama_toko || "UMKM Grow"}
                </h2>
                {setting?.alamat && (
                  <p className="text-gray-600 mt-1">{setting.alamat}</p>
                )}
                {setting?.nomor_telepon && (
                  <p className="text-gray-600 mt-1">{setting.nomor_telepon}</p>
                )}
              </div>

              {/* Detail Transaksi */}
              <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{receiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{receiptData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{receiptData.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{receiptData.customerName}</span>
                </div>
              </div>

              {/* Daftar Belanjaan */}
              <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                {receiptData.items.map((item, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>
                        {item.quantity} x {formatIdr(item.price)}
                      </span>
                      <span>{formatIdr(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rincian Biaya */}
              <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatIdr(receiptData.subtotal)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatIdr(receiptData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>
                    Service Charge (
                    {Number(receiptData.serviceChargePercent) || 0}%):
                  </span>
                  <span>{formatIdr(receiptData.serviceChargeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak ({Number(receiptData.taxPercent) || 0}%):</span>
                  <span>{formatIdr(receiptData.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>{formatIdr(receiptData.total)}</span>
                </div>
              </div>

              {/* Pembayaran */}
              <div className="text-center">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span>{receiptData.paymentMethod}</span>
                </div>
                {receiptData.paymentMethod === "Cash" && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai:</span>
                      <span>{formatIdr(receiptData.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span>{formatIdr(receiptData.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
                <p className="text-gray-600">Terima kasih telah berbelanja!</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 flex gap-3 no-print">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700"
              >
                🖨️ Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedCustomerData = customers.find(
                    (c) => c.id === Number(customerId),
                  );
                  const phone =
                    selectedCustomerData?.phone ||
                    selectedCustomer?.phone ||
                    "";
                  const message = `Terima kasih telah berbelanja di ${setting?.nama_toko || "UMKM Grow"}. Total belanja Anda adalah ${formatIdr(receiptData.total)}.`;
                  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, "_blank");
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700"
              >
                📱 Kirim WA
              </button>
            </div>
            <div className="px-4 pb-4 no-print">
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  setReceiptData(null);
                  clearCart();
                }}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md font-semibold hover:bg-gray-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
