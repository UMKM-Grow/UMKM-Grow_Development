import React, { useRef, useState } from 'react';
import { X, Save } from 'lucide-react';

const CustomerFormModal = ({ isOpen, initialCustomer, onClose, onSubmit }) => {
  const isEditing = Boolean(initialCustomer?.id);
  const isSubmittingRef = useRef(false);

  const [name, setName] = useState(initialCustomer?.name ?? '');
  const [phone, setPhone] = useState(initialCustomer?.phone ?? '');
  const [email, setEmail] = useState(initialCustomer?.email ?? '');
  const [address, setAddress] = useState(initialCustomer?.address ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || isSubmittingRef.current) return;

    setPhoneError('');
    setSubmitError('');

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      address: address.trim(),
    };

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      await onSubmit(payload, initialCustomer?.id);
      onClose();
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || 'Gagal menyimpan pelanggan.';
      if (status === 409) {
        setPhoneError('Nomor HP sudah terdaftar di sistem!');
        return;
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-brand-slate/20 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60 font-bold">
              {isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
            </div>
            <div className="text-2xl font-black text-brand-ice uppercase tracking-tight">
              Form Pelanggan
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/70 mb-2">Nama</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="Contoh: Siti Nurhaliza"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-2">No HP</label>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                required
                inputMode="tel"
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="08xxxxxxxxxx"
              />
              {phoneError ? (
                <div className="mt-2 text-sm font-bold text-red-400">{phoneError}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-2">Email (Opsional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3"
                placeholder="nama@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/70 mb-2">Alamat</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={4}
                className="w-full bg-brand-dark/50 border border-white/20 text-white focus:border-brand-ice focus:outline-none rounded-lg p-3 resize-none"
                placeholder="Alamat lengkap pelanggan..."
              />
            </div>
          </div>

          {submitError ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-200 font-semibold">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-ice text-brand-dark font-black hover:bg-white hover:scale-[1.01] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              <Save size={18} />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
