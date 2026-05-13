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
    start && end
      ? { tanggal: { [Op.between]: [toDateOnlyString(start), toDateOnlyString(end)] } }
      : {};

  const txs = await Transaction.findAll({ where: txWhere, attributes: ['createdAt', 'total_price'] });
  const exps = await Expense.findAll({ where: expenseWhere, attributes: ['tanggal', 'nominal'] });

  const trendMap = {};
  
  const getLabel = (date) => {
    const d = new Date(date);
    if (normalized === 'week') {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[d.getDay()];
    }
    if (normalized === 'month') return String(d.getDate());
    if (normalized === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return months[d.getMonth()];
    }
    return toDateOnlyString(d);
  };

  txs.forEach(t => {
    const label = getLabel(t.createdAt);
    if (!trendMap[label]) trendMap[label] = { revenue: 0, expense: 0 };
    trendMap[label].revenue += Number(t.total_price) || 0;
  });

  exps.forEach(e => {
    const label = getLabel(e.tanggal);
    if (!trendMap[label]) trendMap[label] = { revenue: 0, expense: 0 };
    trendMap[label].expense += Number(e.nominal) || 0;
  });

  const salesTrend = Object.keys(trendMap).map(name => ({
    name,
    revenue: trendMap[name].revenue,
    profit: trendMap[name].revenue - trendMap[name].expense
  }));

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
    salesTrend
  };
}

module.exports = {
  getFinancialReport,
};
