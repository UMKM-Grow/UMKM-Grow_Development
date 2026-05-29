import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import BranchContext from "./BranchContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatIdr(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(num);
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.0%";
  return `${num.toFixed(1)}%`;
}

function getTodayDateInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStartDateInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export default function FinancialReports() {
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("financial");
  const [loading, setLoading] = useState(true);
  const [taxLoading, setTaxLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [taxErrorMessage, setTaxErrorMessage] = useState("");
  const [report, setReport] = useState(null);
  const [taxReport, setTaxReport] = useState([]);
  const [taxStartDate, setTaxStartDate] = useState(getMonthStartDateInput());
  const [taxEndDate, setTaxEndDate] = useState(getTodayDateInput());
  const { selectedBranchId } = useContext(BranchContext);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setErrorMessage("Silakan login terlebih dahulu.");
        window.setTimeout(() => {
          window.location.href = "/login";
        }, 0);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        const res = await axios.get(`${API_BASE}/reports/financial`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            period,
            branch_id: selectedBranchId || undefined,
          },
        });
        setReport(res?.data?.data || null);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.setTimeout(() => {
            window.location.href = "/login";
          }, 0);
          return;
        }
        setReport(null);
        setErrorMessage(
          error?.response?.data?.message || "Gagal memuat laporan.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period, token, selectedBranchId]);

  const loadTaxReport = async () => {
    if (!token) {
      setTaxErrorMessage("Silakan login terlebih dahulu.");
      return;
    }

    if (!selectedBranchId) {
      setTaxErrorMessage("Cabang aktif tidak ditemukan.");
      setTaxReport([]);
      return;
    }

    if (!taxStartDate || !taxEndDate) {
      setTaxErrorMessage("Tanggal mulai dan sampai wajib diisi.");
      setTaxReport([]);
      return;
    }

    try {
      setTaxLoading(true);
      setTaxErrorMessage("");
      const res = await axios.get(`${API_BASE}/reports/tax`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          branch_id: selectedBranchId,
          startDate: taxStartDate,
          endDate: taxEndDate,
        },
      });
      setTaxReport(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.setTimeout(() => {
          window.location.href = "/login";
        }, 0);
        return;
      }
      setTaxReport([]);
      setTaxErrorMessage(
        error?.response?.data?.message || "Gagal memuat laporan pajak.",
      );
    } finally {
      setTaxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tax") {
      loadTaxReport();
    }
  }, [activeTab, selectedBranchId]);

  const handleDownloadTaxCsv = async () => {
    let rows = taxReport;

    if (!rows.length) {
      await loadTaxReport();
      rows = taxReport;
    }

    const latestRows = rows.length ? rows : taxReport;
    if (!latestRows.length) {
      setTaxErrorMessage("Tidak ada data laporan pajak untuk diunduh.");
      return;
    }

    const headers = [
      "Tanggal",
      "No Transaksi",
      "Subtotal",
      "Service Charge",
      "Nominal Pajak",
      "Total",
    ];
    const csvLines = [
      headers.join(","),
      ...latestRows.map((item) =>
        [
          `"${item.tanggal || ""}"`,
          `"${item.no_transaksi || ""}"`,
          Number(item.subtotal) || 0,
          Number(item.service_charge_amount) || 0,
          Number(item.nominal_pajak) || 0,
          Number(item.total) || 0,
        ].join(","),
      ),
    ];

    const csvData = csvLines.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Laporan_Pajak.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cards = useMemo(() => {
    const revenue = Number(report?.revenue) || 0;
    const totalCost = Number(report?.totalCost) || 0;
    const grossProfit = revenue - totalCost;
    const profitMargin = Number(report?.profitMargin) || 0;

    return [
      { label: "Total Revenue", value: formatIdr(revenue) },
      { label: "Total Cost", value: formatIdr(totalCost) },
      {
        label: "Gross Profit",
        value: formatIdr(grossProfit),
        isNegative: grossProfit < 0,
      },
      { label: "Profit Margin", value: formatPercent(profitMargin) },
    ];
  }, [report]);

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
            <p className="text-sm text-gray-500">Lihat performa bisnis dan analitik keuangan.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("financial")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition duration-200 ${activeTab === "financial" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
            >
              Financial Report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tax")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition duration-200 ${activeTab === "tax" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
            >
              Laporan Pajak
            </button>
          </div>
        </div>

        {activeTab === "financial" ? (
          <>
          {errorMessage ? (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                {errorMessage}
              </div>
            ) : null}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Waktu</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {cards.map((c) => (
                <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{c.label}</p>
                  <p className={`mt-2 text-xl font-bold ${c.isNegative ? "text-rose-500" : "text-gray-800"}`}>
                    {loading ? "Memuat..." : c.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold text-gray-900">
                  Sales Trend
                </div>
                <div className="mt-4 h-[300px] w-full">
                  {loading ? (
                    <div className="h-full w-full rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 font-medium">
                      Loading chart...
                    </div>
                  ) : (
                    <ResponsiveContainer width="99%" height={300}>
                      <LineChart data={report?.salesTrend || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          tickFormatter={(val) => `Rp${val / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) => formatIdr(value)}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold text-gray-900">
                  Monthly Profit
                </div>
                <div className="mt-4 h-[300px] w-full">
                  {loading ? (
                    <div className="h-full w-full rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 font-medium">
                      Loading chart...
                    </div>
                  ) : (
                    <ResponsiveContainer width="99%" height={300}>
                      <BarChart data={report?.salesTrend || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          tickFormatter={(val) => `Rp${val / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) => formatIdr(value)}
                          cursor={{ fill: "transparent" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                          {(report?.salesTrend || []).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.profit >= 0 ? "#16a34a" : "#dc2626"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mulai
                  </label>
                  <input
                    type="date"
                    value={taxStartDate}
                    onChange={(e) => setTaxStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sampai
                  </label>
                  <input
                    type="date"
                    value={taxEndDate}
                    onChange={(e) => setTaxEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadTaxReport}
                  className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
                >
                  Tampilkan Laporan
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTaxCsv}
                  className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
                >
                  Unduh CSV Pajak
                </button>
              </div>
            </div>

            {taxErrorMessage ? (
              <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                {taxErrorMessage}
              </div>
            ) : null}

            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No Transaksi</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Charge</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Nominal Pajak</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {taxLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Memuat laporan pajak...</td>
                    </tr>
                  ) : taxReport.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Belum ada data laporan pajak.</td>
                    </tr>
                  ) : (
                    taxReport.map((item, index) => (
                      <tr key={`${item.no_transaksi}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 text-sm text-gray-700">{item.tanggal}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.no_transaksi}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatIdr(item.subtotal)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatIdr(item.service_charge_amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatIdr(item.nominal_pajak)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-right">{formatIdr(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
