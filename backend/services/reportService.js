const { Op } = require('sequelize');
const { sequelize, Transaction, TransactionDetail, Product, Expense } = require('../models');

let transactionColumnsPromise;
const getTransactionColumns = async () => {
  if (!transactionColumnsPromise) {
    transactionColumnsPromise = sequelize.getQueryInterface().describeTable('transactions').catch(() => null);
  }
  return transactionColumnsPromise;
};

let detailColumnsPromise;
const getTransactionDetailColumns = async () => {
  if (!detailColumnsPromise) {
    detailColumnsPromise = sequelize.getQueryInterface().describeTable('transaction_details').catch(() => null);
  }
  return detailColumnsPromise;
};

let productColumnsPromise;
const getProductColumns = async () => {
  if (!productColumnsPromise) {
    productColumnsPromise = sequelize.getQueryInterface().describeTable('products').catch(() => null);
  }
  return productColumnsPromise;
};

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
  if (period === 'day' || period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (period === 'week') return { start: startOfWeek(now), end: now };
  if (period === 'month') return { start: startOfMonth(now), end: now };
  if (period === 'year') return { start: startOfYear(now), end: now };
  return { start: null, end: null };
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function computeCogs(txWhere) {
  const candidates = ['cogs', 'cost', 'cost_price', 'purchase_price', 'buy_price', 'harga_beli', 'modal'];

  const [detailColumns, productColumns] = await Promise.all([getTransactionDetailColumns(), getProductColumns()]);
  const detailCostColumn = candidates.find((c) => Boolean(detailColumns?.[c]));
  const productCostColumn = candidates.find((c) => Boolean(productColumns?.[c]));

  if (detailCostColumn) {
    const rows = await TransactionDetail.findAll({
      attributes: [
        [
          sequelize.fn(
            'SUM',
            sequelize.literal(`\`TransactionDetail\`.\`quantity\` * \`TransactionDetail\`.\`${detailCostColumn}\``)
          ),
          'cogs',
        ],
      ],
      include: [
        {
          model: Transaction,
          attributes: [],
          where: txWhere,
          required: true,
        },
      ],
      raw: true,
    });

    const value = Number(rows?.[0]?.cogs);
    return { cogs: Number.isFinite(value) ? value : 0, cogsAvailable: true, cogsSource: `transaction_details.${detailCostColumn}` };
  }

  if (productCostColumn) {
    const rows = await TransactionDetail.findAll({
      attributes: [
        [
          sequelize.fn(
            'SUM',
            sequelize.literal(`\`TransactionDetail\`.\`quantity\` * \`product\`.\`${productCostColumn}\``)
          ),
          'cogs',
        ],
      ],
      include: [
        {
          model: Transaction,
          attributes: [],
          where: txWhere,
          required: true,
        },
        {
          model: Product,
          as: 'product',
          attributes: [],
          required: true,
        },
      ],
      raw: true,
    });

    const value = Number(rows?.[0]?.cogs);
    return { cogs: Number.isFinite(value) ? value : 0, cogsAvailable: true, cogsSource: `products.${productCostColumn}` };
  }

  return { cogs: 0, cogsAvailable: false, cogsSource: null };
}

async function getFinancialReport(period = 'month', options = {}) {
  const normalized = ['day', 'today', 'week', 'month', 'year', 'all'].includes(period) ? period : 'month';

  const forcedStart = parseDateOrNull(options?.startDate);
  const forcedEnd = parseDateOrNull(options?.endDate);
  const { start, end } = forcedStart && forcedEnd ? { start: forcedStart, end: forcedEnd } : buildDateRange(normalized);

  const txWhere = start && end ? { createdAt: { [Op.between]: [start, end] } } : {};
  const expenseWhere =
    start && end ? { tanggal: { [Op.between]: [toDateOnlyString(start), toDateOnlyString(end)] } } : {};

  const txColumns = await getTransactionColumns();
  const revenueColumn = txColumns?.total_belanja
    ? 'total_belanja'
    : txColumns?.total_price
      ? 'total_price'
      : txColumns?.total_amount
        ? 'total_amount'
        : 'total_price';

  const revenueRaw = await Transaction.sum(revenueColumn, { where: txWhere });
  const expensesRaw = await Expense.sum('nominal', { where: expenseWhere });

  const revenue = Number(revenueRaw) || 0;
  const expenses = Number(expensesRaw) || 0;

  const cogsResult = await computeCogs(txWhere);
  const cogs = Number(cogsResult.cogs) || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const totalCost = cogs;
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
    cogsAvailable: cogsResult.cogsAvailable,
    cogsSource: cogsResult.cogsSource,
    revenueSource: `transactions.${revenueColumn}`,
  };
}

module.exports = {
  getFinancialReport,
};
