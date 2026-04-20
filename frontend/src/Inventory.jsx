import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/products';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    base_price: 0,
    variants: []
  });

  useEffect(() => {
    axios
      .get(`${API_URL}?search=${search}`)
      .then((response) => {
        setProducts(response.data.data);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { variant_name: '', additional_price: 0, stock: 0, sku_variant: '' }]
    });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      setIsModalOpen(false);
      setFormData({ name: '', sku: '', description: '', category_id: '', base_price: 0, variants: [] });
      setLoading(true);
      const response = await axios.get(`${API_URL}?search=${search}`);
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error saving product:', error);
      setLoading(false);
      alert('Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setLoading(true);
        const response = await axios.get(`${API_URL}?search=${search}`);
        setProducts(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error deleting product:', error);
        setLoading(false);
      }
    }
  };

  const calculateTotalStock = (variants) => {
    return variants.reduce((total, variant) => total + parseInt(variant.stock || 0), 0);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Katalog Produk</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Tambah Produk
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </span>
        <input
          type="text"
          placeholder="Cari produk berdasarkan nama atau SKU..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => {
            setLoading(true);
            setSearch(e.target.value);
          }}
        />
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">SKU</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Nama Produk</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Kategori</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Harga (Base)</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Total Stok</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Memuat data...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Tidak ada produk ditemukan.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-sm">{product.sku}</td>
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4">{product.category_id || '-'}</td>
                  <td className="px-6 py-4">Rp {parseFloat(product.base_price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">
                      {calculateTotalStock(product.variants)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button className="text-gray-400 hover:text-blue-600"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Tambah Produk Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Kemeja Flanel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    required
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="KMJ-FLN-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Dasar (Rp)</label>
                  <input
                    required
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>

              {/* Section 2: Variants */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Varian Produk</h3>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={16} /> Tambah Varian
                  </button>
                </div>

                {formData.variants.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Belum ada varian ditambahkan.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nama Varian</label>
                          <input
                            required
                            placeholder="Warna - Ukuran"
                            value={variant.variant_name}
                            onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Harga Tambahan</label>
                          <input
                            required
                            type="number"
                            value={variant.additional_price}
                            onChange={(e) => handleVariantChange(index, 'additional_price', e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Stok</label>
                          <input
                            required
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <Save size={20} /> Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
