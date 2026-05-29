import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/members';

function MemberFormModal({ isOpen, initialMember, onClose, onSubmit }) {
  const [nama, setNama] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');
  const [level, setLevel] = useState('Bronze');
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (initialMember) {
      setNama(initialMember.name || initialMember.nama || '');
      setNomorTelepon(initialMember.phone || initialMember.nomor_telepon || '');
      setEmail(initialMember.email || '');
      setAddress(initialMember.address || '');
      setLoyaltyPoints(String(initialMember.loyalty_points || initialMember.total_poin || 0));
      setLevel(initialMember.level || 'Bronze');
    } else {
      setNama('');
      setNomorTelepon('');
      setEmail('');
      setAddress('');
      setLoyaltyPoints('0');
      setLevel('Bronze');
    }
  }, [initialMember]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSavingRef.current) return;
    try {
      isSavingRef.current = true;
      await onSubmit(
        { nama, nomor_telepon: nomorTelepon, email, address, loyalty_points: parseInt(loyaltyPoints) || 0, level },
        initialMember?.id
      );
      onClose();
    } finally {
      isSavingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">
            {initialMember ? 'Edit Member' : 'Tambah Member'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input
              type="text"
              required
              value={nomorTelepon}
              onChange={(e) => setNomorTelepon(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Poin</label>
              <input
                type="number"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
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
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Members</h1>
            <p className="text-sm text-gray-500">Kelola data member dan program loyalitas.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari member..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-64 border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Member
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-rose-500">{error}</div>
        ) : members.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-100 p-12 text-center">
            <div className="text-sm text-gray-500">Belum ada member. Klik "Tambah Member" untuk mulai.</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomor Telepon</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Poin</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{member.name || member.nama}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.phone || member.nomor_telepon}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.email || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-500">{member.loyalty_points || member.total_poin} pts</td>
                      <td className="px-6 py-4">
                        <span className={['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          member.level === 'Gold' ? 'bg-yellow-100 text-yellow-800'
                          : member.level === 'Silver' ? 'bg-gray-200 text-gray-700'
                          : 'bg-orange-100 text-orange-700'].join(' ')}>
                          {member.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => { setEditingMember(member); setIsModalOpen(true); }}
                          className="text-gray-400 hover:text-blue-600 transition duration-150"
                          aria-label="Edit member"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Halaman {page} dari {totalPages}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
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
