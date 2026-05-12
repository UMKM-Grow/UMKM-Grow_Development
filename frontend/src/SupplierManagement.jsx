import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Plus, MessageCircle, X, History } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/suppliers';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    nama_supplier: '',
    kontak_person: '',
    nomor_wa: '',
    alamat: '',
    alamat: '',
    kategori_pasokan: ''
  });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [supplierHistory, setSupplierHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setSuppliers(res.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers', error);
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
        nama_supplier: supplier.nama_supplier,
        kontak_person: supplier.kontak_person,
        nomor_wa: supplier.nomor_wa,
        alamat: supplier.alamat || '',
        kategori_pasokan: supplier.kategori_pasokan || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        nama_supplier: '',
        kontak_person: '',
        nomor_wa: '',
        alamat: '',
        kategori_pasokan: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const openHistoryModal = async (supplier) => {
    setSelectedSupplierForHistory(supplier);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API_URL}/${supplier.id}/history`);
      setSupplierHistory(res.data.data || []);
    } catch (error) {
      console.error('Error fetching history', error);
      setSupplierHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedSupplierForHistory(null);
    setSupplierHistory([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`${API_URL}/${editingSupplier.id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      closeModal();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier', error);
      alert('Gagal menyimpan data supplier.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus supplier ini?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier', error);
      }
    }
  };

  const handleWhatsApp = (nomorWa) => {
    // Regex/Replace awalan 0 menjadi 62
    let formattedNumber = nomorWa.trim();
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('+62')) {
      formattedNumber = '62' + formattedNumber.substring(3);
    }
    
    // Remove any non-numeric characters
    formattedNumber = formattedNumber.replace(/\D/g, '');

    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Pemasok</h1>
            <p className="text-gray-500 mt-1">Kelola data mitra dan pemasok bahan baku Anda.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Plus size={20} />
            Tambah Supplier
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nama Supplier</th>
                  <th className="p-4 font-semibold">Kontak Person</th>
                  <th className="p-4 font-semibold">Kategori</th>
                  <th className="p-4 font-semibold">Alamat</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Memuat data...</td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Belum ada data supplier.</td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-900">{supplier.nama_supplier}</td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{supplier.kontak_person}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{supplier.nomor_wa}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          {supplier.kategori_pasokan || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{supplier.alamat || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleWhatsApp(supplier.nomor_wa)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Hubungi via WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => openHistoryModal(supplier)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Riwayat Pembelian"
                          >
                            <History size={18} />
                          </button>
                          <button
                            onClick={() => openModal(supplier)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier / Perusahaan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="nama_supplier"
                    required
                    value={formData.nama_supplier}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Contoh: PT. Sumber Tirta"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Person <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="kontak_person"
                      required
                      value={formData.kontak_person}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Nama PIC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="nomor_wa"
                      required
                      value={formData.nomor_wa}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="08123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Pasokan</label>
                  <input
                    type="text"
                    name="kategori_pasokan"
                    value={formData.kategori_pasokan}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Contoh: Bahan Baku, Kemasan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                  <textarea
                    name="alamat"
                    rows="3"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                    placeholder="Alamat supplier..."
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Riwayat Pembelian - {selectedSupplierForHistory?.nama_supplier}
              </h2>
              <button onClick={closeHistoryModal} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat riwayat...</div>
              ) : supplierHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Belum ada riwayat pembelian dari supplier ini.</div>
              ) : (
                <div className="space-y-4">
                  {supplierHistory.map((po) => (
                    <div key={po.id_po} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="font-semibold text-gray-800">Tanggal:</span> {new Date(po.tanggal_pesanan).toLocaleDateString('id-ID')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${po.status === 'Received' ? 'bg-green-100 text-green-700' : po.status === 'Ordered' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {po.status}
                          </span>
                          <span className="font-bold text-gray-900">Rp {Number(po.total_nilai).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <table className="w-full text-sm text-left border-t border-gray-100 mt-2 pt-2">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="py-1">Produk</th>
                            <th className="py-1 text-center">Qty</th>
                            <th className="py-1 text-right">Harga Satuan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {po.details?.map((detail) => (
                            <tr key={detail.id_detail_po}>
                              <td className="py-1 font-medium text-gray-800">{detail.product?.name || 'Produk Tidak Ditemukan'}</td>
                              <td className="py-1 text-center">{detail.kuantitas_pesanan}</td>
                              <td className="py-1 text-right">Rp {Number(detail.harga_beli).toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
