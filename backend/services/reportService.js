const { Op } = require('sequelize');
const { Transaction, Expense } = require('../models');

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date) {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateOnlyString(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateRange(period) {
  const now = new Date();
  if (period === 'week') return { start: startOfWeek(now), end: now };
  if (period === 'month') return { start: startOfMonth(now), end: now };
  if (period === 'year') return { start: startOfYear(now), end: now };
  return { start: null, end: null };
}

async function getFinancialReport(period = 'month') {
  const normalized = ['week', 'month', 'year', 'all'].includes(period) ? period : 'month';
  const { start, end } = buildDateRange(normalized);

  const txWhere = start && end ? { createdAt: { [Op.between]: [start, end] } } : {};
  const expenseWhere =
    start && end ? { tanggal: { [Op.between]: [toDateOnlyString(start), toDateOnlyString(end)] } } : {};

  const revenueRaw = await Transaction.sum('total_price', { where: txWhere });
  const expensesRaw = await Expense.sum('nominal', { where: expenseWhere });

  const revenue = Number(revenueRaw) || 0;
  const expenses = Number(expensesRaw) || 0;

  const cogs = 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const totalCost = expenses + cogs;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    period: normalized,
    startDate: start ? start.toISOString() : null,
    endDate: end ? end.toISOString() : null,
    revenue,
    expenses,
    cogs,
    totalCost,
    grossProfit,
    netProfit,
    profitMargin,
    cogsAvailable: false,
  };
}

module.exports = {
  getFinancialReport,
};
