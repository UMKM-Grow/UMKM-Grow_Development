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
    return <div className="p-6"><p className="text-center">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Toko</h1>

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Nama Toko</label>
          <input
            type="text"
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan nama toko"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Alamat</label>
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Masukkan alamat toko"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Nomor Telepon</label>
          <input
            type="tel"
            value={nomorTelepon}
            onChange={(e) => setNomorTelepon(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan nomor telepon"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Service Charge (%)</label>
          <input
            type="number"
            value={serviceCharge}
            onChange={(e) => setServiceCharge(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="0.01"
            placeholder="Masukkan persentase service charge (misal: 5.0)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Service charge akan ditambahkan ke total belanja
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Pajak (%)</label>
          <input
            type="number"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="0.01"
            placeholder="Masukkan persentase pajak (misal: 11.0 untuk PPN)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Pajak akan ditambahkan ke total belanja setelah service charge
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>

      {setting && (
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-bold mb-2">Nilai Pengaturan Saat Ini</h2>
          <p className="text-sm"><strong>Nama Toko:</strong> {setting.nama_toko}</p>
          {setting.alamat && (
            <p className="text-sm"><strong>Alamat:</strong> {setting.alamat}</p>
          )}
          {setting.nomor_telepon && (
            <p className="text-sm"><strong>Nomor Telepon:</strong> {setting.nomor_telepon}</p>
          )}
          <p className="text-sm"><strong>Service Charge:</strong> {setting.service_charge_percent}%</p>
          <p className="text-sm"><strong>Pajak:</strong> {setting.tax_percent}%</p>
        </div>
      )}
    </div>
  );
};

export default Settings;