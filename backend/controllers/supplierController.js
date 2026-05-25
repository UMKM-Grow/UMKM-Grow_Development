const { Supplier } = require("../models");

const normalizeBranchId = (req) => Number(req.user?.branch_id) || null;

const getSuppliers = async (req, res) => {
  try {
    const branchId = normalizeBranchId(req);
    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch user tidak ditemukan" });
    }

    const suppliers = await Supplier.findAll({
      where: { branch_id: branchId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const branchId = normalizeBranchId(req);
    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch user tidak ditemukan" });
    }

    const { name, contact_person, phone, address } = req.body;

    if (!name || !contact_person || !phone) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nama supplier, PIC, dan nomor WhatsApp wajib diisi",
        });
    }

    const newSupplier = await Supplier.create({
      name: String(name).trim(),
      contact_person: String(contact_person).trim(),
      phone: String(phone).trim(),
      address: address ? String(address).trim() : null,
      branch_id: branchId,
    });

    return res.status(201).json({ success: true, data: newSupplier });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const branchId = normalizeBranchId(req);
    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch user tidak ditemukan" });
    }

    const { id } = req.params;
    const { name, contact_person, phone, address } = req.body;

    const supplier = await Supplier.findOne({
      where: { id, branch_id: branchId },
    });
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier tidak ditemukan" });
    }

    await supplier.update({
      name: String(name || supplier.name).trim(),
      contact_person: String(contact_person || supplier.contact_person).trim(),
      phone: String(phone || supplier.phone).trim(),
      address:
        address !== undefined
          ? address
            ? String(address).trim()
            : null
          : supplier.address,
    });

    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const branchId = normalizeBranchId(req);
    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch user tidak ditemukan" });
    }

    const { id } = req.params;
    const supplier = await Supplier.findOne({
      where: { id, branch_id: branchId },
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier tidak ditemukan" });
    }

    await supplier.destroy();
    return res
      .status(200)
      .json({ success: true, message: "Supplier berhasil dihapus" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
