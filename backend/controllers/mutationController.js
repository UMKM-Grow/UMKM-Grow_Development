const { Product, Branch, StockMutation, sequelize } = require('../models');

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
    const productAsal = await Product.findOne(
      {
        where: { id: product_id, branch_id: from_branch_id },
      },
      { transaction: t }
    );

    if (!productAsal) {
      await t.rollback();
      return res.status(404).json({ error: 'Produk tidak ditemukan di cabang asal' });
    }

    if (productAsal.stok < quantity) {
      await t.rollback();
      return res.status(400).json({
        error: `Stok tidak mencukupi. Stok tersedia: ${productAsal.stok}, diminta: ${quantity}`,
      });
    }

    // 2. Kurangi stok Cabang Asal
    productAsal.stok -= quantity;
    await productAsal.save({ transaction: t });

    // 3. Cari barang yang sama (berdasarkan SKU) di Cabang Tujuan
    let productTujuan = await Product.findOne(
      {
        where: { sku: productAsal.sku, branch_id: to_branch_id },
      },
      { transaction: t }
    );

    // 4. Jika sudah ada, tambah stoknya. Jika belum, buat produk baru di cabang tujuan.
    if (productTujuan) {
      productTujuan.stok += quantity;
      await productTujuan.save({ transaction: t });
    } else {
      await Product.create(
        {
          sku: productAsal.sku,
          nama_produk: productAsal.nama_produk,
          harga_jual: productAsal.harga_jual,
          harga_beli: productAsal.harga_beli,
          stok: quantity,
          branch_id: to_branch_id,
        },
        { transaction: t }
      );
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
        [sequelize.Op.or]: [{ from_branch_id: branch_id }, { to_branch_id: branch_id }],
      };
    }

    const mutations = await StockMutation.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'sku', 'nama_produk'] },
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
