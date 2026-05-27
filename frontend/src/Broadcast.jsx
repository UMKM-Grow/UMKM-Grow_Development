import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BranchContext from './BranchContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MAX_MSG_LEN = 4096;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function LevelBadge({ level }) {
  const colors = {
    Gold: 'bg-yellow-100 text-yellow-800',
    Silver: 'bg-gray-100 text-gray-700',
    Bronze: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[level] || 'bg-gray-100 text-gray-600'}`}>
      {level || 'Bronze'}
    </span>
  );
}

function ResultModal({ open, onClose, summary, results }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Hasil Broadcast</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <div className="px-6 py-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{summary?.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total Target</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{summary?.sent ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Berhasil</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{summary?.failed ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Gagal</p>
            </div>
          </div>

          {/* Detail results */}
          {results && results.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Nomor HP</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-gray-700">{r.phone}</td>
                      <td className="px-3 py-2">
                        {r.success ? (
                          <span className="text-green-600 font-semibold">✓ Terkirim</span>
                        ) : (
                          <span className="text-red-500 font-semibold">✗ Gagal</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{r.mock ? 'simulasi' : 'live'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Broadcast() {
  const { selectedBranchId, selectedBranch } = useContext(BranchContext);

  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [targetError, setTargetError] = useState('');

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const [resultModal, setResultModal] = useState(false);
  const [broadcastSummary, setBroadcastSummary] = useState(null);
  const [broadcastResults, setBroadcastResults] = useState([]);

  const [search, setSearch] = useState('');

  // Load targets (customers with phone)
  const loadTargets = useCallback(async () => {
    setLoadingTargets(true);
    setTargetError('');
    try {
      const res = await axios.get(`${API_BASE}/broadcast/targets`, { headers: authHeaders() });
      setTargets(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setTargetError('Gagal memuat daftar penerima.');
      setTargets([]);
    } finally {
      setLoadingTargets(false);
    }
  }, []);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const filteredTargets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return targets;
    return targets.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q)
    );
  }, [targets, search]);

  const charCount = message.length;
  const charOverLimit = charCount > MAX_MSG_LEN;

  const handleSend = async () => {
    setSendError('');
    if (!message.trim()) return setSendError('Pesan broadcast tidak boleh kosong.');
    if (charOverLimit) return setSendError(`Pesan terlalu panjang (maks ${MAX_MSG_LEN} karakter).`);
    if (targets.length === 0) return setSendError('Tidak ada penerima. Pastikan ada member/customer aktif dengan nomor HP.');

    const confirmed = window.confirm(
      `Kirim broadcast ke ${targets.length} member/customer sekarang?\n\nPesan:\n"${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const payload = { message, branch_id: selectedBranchId || undefined };
      const res = await axios.post(`${API_BASE}/broadcast/promo`, payload, { headers: authHeaders() });
      setBroadcastSummary(res.data?.summary || null);
      setBroadcastResults(res.data?.results || []);
      setResultModal(true);
      setMessage('');
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      const msg = err?.response?.data?.message || 'Gagal mengirim broadcast.';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broadcast Promo</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kirim pesan promosi via WhatsApp ke semua member &amp; customer aktif
              {selectedBranch?.nama_cabang ? ` — Cabang ${selectedBranch.nama_cabang}` : ''}
            </p>
          </div>
          <button
            onClick={loadTargets}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition"
            title="Refresh daftar penerima"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* LEFT: Compose form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-sm font-bold text-gray-900">Tulis Pesan Promo</h2>
                <p className="mt-0.5 text-xs text-gray-400">Pesan akan dikirim ke semua nomor yang terdaftar</p>
              </div>
              <div className="px-5 py-4 space-y-4">

                {sendError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {sendError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi Pesan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    placeholder={`Contoh:\nHalo Kak! 👋\nPromo spesial hari ini di ${selectedBranch?.nama_cabang || 'toko kami'}!\nDiskon 20% untuk semua produk pilihan. Yuk segera datang! 🎉`}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${charOverLimit ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  <div className={`mt-1 text-right text-xs ${charOverLimit ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                    {charCount}/{MAX_MSG_LEN}
                  </div>
                </div>

                {/* Target count summary */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Penerima:</span>
                    <span className="text-lg font-bold text-blue-700">{targets.length} orang</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Member &amp; customer aktif dengan nomor HP</p>
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || targets.length === 0 || !message.trim() || charOverLimit}
                  className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Mengirim... ({targets.length} penerima)
                    </span>
                  ) : (
                    `📲 Kirim Broadcast Sekarang (${targets.length} penerima)`
                  )}
                </button>

                {/* WA Gateway info */}
                <p className="text-center text-xs text-gray-400">
                  Gateway: <span className="font-mono font-semibold">WA_GATEWAY</span> env var
                  &nbsp;(mock/fonnte/wablas)
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Target member table */}
          <div className="lg:col-span-3">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 gap-3">
                <span className="text-sm font-bold text-gray-900">
                  Daftar Penerima ({targets.length})
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama / nomor..."
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>

              {targetError && (
                <div className="bg-red-50 border-b border-red-100 px-5 py-3 text-sm text-red-700">{targetError}</div>
              )}

              <div className="overflow-x-auto" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Nomor HP</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3 text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingTargets ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Memuat daftar penerima...</td>
                      </tr>
                    ) : filteredTargets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                          {search ? 'Tidak ada hasil pencarian.' : 'Belum ada member/customer aktif dengan nomor HP.'}
                        </td>
                      </tr>
                    ) : (
                      filteredTargets.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 text-xs">{t.phone || '-'}</td>
                          <td className="px-4 py-3"><LevelBadge level={t.level} /></td>
                          <td className="px-4 py-3 text-right text-gray-600">{t.loyalty_points ?? 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result modal */}
      <ResultModal
        open={resultModal}
        onClose={() => setResultModal(false)}
        summary={broadcastSummary}
        results={broadcastResults}
      />
    </div>
  );
}
