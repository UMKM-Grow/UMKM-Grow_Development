const { Supplier, PurchaseOrder, PurchaseOrderDetail, Product } = require('../models');

// GET all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// POST new supplier
const createSupplier = async (req, res) => {
  try {
    const { nama_supplier, kontak_person, nomor_wa, alamat, kategori_pasokan } = req.body;
    
    if (!nama_supplier || !kontak_person || !nomor_wa) {
      return res.status(400).json({ success: false, message: 'Nama supplier, kontak person, dan nomor WA wajib diisi' });
    }

    const newSupplier = await Supplier.create({
      nama_supplier,
      kontak_person,
      nomor_wa,
      alamat,
      kategori_pasokan
    });

    res.status(201).json({ success: true, data: newSupplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// PUT update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_supplier, kontak_person, nomor_wa, alamat, kategori_pasokan } = req.body;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }

    await supplier.update({
      nama_supplier,
      kontak_person,
      nomor_wa,
      alamat,
      kategori_pasokan
    });

    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// DELETE supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }

    await supplier.destroy();
    res.status(200).json({ success: true, message: 'Supplier berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// GET supplier history (PO and Details)
const getSupplierHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }

    const history = await PurchaseOrder.findAll({
      where: { supplier_id: id },
      include: [
        {
          model: PurchaseOrderDetail,
          as: 'details',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name']
            }
          ]
        }
      ],
      order: [['tanggal_pesanan', 'DESC']]
    });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierHistory
};
