import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import BranchContext from './BranchContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_MSG_LEN = 4096;
const POLL_INTERVAL_MS = 3000; // poll WA status every 3 seconds

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Status badge ────────────────────────────────────────────────────────────
function WaStatusBadge({ status }) {
  const map = {
    ready:        { label: '● Terhubung', cls: 'bg-green-100 text-green-700 border-green-200' },
    qr:           { label: '⏳ Menunggu Scan QR', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    connecting:   { label: '⏳ Menghubungkan...', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    disconnected: { label: '○ Tidak Terhubung', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    error:        { label: '✕ Error', cls: 'bg-red-100 text-red-600 border-red-200' },
  };
  const { label, cls } = map[status] || map.disconnected;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Level badge ─────────────────────────────────────────────────────────────
function LevelBadge({ level }) {
  const colors = {
    Gold:   'bg-yellow-100 text-yellow-800',
    Silver: 'bg-gray-100 text-gray-700',
    Bronze: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[level] || 'bg-gray-100 text-gray-600'}`}>
      {level || 'Bronze'}
    </span>
  );
}

// ─── Result modal ─────────────────────────────────────────────────────────────
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
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{summary?.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total Target</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{summary?.sent ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Berhasil Terkirim</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{summary?.failed ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Gagal</p>
            </div>
          </div>

          {results && results.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Nomor WA</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-gray-700">{r.phone}</td>
                      <td className="px-3 py-2">
                        {r.success
                          ? <span className="text-green-600 font-semibold">✓ Terkirim</span>
                          : <span className="text-red-500 font-semibold">✗ Gagal</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-400 max-w-[160px] truncate">
                        {r.error || (r.success ? 'OK' : '-')}
                      </td>
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

// ─── QR Panel ─────────────────────────────────────────────────────────────────
function QrPanel({ qrDataUrl, status }) {
  if (status === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-green-300 bg-green-50 p-6 text-center gap-3">
        <div className="text-5xl">✅</div>
        <p className="text-base font-bold text-green-700">WhatsApp Terhubung!</p>
        <p className="text-sm text-green-600">Siap mengirim broadcast ke semua member.</p>
      </div>
    );
  }

  if (status === 'qr' && qrDataUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-yellow-300 bg-yellow-50 p-5 gap-3 text-center">
        <p className="text-sm font-bold text-gray-800">Scan QR ini dengan WhatsApp</p>
        <img
          src={qrDataUrl}
          alt="WhatsApp QR Code"
          className="w-52 h-52 rounded-lg border border-gray-200 shadow"
        />
        <div className="text-xs text-gray-500 space-y-1">
          <p>1. Buka WhatsApp di HP kamu</p>
          <p>2. Ketuk <strong>⋮ → Perangkat Tertaut</strong></p>
          <p>3. Ketuk <strong>Tautkan Perangkat</strong></p>
          <p>4. Arahkan kamera ke QR di atas</p>
        </div>
        <p className="text-xs text-yellow-600 font-medium">QR otomatis diperbarui tiap beberapa detik</p>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 p-8 gap-3 text-center">
        <svg className="h-10 w-10 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm font-semibold text-blue-700">Menghubungkan ke WhatsApp...</p>
        <p className="text-xs text-gray-500">Harap tunggu, proses ini bisa memakan 15–30 detik</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-6 gap-2 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm font-bold text-red-700">Koneksi WA Error</p>
        <p className="text-xs text-gray-500">Restart backend untuk mencoba lagi.</p>
      </div>
    );
  }

  // disconnected / initial
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 p-6 gap-2 text-center">
      <div className="text-4xl">📱</div>
      <p className="text-sm font-semibold text-gray-700">WhatsApp belum terhubung</p>
      <p className="text-xs text-gray-400">Menginisialisasi... QR akan muncul sebentar lagi.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Broadcast() {
  const { selectedBranchId, selectedBranch } = useContext(BranchContext);

  // WA status
  const [waStatus, setWaStatus] = useState('connecting');
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // Targets
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [targetError, setTargetError] = useState('');

  // Compose
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [search, setSearch] = useState('');

  // Result modal
  const [resultModal, setResultModal] = useState(false);
  const [broadcastSummary, setBroadcastSummary] = useState(null);
  const [broadcastResults, setBroadcastResults] = useState([]);

  const pollRef = useRef(null);

  // Poll WA status every 3 seconds
  const pollStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/broadcast/status`, { headers: authHeaders() });
      setWaStatus(res.data?.status || 'disconnected');
      setQrDataUrl(res.data?.qrDataUrl || null);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    pollStatus();
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [pollStatus]);

  // Load targets
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
      (t) => t.name?.toLowerCase().includes(q) || t.phone?.toLowerCase().includes(q)
    );
  }, [targets, search]);

  const charCount = message.length;
  const charOverLimit = charCount > MAX_MSG_LEN;
  const canSend = waStatus === 'ready' && !sending && targets.length > 0 && message.trim() && !charOverLimit;

  const handleSend = async () => {
    setSendError('');
    if (waStatus !== 'ready') return setSendError('WhatsApp belum terhubung. Scan QR terlebih dahulu.');
    if (!message.trim()) return setSendError('Pesan broadcast tidak boleh kosong.');
    if (charOverLimit) return setSendError(`Pesan terlalu panjang (maks ${MAX_MSG_LEN} karakter).`);
    if (targets.length === 0) return setSendError('Tidak ada penerima terdaftar.');

    const confirmed = window.confirm(
      `Kirim broadcast ke ${targets.length} member/customer sekarang?\n\n"${message.slice(0, 120)}${message.length > 120 ? '...' : ''}"`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await axios.post(
        `${API_BASE}/broadcast/promo`,
        { message, branch_id: selectedBranchId || undefined },
        { headers: authHeaders() }
      );
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
      setSendError(err?.response?.data?.message || 'Gagal mengirim broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Broadcast Promo WhatsApp</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kirim pesan promo langsung ke WhatsApp semua member &amp; customer aktif
              {selectedBranch?.nama_cabang ? ` — Cabang ${selectedBranch.nama_cabang}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WaStatusBadge status={waStatus} />
            <button
              onClick={loadTargets}
              className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* LEFT column: QR + compose */}
          <div className="lg:col-span-2 space-y-4">

            {/* QR / connection panel */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-3">
                <span className="text-sm font-bold text-gray-900">Koneksi WhatsApp</span>
              </div>
              <div className="px-5 py-4">
                <QrPanel qrDataUrl={qrDataUrl} status={waStatus} />
              </div>
            </div>

            {/* Compose form */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-sm font-bold text-gray-900">Tulis Pesan Promo</h2>
                <p className="mt-0.5 text-xs text-gray-400">Pesan dikirim ke semua nomor yang terdaftar</p>
              </div>
              <div className="px-5 py-4 space-y-4">

                {sendError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {sendError}
                  </div>
                )}

                {waStatus !== 'ready' && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
                    ⚠️ Scan QR WhatsApp terlebih dahulu sebelum bisa mengirim broadcast.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi Pesan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    placeholder={`Contoh:\nHalo Kak! 👋\nPromo spesial hari ini!\nDiskon 20% untuk semua produk. Yuk segera datang! 🎉`}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      charOverLimit ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <div className={`mt-1 text-right text-xs ${charOverLimit ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                    {charCount}/{MAX_MSG_LEN}
                  </div>
                </div>

                {/* Recipient count */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Penerima:</span>
                  <span className="text-lg font-bold text-blue-700">{targets.length} orang</span>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Mengirim ke {targets.length} orang...
                    </span>
                  ) : (
                    `📲 Kirim Broadcast (${targets.length} penerima)`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Target table */}
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

              <div className="overflow-x-auto" style={{ maxHeight: '560px', overflowY: 'auto' }}>
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Nomor WA</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3 text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingTargets ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Memuat daftar...</td>
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

      <ResultModal
        open={resultModal}
        onClose={() => setResultModal(false)}
        summary={broadcastSummary}
        results={broadcastResults}
      />
    </div>
  );
}
