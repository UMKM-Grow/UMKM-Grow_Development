import { useContext, useEffect, useState } from 'react';
import BranchContext from './BranchContext';

export default function Branches() {
  const { branches, reloadBranches } = useContext(BranchContext);
  const [form, setForm] = useState({ nama_cabang: '', lokasi: '', manager_id: '' });
  const [editingBranch, setEditingBranch] = useState(null);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    reloadBranches();
    // Load list of users for manager dropdown
    fetch(`${API_BASE}/branches/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Failed to load users', err));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        nama_cabang: form.nama_cabang,
        lokasi: form.lokasi,
        // manager_id is optional - send null if empty
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };

      const url = editingBranch ? `${API_BASE}/branches/${editingBranch.id_cabang}` : `${API_BASE}/branches`;
      const method = editingBranch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save branch', errorData);
        alert('Gagal menyimpan cabang: ' + (errorData.error || 'Unknown error'));
        return;
      }

      setForm({ nama_cabang: '', lokasi: '', manager_id: '' });
      setEditingBranch(null);
      reloadBranches();
      alert(`Cabang berhasil ${editingBranch ? 'diperbarui' : 'ditambahkan'}!`);
    } catch (error) {
      console.error('Failed to save branch', error);
      alert('Gagal menyimpan cabang: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch) => {
    setForm({
      nama_cabang: branch.nama_cabang,
      lokasi: branch.lokasi || '',
      manager_id: branch.manager_id || '',
    });
    setEditingBranch(branch);
  };

  const handleDelete = async (branchId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus cabang ini?')) return;

    try {
      const response = await fetch(`${API_BASE}/branches/${branchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete branch', errorData);
        alert('Gagal menghapus cabang: ' + (errorData.error || 'Unknown error'));
        return;
      }

      reloadBranches();
      alert('Cabang berhasil dihapus!');
    } catch (error) {
      console.error('Failed to delete branch', error);
      alert('Gagal menghapus cabang: ' + error.message);
    }
  };

  const handleCancel = () => {
    setForm({ nama_cabang: '', lokasi: '', manager_id: '' });
    setEditingBranch(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Manajemen Cabang</h1>
      <p className="mt-2 text-sm text-gray-600">
        Tambahkan cabang baru dan atur lokasi serta manajer. Cabang aktif akan disimpan di localStorage.
      </p>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
          </h2>

          <label className="mt-4 block text-sm font-medium text-gray-700">Nama Cabang</label>
          <input
            name="nama_cabang"
            value={form.nama_cabang}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Contoh: Cabang Jakarta"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">Lokasi</label>
          <textarea
            name="lokasi"
            value={form.lokasi}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows="3"
            placeholder="Contoh: Jl. Merdeka No. 123"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Manajer Cabang <span className="text-xs text-gray-500">(Opsional)</span>
          </label>
          <select
            name="manager_id"
            value={form.manager_id}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">-- Pilih Manajer --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving || !form.nama_cabang || !form.lokasi}
              className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : editingBranch ? 'Update Cabang' : 'Simpan Cabang'}
            </button>
            {editingBranch && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Batal
              </button>
            )}
          </div>
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
                      {branch.manager_id && (
                        <p className="text-xs text-gray-400">Manager ID: {branch.manager_id}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="rounded bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id_cabang)}
                        className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Hapus
                      </button>
                    </div>
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
