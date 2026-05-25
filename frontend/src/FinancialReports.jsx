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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              Financial Reports
            </h1>
            <div className="mt-1 text-sm text-gray-500">
              View business performance and analytics
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setActiveTab("financial")}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === "financial" ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Financial Report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tax")}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === "tax" ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Laporan Pajak
            </button>
          </div>
        </div>

        {activeTab === "financial" ? (
          <>
            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700">
                Filter Waktu
              </label>
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
                <div
                  key={c.label}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {c.label}
                  </div>
                  <div
                    className={`mt-2 text-xl font-black ${c.isNegative ? "text-red-600" : "text-gray-900"}`}
                  >
                    {loading ? "Loading…" : c.value}
                  </div>
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
                  <label className="block text-sm font-semibold text-gray-700">
                    Mulai
                  </label>
                  <input
                    type="date"
                    value={taxStartDate}
                    onChange={(e) => setTaxStartDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Sampai
                  </label>
                  <input
                    type="date"
                    value={taxEndDate}
                    onChange={(e) => setTaxEndDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadTaxReport}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Tampilkan Laporan Pajak
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTaxCsv}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Unduh CSV Pajak
                </button>
              </div>
            </div>

            {taxErrorMessage ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {taxErrorMessage}
              </div>
            ) : null}

            <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      No Transaksi
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Nominal Pajak
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {taxLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        Memuat laporan pajak...
                      </td>
                    </tr>
                  ) : taxReport.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        Belum ada data laporan pajak.
                      </td>
                    </tr>
                  ) : (
                    taxReport.map((item, index) => (
                      <tr key={`${item.no_transaksi}-${index}`}>
                        <td className="px-4 py-3 text-gray-700">
                          {item.tanggal}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.no_transaksi}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatIdr(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatIdr(item.nominal_pajak)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatIdr(item.total)}
                        </td>
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
