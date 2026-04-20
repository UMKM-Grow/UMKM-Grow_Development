import React, { useRef, useState } from 'react';
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
      <div className="w-full max-w-3xl bg-brand-slate/20 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60 font-bold">
              {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
            </div>
            <div className="text-2xl font-black text-brand-ice uppercase tracking-tight">
              Form Produk
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-brand-dark/40 border border-white/10 hover:bg-brand-dark/60 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/70 mb-2">Nama Produk</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="Contoh: Kopi Arabica Gayo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-2">Kategori (ID)</label>
              <input
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                inputMode="numeric"
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="Contoh: 1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-2">Harga Dasar</label>
              <input
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                inputMode="decimal"
                required
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="150000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/70 mb-2">SKU Utama</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="Contoh: PRD-001"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black uppercase tracking-tight text-white">Varian</div>
                <div className="text-xs text-white/60 font-semibold">
                  Tambahkan varian secara dinamis (nama, harga tambahan, stok)
                </div>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-2 bg-brand-ice text-brand-dark font-black px-4 py-2 rounded-full hover:bg-white hover:scale-105 transition-all"
              >
                <Plus size={16} />
                Tambah Varian
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="text-white/60 bg-brand-dark/30 border border-white/10 rounded-xl p-4">
                Belum ada varian. Klik “Tambah Varian” untuk mulai.
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-brand-dark/30 border border-white/10 rounded-xl p-4"
                  >
                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold text-white/70 mb-2">Nama Varian</label>
                      <input
                        value={variant.variant_name}
                        onChange={(e) => updateVariant(index, 'variant_name', e.target.value)}
                        className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                        placeholder='Contoh: "Size L - Putih"'
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-white/70 mb-2">Harga Tambahan</label>
                      <input
                        value={variant.additional_price}
                        onChange={(e) => updateVariant(index, 'additional_price', e.target.value)}
                        inputMode="decimal"
                        className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-white/70 mb-2">Stok</label>
                      <input
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        inputMode="numeric"
                        className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-1 flex md:items-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="w-full md:w-auto inline-flex items-center justify-center p-3 rounded-lg bg-brand-dark/40 border border-white/10 hover:bg-red-500/60 transition-colors"
                        aria-label="Hapus varian"
                      >
                        <Trash2 size={16} className="text-white" />
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
              className="px-5 py-3 rounded-full bg-brand-dark/40 border border-white/10 text-white font-bold hover:bg-brand-dark/60 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-brand-ice text-brand-dark font-black px-6 py-3 rounded-full hover:bg-white hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
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
