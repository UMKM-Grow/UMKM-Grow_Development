import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/members';

function MemberFormModal({ isOpen, initialMember, onClose, onSubmit }) {
  const [nama, setNama] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [totalPoin, setTotalPoin] = useState('0');
  const [level, setLevel] = useState('Bronze');
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (initialMember) {
      setNama(initialMember.nama || '');
      setNomorTelepon(initialMember.nomor_telepon || '');
      setEmail(initialMember.email || '');
      setTotalPoin(String(initialMember.total_poin || 0));
      setLevel(initialMember.level || 'Bronze');
    } else {
      setNama('');
      setNomorTelepon('');
      setEmail('');
      setTotalPoin('0');
      setLevel('Bronze');
    }
  }, [initialMember]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSavingRef.current) return;
    try {
      isSavingRef.current = true;
      await onSubmit(
        { nama, nomor_telepon: nomorTelepon, email, total_poin: parseInt(totalPoin) || 0, level },
        initialMember?.id
      );
      onClose();
    } finally {
      isSavingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {initialMember ? 'Edit Member' : 'Tambah Member'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Telepon</label>
            <input
              type="text"
              required
              value={nomorTelepon}
              onChange={(e) => setNomorTelepon(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Total Poin</label>
              <input
                type="number"
                value={totalPoin}
                onChange={(e) => setTotalPoin(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(API_URL, {
        headers,
        params: { page, limit: 10, search },
      });
      const data = response?.data?.data ?? [];
      setMembers(Array.isArray(data) ? data : []);
      setTotalPages(Number(response?.data?.pagination?.totalPages) || 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [page, search]);

  const handleSubmit = async (payload, memberId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (memberId) {
      await axios.put(`${API_URL}/${memberId}`, payload, { headers });
    } else {
      await axios.post(API_URL, payload, { headers });
    }
    await loadMembers();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari member..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-72 rounded-md border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Member
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center">
            <div className="text-gray-500">Belum ada member. Klik "Tambah Member" untuk mulai.</div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomor Telepon</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Poin</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{member.nama}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.nomor_telepon}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{member.total_poin} pts</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={[
                            'px-3 py-1 rounded-full text-xs font-bold',
                            member.level === 'Gold'
                              ? 'bg-yellow-100 text-yellow-800'
                              : member.level === 'Silver'
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-orange-100 text-orange-800'
                          ].join(' ')}
                        >
                          {member.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMember(member);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">Halaman {page} dari {totalPages}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        <MemberFormModal
          isOpen={isModalOpen}
          initialMember={editingMember}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
