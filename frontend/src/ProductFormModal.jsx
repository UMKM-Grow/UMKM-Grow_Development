import { useRef, useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

const ProductFormModal = ({ isOpen, initialProduct, onClose, onSubmit }) => {
  const isEditing = Boolean(initialProduct?.id);

  const isSubmittingRef = useRef(false);
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id === null || typeof initialProduct?.category_id === 'undefined'
      ? ''
      : String(initialProduct.category_id)
  );
  const [basePrice, setBasePrice] = useState(
    typeof initialProduct?.base_price === 'undefined' || initialProduct?.base_price === null
      ? ''
      : String(initialProduct.base_price)
  );
  const [sku, setSku] = useState(initialProduct?.sku ?? '');
  const [variants, setVariants] = useState(() => {
    const initialVariants = Array.isArray(initialProduct?.variants) ? initialProduct.variants : [];
    return initialVariants.map(v => ({
      variant_name: v?.variant_name ?? '',
      additional_price:
        typeof v?.additional_price === 'undefined' || v?.additional_price === null ? '' : String(v.additional_price),
      stock: typeof v?.stock === 'undefined' || v?.stock === null ? '' : String(v.stock),
      sku_variant: v?.sku_variant ?? ''
    }));
  });
  const [submitting, setSubmitting] = useState(false);

  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      { variant_name: '', additional_price: '', stock: '', sku_variant: '' }
    ]);
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || isSubmittingRef.current) return;

    const normalizedCategoryId = categoryId === '' ? null : Number(categoryId);
    const normalizedBasePrice = basePrice === '' ? 0 : Number(basePrice);

    const normalizedVariants = variants
      .map((v, index) => ({
        variant_name: (v.variant_name || '').trim(),
        additional_price: v.additional_price === '' ? 0 : Number(v.additional_price),
        stock: v.stock === '' ? 0 : Number(v.stock),
        sku_variant: (v.sku_variant || '').trim() || `${(sku || 'SKU').trim()}-V${index + 1}`
      }))
      .filter(v => v.variant_name.length > 0);

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      category_id: Number.isFinite(normalizedCategoryId) ? normalizedCategoryId : null,
      base_price: Number.isFinite(normalizedBasePrice) ? normalizedBasePrice : 0,
      variants: normalizedVariants
    };

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      await onSubmit(payload, initialProduct?.id);
      onClose();
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
            </div>
            <div className="text-2xl font-bold text-gray-900">Form Produk</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Nama Produk</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: Kopi Arabica Gayo"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Kategori (ID)</label>
              <input
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: 1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Harga Dasar</label>
              <input
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                inputMode="decimal"
                required
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="150000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">SKU Utama</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: PRD-001"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">Varian</div>
                <div className="text-xs font-semibold text-gray-500">
                  Tambahkan varian secara dinamis (nama, harga tambahan, stok)
                </div>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Tambah Varian
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
                Belum ada varian. Klik “Tambah Varian” untuk mulai.
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-12"
                  >
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Nama Varian</label>
                      <input
                        value={variant.variant_name}
                        onChange={(e) => updateVariant(index, 'variant_name', e.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder='Contoh: "Size L - Putih"'
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Harga Tambahan</label>
                      <input
                        value={variant.additional_price}
                        onChange={(e) => updateVariant(index, 'additional_price', e.target.value)}
                        inputMode="decimal"
                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Stok</label>
                      <input
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        inputMode="numeric"
                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-1 flex md:items-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-white p-3 text-gray-700 hover:bg-red-50 hover:text-red-600 md:w-auto"
                        aria-label="Hapus varian"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save size={16} />
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
