const { sequelize, Supplier, PurchaseOrder, PurchaseOrderDetail, Product } = require('./models');

const seedPO = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Ensure tables exist

    console.log('Seeding PO History...');

    // Get a supplier (or create one)
    let supplier = await Supplier.findOne();
    if (!supplier) {
      supplier = await Supplier.create({
        nama_supplier: 'PT. Sumber Material Maju',
        kontak_person: 'Budi Santoso',
        nomor_wa: '081234567890',
        alamat: 'Jl. Industri No. 12',
        kategori_pasokan: 'Bahan Baku'
      });
    }

    // Get a product (or create one)
    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: 'Plastik Kemasan 500g',
        sku: 'BHK-001',
        category_id: null,
        base_price: 500,
        is_active: true
      });
    }

    // Check if PO already exists
    const existingPO = await PurchaseOrder.findOne({ where: { supplier_id: supplier.id } });
    if (existingPO) {
      console.log('PO Data already exists for this supplier.');
      return;
    }

    // Create a Purchase Order
    const po = await PurchaseOrder.create({
      supplier_id: supplier.id,
      tanggal_pesanan: new Date('2026-05-01'),
      status: 'Received',
      total_nilai: 50000,
      user_id: null // Assuming no user attached for now
    });

    // Create PO Detail
    await PurchaseOrderDetail.create({
      po_id: po.id_po,
      product_id: product.id,
      kuantitas_pesanan: 100,
      harga_beli: 500
    });

    console.log('Seeding Success!');
  } catch (error) {
    console.error('Seeding Failed:', error);
  } finally {
    process.exit();
  }
};

seedPO();
