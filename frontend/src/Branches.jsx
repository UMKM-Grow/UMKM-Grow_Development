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
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Cabang</h1>
          <p className="text-sm text-gray-500">Tambahkan cabang baru dan atur lokasi serta manajer.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
            </h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Cabang</label>
            <input
              name="nama_cabang"
              value={form.nama_cabang}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-4"
              placeholder="Contoh: Cabang Jakarta"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
            <textarea
              name="lokasi"
              value={form.lokasi}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-4"
              rows="3"
              placeholder="Contoh: Jl. Merdeka No. 123"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manajer Cabang <span className="text-xs text-gray-400">(Opsional)</span>
            </label>
            <select
              name="manager_id"
              value={form.manager_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all mb-6"
            >
              <option value="">-- Pilih Manajer --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !form.nama_cabang || !form.lokasi}
                className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : editingBranch ? 'Update Cabang' : 'Simpan Cabang'}
              </button>
              {editingBranch && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Daftar Cabang</h2>
            {branches.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada cabang terdaftar.</p>
            ) : (
              <div className="space-y-3">
                {branches.map((branch) => (
                  <div key={branch.id_cabang} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{branch.nama_cabang}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{branch.lokasi || 'Lokasi belum diisi'}</p>
                        {branch.manager_id && (
                          <p className="text-xs text-gray-400">Manager ID: {branch.manager_id}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="text-gray-400 hover:text-blue-600 transition duration-150"
                          aria-label="Edit cabang"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id_cabang)}
                          className="text-gray-400 hover:text-rose-500 transition duration-150"
                          aria-label="Hapus cabang"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
    </div>
  );
}
