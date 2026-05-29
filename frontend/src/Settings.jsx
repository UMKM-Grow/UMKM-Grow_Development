import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}

const Settings = () => {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [namaToko, setNamaToko] = useState('');
  const [alamat, setAlamat] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [taxPercent, setTaxPercent] = useState('');

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.get(`${API_BASE}/settings`, { headers });
      const data = response.data;

      setSetting(data);
      setNamaToko(data.nama_toko || '');
      setAlamat(data.alamat || '');
      setNomorTelepon(data.nomor_telepon || '');
      setServiceCharge(data.service_charge_percent?.toString() || '');
      setTaxPercent(data.tax_percent?.toString() || '');
    } catch (err) {
      console.error('Error fetching setting:', err);
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!namaToko.trim()) {
      setError('Nama toko is required');
      return;
    }

    const serviceChargeNum = parseFloat(serviceCharge);
    const taxPercentNum = parseFloat(taxPercent);

    if (isNaN(serviceChargeNum) || serviceChargeNum < 0 || serviceChargeNum > 100) {
      setError('Service charge must be between 0 and 100');
      return;
    }

    if (isNaN(taxPercentNum) || taxPercentNum < 0 || taxPercentNum > 100) {
      setError('Tax percent must be between 0 and 100');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.put(`${API_BASE}/settings`, {
        nama_toko: namaToko.trim(),
        alamat: alamat.trim() || null,
        nomor_telepon: nomorTelepon.trim() || null,
        service_charge_percent: serviceChargeNum,
        tax_percent: taxPercentNum
      }, { headers });

      setSuccessMessage('Pengaturan berhasil disimpan!');
      // Update local state with new values
      setSetting(response.data);
    } catch (err) {
      console.error('Error updating setting:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full p-6 md:p-8 bg-gray-50">
        <p className="text-sm text-gray-500">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Toko</h1>
        <p className="text-sm text-gray-500">Konfigurasi informasi dan parameter toko Anda.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-600">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
            <input
              type="text"
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              placeholder="Masukkan nama toko"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              rows="3"
              placeholder="Masukkan alamat toko"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input
              type="tel"
              value={nomorTelepon}
              onChange={(e) => setNomorTelepon(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
            <input
              type="number"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              min="0" max="100" step="0.01"
              placeholder="Contoh: 5.0"
            />
            <p className="mt-1 text-xs text-gray-500">Service charge akan ditambahkan ke total belanja</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pajak (%)</label>
            <input
              type="number"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              min="0" max="100" step="0.01"
              placeholder="Contoh: 11.0 untuk PPN"
            />
            <p className="mt-1 text-xs text-gray-500">Pajak akan ditambahkan ke total belanja setelah service charge</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

      {setting && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5 max-w-2xl">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Nilai Pengaturan Saat Ini</h2>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p><span className="font-medium text-gray-500">Nama Toko:</span> {setting.nama_toko}</p>
            {setting.alamat && <p><span className="font-medium text-gray-500">Alamat:</span> {setting.alamat}</p>}
            {setting.nomor_telepon && <p><span className="font-medium text-gray-500">Telepon:</span> {setting.nomor_telepon}</p>}
            <p><span className="font-medium text-gray-500">Service Charge:</span> {setting.service_charge_percent}%</p>
            <p><span className="font-medium text-gray-500">Pajak:</span> {setting.tax_percent}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;