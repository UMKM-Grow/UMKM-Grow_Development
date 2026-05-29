import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit2, Trash2, Plus, X } from "lucide-react";

const API_URL = "http://localhost:5000/api/suppliers";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    address: "",
  });

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await axios.get(API_URL, {
        headers: getHeaders(),
      });
      setSuppliers(res.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      setErrorMessage(
        error?.response?.data?.message || "Gagal memuat data supplier.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        address: supplier.address || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        contact_person: "",
        phone: "",
        address: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      address: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage("");
      if (editingSupplier) {
        await axios.put(`${API_URL}/${editingSupplier.id}`, formData, {
          headers: getHeaders(),
        });
      } else {
        await axios.post(API_URL, formData, {
          headers: getHeaders(),
        });
      }
      closeModal();
      fetchSuppliers();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      alert(error?.response?.data?.message || "Gagal menyimpan data supplier.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus supplier ini?"))
      return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: getHeaders(),
      });
      fetchSuppliers();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      alert(error?.response?.data?.message || "Gagal menghapus supplier.");
    }
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Supplier</h1>
            <p className="text-sm text-gray-500">Kelola supplier aktif berdasarkan cabang Anda.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
          >
            <Plus size={16} />
            Tambah Supplier
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
            {errorMessage}
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Supplier</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PIC</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">No. WhatsApp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">Memuat data...</td></tr>
                ) : suppliers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">Belum ada data supplier.</td></tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{supplier.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{supplier.contact_person}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{supplier.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{supplier.address || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openModal(supplier)}
                            className="text-gray-400 hover:text-blue-600 transition duration-150"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-gray-400 hover:text-rose-500 transition duration-150"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Supplier / PT <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder="Contoh: PT. Sumber Tirta"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" name="contact_person" required value={formData.contact_person} onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder="Nama PIC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" name="phone" required value={formData.phone} onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  name="address" rows="3" value={formData.address} onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
                  placeholder="Alamat supplier..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={closeModal}
                  className="bg-white text-gray-700 font-medium text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
