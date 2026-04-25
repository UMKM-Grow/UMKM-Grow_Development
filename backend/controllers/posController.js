const sequelize = require('../config/database');
const { Product, ProductVariant, Transaction, TransactionDetail } = require('../models');

let transactionColumnsPromise;
const getTransactionColumns = async () => {
  if (!transactionColumnsPromise) {
    transactionColumnsPromise = sequelize.getQueryInterface().describeTable('transactions').catch(() => null);
  }
  return transactionColumnsPromise;
};

const checkout = async (req, res) => {
  const { customer_id, payment_method, items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required' });
  }

  const normalizedPayment = String(payment_method || '').trim();
  const normalizedUpper = normalizedPayment.toUpperCase();
  const allowedMethods = new Set(['CASH', 'TRANSFER', 'QRIS']);
  if (!allowedMethods.has(normalizedUpper)) {
    return res.status(400).json({ message: 'Invalid payment method (Cash/Transfer/QRIS)' });
  }

  const paymentMethodNormalized =
    normalizedUpper === 'CASH' ? 'Cash' : normalizedUpper === 'TRANSFER' ? 'Transfer' : 'QRIS';

  const userId =
    Number(req.user?.id) ||
    Number(req.user_id) ||
    Number(req.body?.user_id) ||
    1;

  try {
    const result = await sequelize.transaction(async (t) => {
      const requestedItems = items
        .map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        }))
        .filter((i) => Number.isInteger(i.product_id) && i.product_id > 0 && Number.isFinite(i.quantity));

      if (requestedItems.length === 0) {
        const error = new Error('Invalid cart items');
        error.statusCode = 400;
        throw error;
      }

      for (const item of requestedItems) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          const error = new Error('Quantity must be a positive integer');
          error.statusCode = 400;
          throw error;
        }
      }

      const productIds = [...new Set(requestedItems.map((i) => i.product_id))];
      const [products, variants] = await Promise.all([
        Product.findAll({
          where: { id: productIds, is_active: true },
          transaction: t,
          lock: t.LOCK.UPDATE,
        }),
        ProductVariant.findAll({
          where: { product_id: productIds },
          transaction: t,
          lock: t.LOCK.UPDATE,
          order: [['id', 'ASC']],
        }),
      ]);

      const productById = new Map(products.map((p) => [p.id, p]));
      for (const id of productIds) {
        if (!productById.has(id)) {
          const error = new Error(`Product ${id} not found`);
          error.statusCode = 400;
          throw error;
        }
      }

      const variantsByProductId = new Map();
      for (const v of variants) {
        const list = variantsByProductId.get(v.product_id) || [];
        list.push(v);
        variantsByProductId.set(v.product_id, list);
      }

      for (const item of requestedItems) {
        const p = productById.get(item.product_id);
        const v = variantsByProductId.get(item.product_id) || [];
        const available = v.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);
        if (available < item.quantity) {
          const error = new Error(`Stock not enough for ${p.name}`);
          error.statusCode = 400;
          throw error;
        }
      }

      const detailsPayload = requestedItems.map((item) => {
        const p = productById.get(item.product_id);
        const price = Number(p.base_price) || 0;
        const subtotal = Math.round(price * item.quantity);
        return {
          product_id: p.id,
          quantity: item.quantity,
          price: Math.round(price),
          subtotal,
        };
      });

      const totalAmount = detailsPayload.reduce((sum, d) => sum + d.subtotal, 0);

      const columns = await getTransactionColumns();
      const txPayload = {
        customer_id: customer_id ? Number(customer_id) : null,
        total_price: totalAmount,
        status: 'paid',
      };

      if (columns?.user_id) txPayload.user_id = userId;
      if (columns?.total_amount) txPayload.total_amount = totalAmount;
      if (columns?.payment_method) txPayload.payment_method = paymentMethodNormalized;

      const tx = await Transaction.create(txPayload, { transaction: t });

      await TransactionDetail.bulkCreate(
        detailsPayload.map((d) => ({ ...d, transaction_id: tx.id })),
        { transaction: t }
      );

      for (const item of requestedItems) {
        let remaining = item.quantity;
        const v = variantsByProductId.get(item.product_id) || [];
        for (const row of v) {
          if (remaining <= 0) break;
          const have = Number(row.stock) || 0;
          if (have <= 0) continue;
          const take = Math.min(have, remaining);
          row.stock = have - take;
          await row.save({ transaction: t });
          remaining -= take;
        }

        if (remaining > 0) {
          const p = productById.get(item.product_id);
          const error = new Error(`Stock not enough for ${p.name}`);
          error.statusCode = 400;
          throw error;
        }
      }

      return { transaction: tx, totalAmount, detailsPayload };
    });

    res.json({
      message: 'Checkout success',
      transaction_id: result.transaction.id,
      total_amount: result.totalAmount,
      items: result.detailsPayload,
    });
  } catch (error) {
    const status = Number(error.statusCode) || 500;
    res.status(status).json({ message: error.message || 'Checkout failed' });
  }
};

module.exports = { checkout };
