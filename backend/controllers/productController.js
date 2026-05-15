const { Product, ProductVariant, sequelize } = require('../models');
const { Op } = require('sequelize');

const productController = {
  // CREATE Product with Variants (Transaction)
  createProduct: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { name, sku, description, category_id, base_price, variants } = req.body;
      const normalizedSku = String(sku || '').trim();
      if (!normalizedSku) {
        await t.rollback();
        return res.status(400).json({ message: 'SKU is required' });
      }

      const existing = await Product.findOne({ where: { sku: normalizedSku }, transaction: t });
      if (existing) {
        await t.rollback();
        return res.status(409).json({ message: 'SKU already exists' });
      }

      const product = await Product.create({
        name, sku: normalizedSku, description, category_id, base_price
      }, { transaction: t });

      if (variants && variants.length > 0) {
        const variantsData = variants.map(v => ({
          ...v,
          product_id: product.id
        }));
        await ProductVariant.bulkCreate(variantsData, { transaction: t });
      }

      await t.commit();
      const fullProduct = await Product.findByPk(product.id, {
        include: [{ model: ProductVariant, as: 'variants' }]
      });

      res.status(201).json({ message: 'Product created successfully', data: fullProduct });
    } catch (error) {
      await t.rollback();
      const isUniqueError = error?.name === 'SequelizeUniqueConstraintError' || error?.name === 'SequelizeValidationError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'SKU already exists' });
      }
      res.status(500).json({ message: 'Error creating product', error: error.message });
    }
  },

  // READ All Products (Pagination & Search)
  getAllProducts: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        is_active: true,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } }
        ]
      };

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [{ model: ProductVariant, as: 'variants' }],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
  },

  // READ One Product
  getProductById: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [{ model: ProductVariant, as: 'variants' }]
      });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.status(200).json({ data: product });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
  },

  // UPDATE Product
  updateProduct: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { name, sku, base_price, is_active, description, category_id, variants } = req.body;
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        await t.rollback();
        return res.status(404).json({ message: 'Product not found' });
      }

      const normalizedSku = String(sku || '').trim();
      if (!normalizedSku) {
        await t.rollback();
        return res.status(400).json({ message: 'SKU is required' });
      }

      const skuChanged = normalizedSku !== String(product.sku || '');
      if (skuChanged) {
        const existing = await Product.findOne({
          where: {
            sku: normalizedSku,
            id: { [Op.ne]: product.id }
          },
          transaction: t
        });
        if (existing) {
          await t.rollback();
          return res.status(409).json({ message: 'SKU already exists' });
        }
      }

      await product.update(
        { name, sku: normalizedSku, base_price, is_active, description, category_id },
        { transaction: t }
      );

      if (Array.isArray(variants)) {
        await ProductVariant.destroy({ where: { product_id: product.id }, transaction: t });

        if (variants.length > 0) {
          const variantsData = variants.map(v => ({
            ...v,
            product_id: product.id
          }));
          await ProductVariant.bulkCreate(variantsData, { transaction: t });
        }
      }

      await t.commit();

      const fullProduct = await Product.findByPk(product.id, {
        include: [{ model: ProductVariant, as: 'variants' }]
      });

      res.status(200).json({ message: 'Product updated successfully', data: fullProduct });
    } catch (error) {
      await t.rollback();
      const isUniqueError = error?.name === 'SequelizeUniqueConstraintError' || error?.name === 'SequelizeValidationError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'SKU already exists' });
      }
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  },

  // DELETE Product (Soft Delete)
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      await product.update({ is_active: false });
      res.status(200).json({ message: 'Product soft deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
  },

  // Get Low Stock Products (Alert)
  getLowStockProducts: async (req, res) => {
    try {
      const branchId = Number(req.query.branch_id);
      if (!Number.isInteger(branchId) || branchId <= 0) {
        return res.status(400).json({ message: 'branch_id tidak valid atau tidak ditemukan.' });
      }

      const lowStockProducts = await Product.findAll({
        where: {
          is_active: true,
          branch_id: branchId,
          [Op.and]: [
            sequelize.where(
              sequelize.col('stok'),
              '<=',
              sequelize.col('stok_minimum')
            ),
          ],
        },
        order: [['stok', 'ASC']],
      });

      const data = lowStockProducts.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        stok: Number(item.stok),
        stok_minimum: Number(item.stok_minimum),
        branch_id: item.branch_id,
      }));

      res.status(200).json({ message: 'OK', data });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching low stock products', error: error.message });
    }
  },
};

module.exports = productController;
