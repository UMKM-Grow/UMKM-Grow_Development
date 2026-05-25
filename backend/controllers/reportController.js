const { ensureDbReady, Transaction, StoreSetting } = require("../models");
const { Op } = require("sequelize");
const { getFinancialReport } = require("../services/reportService");

const normalizeDateStart = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeDateEnd = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

const formatReportDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const reportController = {
  financial: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready)
      return res
        .status(503)
        .json({
          message: "Database belum tersambung. Pastikan MySQL berjalan.",
        });

    try {
      const period = String(req.query.period || "month");
      const branchId = req.query.branch_id || null;
      const data = await getFinancialReport(period, branchId);
      return res.status(200).json({ message: "OK", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Gagal mengambil laporan keuangan." });
    }
  },

  getTaxReport: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) {
      return res
        .status(503)
        .json({
          message: "Database belum tersambung. Pastikan MySQL berjalan.",
        });
    }

    try {
      const branchId = Number(req.query.branch_id);
      const startDate = normalizeDateStart(req.query.startDate);
      const endDate = normalizeDateEnd(req.query.endDate);

      if (!Number.isInteger(branchId) || branchId <= 0) {
        return res
          .status(400)
          .json({ message: "branch_id tidak valid atau tidak ditemukan." });
      }

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({
            message:
              "startDate dan endDate wajib diisi dengan format tanggal yang valid.",
          });
      }

      if (startDate > endDate) {
        return res
          .status(400)
          .json({ message: "startDate tidak boleh lebih besar dari endDate." });
      }

      const setting = await StoreSetting.findOne({
        where: { branch_id: branchId },
      });
      const taxPercent = Number(setting?.tax_percent) || 0;

      const transactions = await Transaction.findAll({
        where: {
          branch_id: branchId,
          status: "paid",
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [
          ["createdAt", "ASC"],
          ["id", "ASC"],
        ],
      });

      const data = transactions.map((transaction) => {
        const subtotal =
          Number(transaction.total_amount) ||
          Number(transaction.total_price) ||
          0;
        const nominalPajak = Math.round(subtotal * (taxPercent / 100));
        const total =
          Number(transaction.total_price) ||
          Math.max(
            0,
            subtotal +
              nominalPajak -
              (Number(transaction.discount_amount) || 0),
          );

        return {
          tanggal: formatReportDate(transaction.createdAt),
          no_transaksi: transaction.id,
          subtotal,
          nominal_pajak: nominalPajak,
          total,
        };
      });

      return res.status(200).json({
        message: "OK",
        data,
        meta: {
          branch_id: branchId,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          tax_percent: taxPercent,
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Gagal mengambil laporan pajak." });
    }
  },
};

module.exports = reportController;
