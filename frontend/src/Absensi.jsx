import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MapPin, Radar, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/attendance';

const formatTime = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
};

const getDayKey = (dateInput) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 'invalid';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const Absensi = () => {
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(() => (navigator.geolocation ? 'loading' : 'error'));
  const [gpsMessage, setGpsMessage] = useState(() =>
    navigator.geolocation ? '' : 'Browser Anda tidak mendukung geolocation.'
  );
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(() => Boolean(localStorage.getItem('token')));
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const requestLocation = () => {
    setGpsStatus('loading');
    setGpsMessage('');

    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Browser Anda tidak mendukung geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGpsStatus('ok');
        setGpsMessage('Lokasi Akurat');
      },
      (err) => {
        setCoords(null);
        if (err.code === 1) {
          setGpsStatus('denied');
          setGpsMessage('Izinkan akses lokasi browser Anda!');
          return;
        }
        setGpsStatus('error');
        setGpsMessage('Gagal mengambil lokasi. Coba ulangi.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setGpsStatus('ok');
          setGpsMessage('Lokasi Akurat');
        },
        (err) => {
          setCoords(null);
          if (err.code === 1) {
            setGpsStatus('denied');
            setGpsMessage('Izinkan akses lokasi browser Anda!');
            return;
          }
          setGpsStatus('error');
          setGpsMessage('Gagal mengambil lokasi. Coba ulangi.');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }

    if (!token) return;

    axios
      .get(`${API_URL}/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setHistory(Array.isArray(res?.data?.data) ? res.data.data : []);
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, []);

  const groupedHistory = useMemo(() => {
    const map = new Map();
    for (const row of history) {
      const key = getDayKey(row.timestamp);
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }

    const summary = [];
    for (const [key, list] of map.entries()) {
      const sorted = [...list].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const checkIn = sorted.find(r => r.action === 'CHECK_IN') || null;
      const checkOut = [...sorted].reverse().find(r => r.action === 'CHECK_OUT') || null;
      const minDistance = sorted.reduce((acc, r) => {
        const d = Number(r.distance_meters);
        if (!Number.isFinite(d)) return acc;
        return acc === null ? d : Math.min(acc, d);
      }, null);
      summary.push({
        key,
        dateLabel: formatDate(sorted[0]?.timestamp),
        checkInAt: checkIn?.timestamp || null,
        checkOutAt: checkOut?.timestamp || null,
        minDistanceMeters: minDistance,
        withinRadius: sorted.every(r => r.within_radius !== false),
      });
    }

    return summary.sort((a, b) => (a.key > b.key ? -1 : 1));
  }, [history]);

  const submitAttendance = async (action) => {
    if (!token) return;
    if (!coords) {
      requestLocation();
      return;
    }
    if (submitting) return;

    try {
      setSubmitting(true);
      await axios.post(
        API_URL,
        { action, latitude: coords.latitude, longitude: coords.longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get(`${API_URL}/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message;
      setGpsStatus('error');
      setGpsMessage(msg || 'Gagal menyimpan absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  const gpsColor =
    gpsStatus === 'ok'
      ? 'text-emerald-400'
      : gpsStatus === 'denied'
        ? 'text-red-400'
        : gpsStatus === 'error'
          ? 'text-red-400'
          : 'text-white/60';

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 md:p-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-brand-ice uppercase tracking-tighter">
            Absensi
          </h1>
          <p className="text-white/60 font-semibold mt-2">
            Mesin absensi berbasis lokasi dengan validasi radius.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-1 bg-brand-slate/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <Radar size={22} className="text-brand-ice" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60 font-bold">Status GPS</div>
              <div className={`text-lg font-black ${gpsColor}`}>
                {gpsMessage || 'Mendeteksi lokasi...'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-dark/40 border border-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/60 font-bold">Koordinat</div>
                <div className="mt-2 font-mono text-sm text-white/80">
                  {coords ? (
                    <>
                      <div>lat: {coords.latitude.toFixed(6)}</div>
                      <div>lng: {coords.longitude.toFixed(6)}</div>
                    </>
                  ) : (
                    <div>-</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-slate/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <MapPin size={22} className="text-brand-ice" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60 font-bold">Aksi Absensi</div>
              <div className="text-lg font-black text-white">Check In / Check Out</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={!token || submitting}
              onClick={() => submitAttendance('CHECK_IN')}
              className="w-full bg-brand-ice text-brand-dark font-black py-5 rounded-2xl hover:bg-white hover:scale-[1.01] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              CHECK IN
            </button>
            <button
              type="button"
              disabled={!token || submitting}
              onClick={() => submitAttendance('CHECK_OUT')}
              className="w-full bg-transparent border border-white/20 text-white font-black py-5 rounded-2xl hover:bg-white/5 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              CHECK OUT
            </button>
          </div>

          {!token && (
            <div className="mt-4 text-red-400 font-bold">
              Anda belum login. Silakan login dulu untuk melakukan absensi.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <Clock size={22} className="text-brand-ice" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-white/60 font-bold">Riwayat</div>
          <div className="text-2xl font-black text-white">History Absensi</div>
        </div>
      </div>

      {loadingHistory ? (
        <div className="text-brand-ice/80 font-semibold">Memuat riwayat...</div>
      ) : groupedHistory.length === 0 ? (
        <div className="text-white/60 font-semibold">Belum ada riwayat absensi.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupedHistory.map((item) => (
            <div
              key={item.key}
              className="bg-brand-slate/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
            >
              <div className="text-brand-ice font-black uppercase tracking-wider">
                {item.dateLabel}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-brand-dark/40 border border-white/10 rounded-xl p-4">
                  <div className="text-xs uppercase tracking-widest text-white/60 font-bold">Check In</div>
                  <div className="text-lg font-black text-white mt-1">{formatTime(item.checkInAt)}</div>
                </div>
                <div className="bg-brand-dark/40 border border-white/10 rounded-xl p-4">
                  <div className="text-xs uppercase tracking-widest text-white/60 font-bold">Check Out</div>
                  <div className="text-lg font-black text-white mt-1">{formatTime(item.checkOutAt)}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-white/70 font-semibold">
                  {Number.isFinite(item.minDistanceMeters) ? `${item.minDistanceMeters}m` : '-'}
                </div>
                <div className={item.withinRadius ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                  {item.withinRadius ? 'Dalam Radius' : 'Di Luar Radius'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Absensi;
