const sequelize = require('../config/database');
const { Product, Transaction, TransactionDetail } = require('../models');

const checkout = async (req, res) => {
  const { customer_id, payment_method, items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required' });
  }

  const normalizedPayment = String(payment_method || '').trim();
  if (!['Cash', 'Qris'].includes(normalizedPayment)) {
    return res.status(400).json({ message: 'Invalid payment method (Cash/Qris)' });
  }

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
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const productById = new Map(products.map((p) => [p.id, p]));
      for (const id of productIds) {
        if (!productById.has(id)) {
          const error = new Error(`Product ${id} not found`);
          error.statusCode = 400;
          throw error;
        }
      }

      for (const item of requestedItems) {
        const p = productById.get(item.product_id);
        if (p.stock < item.quantity) {
          const error = new Error(`Stock not enough for ${p.name}`);
          error.statusCode = 400;
          throw error;
        }
      }

      const detailsPayload = requestedItems.map((item) => {
        const p = productById.get(item.product_id);
        const price = Number(p.price) || 0;
        const subtotal = price * item.quantity;
        return {
          product_id: p.id,
          quantity: item.quantity,
          price,
          subtotal,
        };
      });

      const totalAmount = detailsPayload.reduce((sum, d) => sum + d.subtotal, 0);

      const tx = await Transaction.create(
        {
          user_id: userId,
          customer_id: customer_id ? Number(customer_id) : null,
          total_amount: totalAmount,
          payment_method: normalizedPayment,
        },
        { transaction: t }
      );

      await TransactionDetail.bulkCreate(
        detailsPayload.map((d) => ({ ...d, transaction_id: tx.id })),
        { transaction: t }
      );

      for (const item of requestedItems) {
        await Product.update(
          { stock: sequelize.literal(`stock - ${item.quantity}`) },
          { where: { id: item.product_id }, transaction: t }
        );
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
