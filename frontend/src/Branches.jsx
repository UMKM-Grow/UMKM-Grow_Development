import { useContext, useEffect, useState } from 'react';
import BranchContext from './BranchContext';

export default function Branches() {
  const { branches, reloadBranches } = useContext(BranchContext);
  const [form, setForm] = useState({ nama_cabang: '', lokasi: '', manager_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reloadBranches();
  }, [reloadBranches]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await fetch('http://localhost:4000/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_cabang: form.nama_cabang,
          lokasi: form.lokasi,
          manager_id: form.manager_id ? Number(form.manager_id) : null,
        }),
      });
      setForm({ nama_cabang: '', lokasi: '', manager_id: '' });
      reloadBranches();
    } catch (error) {
      console.error('Failed to create branch', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Manajemen Cabang</h1>
      <p className="mt-2 text-sm text-gray-600">
        Tambahkan cabang baru dan atur lokasi serta manajer. Cabang aktif akan disimpan di localStorage.
      </p>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tambah Cabang Baru</h2>

          <label className="mt-4 block text-sm font-medium text-gray-700">Nama Cabang</label>
          <input
            name="nama_cabang"
            value={form.nama_cabang}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">Lokasi</label>
          <textarea
            name="lokasi"
            value={form.lokasi}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows="3"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">ID Manajer</label>
          <input
            name="manager_id"
            value={form.manager_id}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Cabang'}
          </button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Cabang</h2>
          {branches.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Belum ada cabang terdaftar.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {branches.map((branch) => (
                <div key={branch.id_cabang} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{branch.nama_cabang}</p>
                      <p className="text-sm text-gray-500">{branch.lokasi || 'Lokasi belum diisi'}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      ID {branch.id_cabang}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
