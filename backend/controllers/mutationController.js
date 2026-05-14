const { Product, ProductVariant, Branch, StockMutation, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createMutation = async (req, res) => {
  const t = await sequelize.transaction(); // Mulai transaksi untuk keamanan

  try {
    const { product_id, from_branch_id, to_branch_id, quantity, notes } = req.body;

    // Validasi input
    if (!product_id || !from_branch_id || !to_branch_id || !quantity) {
      await t.rollback();
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    if (quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Jumlah harus lebih dari 0' });
    }

    if (from_branch_id === to_branch_id) {
      await t.rollback();
      return res.status(400).json({ error: 'Cabang asal dan tujuan tidak boleh sama' });
    }

    // 1. Cek stok di Cabang Asal
    const productAsal = await Product.findOne({
      where: { id: product_id, branch_id: from_branch_id },
      include: [{ model: ProductVariant, as: 'variants' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!productAsal) {
      await t.rollback();
      return res.status(404).json({ error: 'Produk tidak ditemukan di cabang asal' });
    }

    const variantStock = Array.isArray(productAsal.variants)
      ? productAsal.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)
      : 0;
    const totalAvailableStock = Number(productAsal.stok || 0) + variantStock;

    if (totalAvailableStock < quantity) {
      await t.rollback();
      return res.status(400).json({
        error: `Stok tidak mencukupi. Stok tersedia: ${totalAvailableStock}, diminta: ${quantity}`,
      });
    }

    // 2. Kurangi stok Cabang Asal
    let remaining = quantity;
    if (productAsal.stok > 0) {
      const deductFromProduct = Math.min(productAsal.stok, remaining);
      productAsal.stok -= deductFromProduct;
      remaining -= deductFromProduct;
      await productAsal.save({ transaction: t });
    }

    if (remaining > 0 && Array.isArray(productAsal.variants)) {
      for (const variant of productAsal.variants) {
        if (remaining <= 0) break;

        const deductFromVariant = Math.min(Number(variant.stock) || 0, remaining);
        if (deductFromVariant <= 0) continue;

        variant.stock -= deductFromVariant;
        remaining -= deductFromVariant;
        await variant.save({ transaction: t });
      }
    }

    // 3. Cari barang yang sama (berdasarkan SKU) di Cabang Tujuan
    let productTujuan = await Product.findOne({
      where: { sku: productAsal.sku, branch_id: to_branch_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 4. Jika sudah ada, tambah stoknya. Jika belum, buat produk baru di cabang tujuan.
    if (productTujuan) {
      productTujuan.stok += quantity;
      await productTujuan.save({ transaction: t });
    } else {
      try {
        await Product.create(
          {
            sku: productAsal.sku,
            name: productAsal.name,
            description: productAsal.description,
            category_id: productAsal.category_id,
            base_price: productAsal.base_price,
            branch_id: to_branch_id,
            is_active: productAsal.is_active,
            stok: quantity, // Set initial stock for new product
          },
          { transaction: t }
        );
      } catch (createError) {
        // Jika masih ada error unique constraint atau lainnya
        if (createError.name === 'SequelizeUniqueConstraintError') {
          await t.rollback();
          return res.status(409).json({ error: 'Produk dengan SKU ini sudah ada di cabang tujuan' });
        }
        throw createError; // Re-throw untuk error lainnya
      }
    }

    // 5. Catat riwayat ke tabel StockMutations
    const mutation = await StockMutation.create(
      {
        product_id,
        from_branch_id,
        to_branch_id,
        quantity,
        tanggal: new Date(),
      },
      { transaction: t }
    );

    // 6. SUKSES! Kunci perubahan secara permanen
    await t.commit();
    res.status(201).json({
      message: 'Mutasi stok berhasil diproses',
      data: mutation,
    });
  } catch (error) {
    // JIKA GAGAL: Kembalikan semua data seperti semula (Rollback)
    await t.rollback();
    console.error('Mutation error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMutationHistory = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let where = {};
    if (branch_id) {
      where = {
        [Op.or]: [{ from_branch_id: branch_id }, { to_branch_id: branch_id }],
      };
    }

    const mutations = await StockMutation.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'sku', ['name', 'nama_produk']] },
        { model: Branch, as: 'fromBranch', attributes: ['id_cabang', 'nama_cabang'] },
        { model: Branch, as: 'toBranch', attributes: ['id_cabang', 'nama_cabang'] },
      ],
      order: [['tanggal', 'DESC']],
    });

    res.status(200).json(mutations);
  } catch (error) {
    console.error('Get mutations error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMutationById = async (req, res) => {
  try {
    const { id } = req.params;

    const mutation = await StockMutation.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Branch, as: 'fromBranch' },
        { model: Branch, as: 'toBranch' },
      ],
    });

    if (!mutation) {
      return res.status(404).json({ error: 'Mutasi tidak ditemukan' });
    }

    res.status(200).json(mutation);
  } catch (error) {
    console.error('Get mutation error:', error);
    res.status(500).json({ error: error.message });
  }
};
