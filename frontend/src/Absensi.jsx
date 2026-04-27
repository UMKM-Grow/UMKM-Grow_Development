import { useEffect, useMemo, useState } from 'react';
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
  const [locationLabel, setLocationLabel] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(() => Boolean(localStorage.getItem('token')));
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      setLocationLabel('Mencari nama lokasi...');
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
        latitude
      )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=id`;
      const res = await fetch(url);
      if (!res.ok) {
        setLocationLabel('');
        return;
      }
      const data = await res.json();
      const daerah = data?.city || data?.locality || data?.principalSubdivision || '';
      const provinsi = data?.principalSubdivision || '';
      const negara = data?.countryName || data?.countryCode || '';

      const parts = [daerah, provinsi, negara].filter(Boolean);
      setLocationLabel(parts.join(', '));
    } catch {
      setLocationLabel('');
    }
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
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setCoords({
          latitude,
          longitude,
        });
        setGpsStatus('ok');
        setGpsMessage('Lokasi Akurat');
        reverseGeocode(latitude, longitude);
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
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          setCoords({
            latitude,
            longitude,
          });
          setGpsStatus('ok');
          setGpsMessage('Lokasi Akurat');
          reverseGeocode(latitude, longitude);
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
      ? 'text-emerald-600'
      : gpsStatus === 'denied'
        ? 'text-red-600'
        : gpsStatus === 'error'
          ? 'text-red-600'
          : 'text-gray-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Absensi</h1>
          <div className="mt-1 text-sm text-gray-500">Mesin absensi berbasis lokasi dengan validasi radius</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                <Radar size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status GPS</div>
                <div className={`text-base font-bold ${gpsColor}`}>{gpsMessage || 'Mendeteksi lokasi...'}</div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Koordinat</div>
                  <div className="mt-2 font-mono text-sm text-gray-700">
                    {coords ? (
                      <>
                        <div>lat: {coords.latitude.toFixed(6)}</div>
                        <div>lng: {coords.longitude.toFixed(6)}</div>
                      </>
                    ) : (
                      <div>-</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lokasi</div>
                    <div className="mt-2 text-sm font-semibold text-gray-700">{locationLabel || '-'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                <MapPin size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aksi Absensi</div>
                <div className="text-base font-bold text-gray-900">Check In / Check Out</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                disabled={!token || submitting}
                onClick={() => submitAttendance('CHECK_IN')}
                className="w-full rounded-md bg-blue-600 py-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                CHECK IN
              </button>
              <button
                type="button"
                disabled={!token || submitting}
                onClick={() => submitAttendance('CHECK_OUT')}
                className="w-full rounded-md border border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                CHECK OUT
              </button>
            </div>

            {!token && (
              <div className="mt-4 text-sm font-semibold text-red-600">
                Anda belum login. Silakan login dulu untuk melakukan absensi.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-700">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Riwayat</div>
            <div className="text-xl font-bold text-gray-900">History Absensi</div>
          </div>
        </div>

        <div className="mt-4">
          {loadingHistory ? (
            <div className="text-sm font-semibold text-gray-500">Memuat riwayat...</div>
          ) : groupedHistory.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada riwayat absensi.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groupedHistory.map((item) => (
                <div key={item.key} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-gray-900">{item.dateLabel}</div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Check In</div>
                      <div className="mt-1 text-lg font-bold text-gray-900">{formatTime(item.checkInAt)}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Check Out</div>
                      <div className="mt-1 text-lg font-bold text-gray-900">{formatTime(item.checkOutAt)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">
                      {Number.isFinite(item.minDistanceMeters) ? `${item.minDistanceMeters}m` : '-'}
                    </div>
                    <div className={item.withinRadius ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {item.withinRadius ? 'Dalam Radius' : 'Di Luar Radius'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Absensi;
