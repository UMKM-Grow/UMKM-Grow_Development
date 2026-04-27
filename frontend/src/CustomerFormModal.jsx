import { useRef, useState } from 'react';
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
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
            </div>
            <div className="text-2xl font-bold text-gray-900">Form Pelanggan</div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Nama</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: Siti Nurhaliza"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">No HP</label>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                required
                inputMode="tel"
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="08xxxxxxxxxx"
              />
              {phoneError ? (
                <div className="mt-2 text-sm font-semibold text-red-600">{phoneError}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Email (Opsional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="nama@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Alamat</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={4}
                className="w-full resize-none rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Alamat lengkap pelanggan..."
              />
            </div>
          </div>

          {submitError ? (
            <div className="rounded-md border border-red-200 bg-white p-4 text-sm font-semibold text-red-600">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
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
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
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
