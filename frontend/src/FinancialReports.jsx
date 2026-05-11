import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.0%';
  return `${num.toFixed(1)}%`;
}

export default function FinancialReports() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [report, setReport] = useState(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setErrorMessage('Silakan login terlebih dahulu.');
        window.setTimeout(() => {
          window.location.href = '/login';
        }, 0);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');
        const res = await axios.get(`${API_BASE}/reports/financial`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period },
        });
        setReport(res?.data?.data || null);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.setTimeout(() => {
            window.location.href = '/login';
          }, 0);
          return;
        }
        setReport(null);
        setErrorMessage(error?.response?.data?.message || 'Gagal memuat laporan.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period, token]);

  const cards = useMemo(() => {
    const revenue = Number(report?.revenue) || 0;
    const totalCost = Number(report?.totalCost) || 0;
    const grossProfit = Number(report?.grossProfit) || 0;
    const profitMargin = Number(report?.profitMargin) || 0;

    return [
      { label: 'Total Revenue', value: formatIdr(revenue) },
      { label: 'Total Cost', value: formatIdr(totalCost) },
      { label: 'Gross Profit', value: formatIdr(grossProfit) },
      { label: 'Profit Margin', value: formatPercent(profitMargin) },
    ];
  }, [report]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <div className="mt-1 text-sm text-gray-500">View business performance and analytics</div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Export PDF
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Export Excel
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Print
            </button>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-700">Filter Waktu</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-2 w-full max-w-xs rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-white p-4 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{c.label}</div>
              <div className="mt-2 text-xl font-black text-gray-900">
                {loading ? 'Loading…' : c.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-bold text-gray-900">Sales Trend</div>
            <div className="mt-4 h-64 rounded-md border border-dashed border-gray-200 bg-gray-50" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-bold text-gray-900">Monthly Profit</div>
            <div className="mt-4 h-64 rounded-md border border-dashed border-gray-200 bg-gray-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

