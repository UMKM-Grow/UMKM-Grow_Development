import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Search, Package, Layers, DollarSign, Activity } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/products';

const Inventory = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  
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
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}?search=${search}`);
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

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
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const calculateTotalStock = (variants) => {
    return variants.reduce((total, variant) => total + parseInt(variant.stock || 0), 0);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-ice selection:text-brand-dark overflow-x-hidden">
      {/* Background Decor with Parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: y1 }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-slate/20 blur-[120px] rounded-full"
        ></motion.div>
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-brand-ice/10 blur-[100px] rounded-full"
        ></motion.div>
      </div>

      <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-display font-black text-white uppercase tracking-tighter leading-none mb-4">
              Product<br/><span className="text-brand-ice">Catalog</span>
            </h1>
            <p className="text-brand-ice/60 max-w-xl text-lg font-medium">
              Manage your inventory with high-precision tools and a modern glassmorphism interface.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-wrap gap-4 mt-8"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-brand-dark px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-brand-ice transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-brand-ice/20"
            >
              <Plus size={24} /> ADD NEW PRODUCT
            </button>
            <div className="relative flex-1 min-w-[300px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Search size={24} />
              </span>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="w-full pl-14 pr-6 py-4 bg-brand-frost backdrop-blur-md border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-ice/50 text-lg transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Products', value: products.length, icon: Package, color: 'text-blue-400' },
            { label: 'Total Stock', value: products.reduce((acc, p) => acc + calculateTotalStock(p.variants), 0), icon: Layers, color: 'text-emerald-400' },
            { label: 'Active Items', value: products.filter(p => p.is_active).length, icon: Activity, color: 'text-brand-ice' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-6 bg-brand-frost backdrop-blur-md border border-white/10 rounded-3xl shadow-lg flex items-center justify-between"
            >
              <div>
                <p className="text-white/40 font-bold uppercase tracking-wider text-xs mb-1">{stat.label}</p>
                <h3 className="text-3xl font-display font-black">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={28} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Product Table Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="bg-brand-frost backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-white/40">SKU</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-white/40">Product Name</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-white/40 text-center">Variants</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-white/40">Price</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-white/40 text-center">Total Stock</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-brand-ice/20 border-t-brand-ice rounded-full animate-spin"></div>
                        <p className="font-bold text-white/40 uppercase tracking-widest">Loading Inventory...</p>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center font-bold text-white/40 uppercase tracking-widest">
                      No products found in database.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <motion.tr 
                      key={product.id} 
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      className="group transition-colors"
                    >
                      <td className="px-8 py-6 font-mono text-sm text-brand-ice/80">{product.sku}</td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-lg group-hover:text-brand-ice transition-colors">{product.name}</div>
                        <div className="text-white/40 text-xs font-medium uppercase tracking-wider">{product.category_id || 'Uncategorized'}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-tighter">
                          {product.variants?.length || 0} Types
                        </span>
                      </td>
                      <td className="px-8 py-6 font-display font-black text-xl">
                        <span className="text-brand-ice text-sm mr-1">Rp</span>
                        {parseFloat(product.base_price).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-2xl font-display font-black ${calculateTotalStock(product.variants) < 10 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {calculateTotalStock(product.variants)}
                          </span>
                          <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Units</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button className="p-3 bg-white/5 hover:bg-brand-ice hover:text-brand-dark border border-white/10 rounded-2xl transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-3 bg-white/5 hover:bg-red-500 text-white border border-white/10 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modern Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-brand-dark border border-white/20 rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-brand-frost backdrop-blur-md">
                <div>
                  <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Register <span className="text-brand-ice">Inventory</span></h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Add new asset to warehouse</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={32} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Section 1: Core Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-ice/20 flex items-center justify-center text-brand-ice">
                      <Package size={24} />
                    </div>
                    <h3 className="text-xl font-display font-black uppercase tracking-widest italic">Core Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Product Identity</label>
                      <input
                        required
                        name="name"
                        placeholder="e.g. ULTRA BOOST RUNNING SHOES"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-ice text-lg font-bold placeholder:text-white/10 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Global SKU</label>
                      <input
                        required
                        name="sku"
                        placeholder="SKU-8829-XL"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-ice font-mono text-brand-ice uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Base Price (IDR)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-brand-ice tracking-tighter">Rp</span>
                        <input
                          required
                          type="number"
                          name="base_price"
                          value={formData.base_price}
                          onChange={handleInputChange}
                          className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-ice font-display font-black text-xl"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1">Manifest Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Provide detailed technical specifications..."
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-ice text-sm font-medium leading-relaxed"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Section 2: Dynamic Variants */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-ice/20 flex items-center justify-center text-brand-ice">
                        <Layers size={24} />
                      </div>
                      <h3 className="text-xl font-display font-black uppercase tracking-widest italic">Product Variants</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-6 py-3 bg-brand-ice text-brand-dark rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      + Add New Type
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.variants.length === 0 ? (
                      <div className="p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center">
                        <p className="text-white/20 font-black uppercase tracking-[0.3em] text-xs">Awaiting variant configuration</p>
                      </div>
                    ) : (
                      formData.variants.map((variant, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-wrap md:flex-nowrap items-end gap-4 relative group"
                        >
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">Variant ID / Spec</label>
                            <input
                              required
                              placeholder="COLOR - SIZE"
                              value={variant.variant_name}
                              onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-ice text-sm font-bold uppercase tracking-tighter"
                            />
                          </div>
                          <div className="w-32">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">Surcharge</label>
                            <input
                              required
                              type="number"
                              value={variant.additional_price}
                              onChange={(e) => handleVariantChange(index, 'additional_price', e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-ice text-sm font-black text-brand-ice"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">Quantity</label>
                            <input
                              required
                              type="number"
                              value={variant.stock}
                              onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-ice text-sm font-black"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-10 flex justify-end gap-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 bg-brand-ice text-brand-dark rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-ice/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Confirm & Store Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Inventory;
