import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MapPin, Radar, Clock, RefreshCw } from 'lucide-react';

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
  const [locationLabel, setLocationLabel] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(() => Boolean(localStorage.getItem('token')));
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      setLocationLabel('Mencari nama lokasi...');
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=id`;
      const res = await fetch(url);
      if (!res.ok) { setLocationLabel(''); return; }
      const data = await res.json();
      const daerah = data?.city || data?.locality || data?.principalSubdivision || '';
      const provinsi = data?.principalSubdivision || '';
      const negara = data?.countryName || data?.countryCode || '';
      setLocationLabel([daerah, provinsi, negara].filter(Boolean).join(', '));
    } catch { setLocationLabel(''); }
  };

  const requestLocation = () => {
    setGpsStatus('loading');
    setGpsMessage('');
    setLocationLabel('');
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Browser Anda tidak mendukung geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsStatus('ok');
        setGpsMessage('Lokasi Akurat');
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setCoords(null);
        if (err.code === 1) { setGpsStatus('denied'); setGpsMessage('Izinkan akses lokasi browser Anda!'); return; }
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
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setGpsStatus('ok');
          setGpsMessage('Lokasi Akurat');
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          setCoords(null);
          if (err.code === 1) { setGpsStatus('denied'); setGpsMessage('Izinkan akses lokasi browser Anda!'); return; }
          setGpsStatus('error');
          setGpsMessage('Gagal mengambil lokasi. Coba ulangi.');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
    if (!token) return;
    axios.get(`${API_URL}/my-history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setHistory(Array.isArray(res?.data?.data) ? res.data.data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [token]);

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
    if (!coords) { requestLocation(); return; }
    if (submitting) return;
    try {
      setSubmitting(true);
      await axios.post(API_URL, { action, latitude: coords.latitude, longitude: coords.longitude }, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API_URL}/my-history`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message;
      setGpsStatus('error');
      setGpsMessage(msg || 'Gagal menyimpan absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  const gpsStatusConfig = {
    ok: { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
    denied: { color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' },
    error: { color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' },
    loading: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
  };
  const gpsConf = gpsStatusConfig[gpsStatus] || gpsStatusConfig.loading;

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Absensi</h1>
        <p className="text-sm text-gray-500">Mesin absensi berbasis lokasi dengan validasi radius.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* GPS Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
              <Radar size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status GPS</p>
              <p className={`text-sm font-bold ${gpsConf.color}`}>{gpsMessage || 'Mendeteksi lokasi...'}</p>
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${gpsConf.bg}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Koordinat</p>
            <p className="font-mono text-sm text-gray-700">
              {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : '-'}
            </p>
            {locationLabel && <p className="mt-2 text-sm text-gray-600">{locationLabel}</p>}
          </div>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-3 w-full bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh Lokasi
          </button>
        </div>

        {/* Check In / Out Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
              <MapPin size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi Absensi</p>
              <p className="text-sm font-bold text-gray-800">Check In / Check Out</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={!token || submitting}
              onClick={() => submitAttendance('CHECK_IN')}
              className="w-full bg-blue-600 text-white font-medium text-sm py-4 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm disabled:opacity-60"
            >
              CHECK IN
            </button>
            <button
              type="button"
              disabled={!token || submitting}
              onClick={() => submitAttendance('CHECK_OUT')}
              className="w-full bg-white text-gray-700 font-medium text-sm py-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 disabled:opacity-60"
            >
              CHECK OUT
            </button>
          </div>
          {!token && (
            <p className="mt-3 text-sm text-rose-500 font-medium">Anda belum login. Silakan login dulu untuk melakukan absensi.</p>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
          <Clock size={18} className="text-gray-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">History Absensi</h2>
        </div>
      </div>

      {loadingHistory ? (
        <p className="text-sm text-gray-500">Memuat riwayat...</p>
      ) : groupedHistory.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada riwayat absensi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupedHistory.map((item) => (
            <div key={item.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">{item.dateLabel}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{formatTime(item.checkInAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{formatTime(item.checkOutAt)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {Number.isFinite(item.minDistanceMeters) ? `${item.minDistanceMeters}m dari kantor` : ''}
                </span>
                <span className={`text-xs font-semibold ${item.withinRadius ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.withinRadius ? 'Dalam Radius' : 'Di Luar Radius'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Absensi;
