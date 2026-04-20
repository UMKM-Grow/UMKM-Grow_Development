# PBI-01 (Afnan) — Product Catalog (Inventory) Full Scope

Dokumen ini merangkum scope kerja **Afnan** untuk penyelesaian **PBI-01** pada branch `afnan`, dengan fokus utama: **manajemen Katalog Produk + Varian (CRUD)** dan UI grid card berbasis Tailwind.

## Ringkasan Fitur (PBI-01)

**Tujuan PBI-01**
- Mengelola data **Produk** (Create, Read, Update, Delete/soft-delete).
- Mengelola **Varian Produk** secara dinamis (nama varian, harga tambahan, stok, SKU varian).
- UI premium: grid card gelap (brand colors) + modal form (glassmorphism) tanpa pindah halaman.

**Komponen Utama**
- **Backend API**: menyediakan endpoint `/api/products` dengan dukungan varian.
- **Frontend Inventory**: grid card + modal untuk tambah/edit produk dan varian, auto-refresh setelah aksi CRUD.

## Cara Menjalankan (Dev)

### Backend
1. Masuk folder `backend`
2. Install dependency
3. Jalankan server

```bash
cd backend
npm install
npm start
```

Server default berjalan di `http://localhost:5000`.

### Frontend
1. Masuk folder `frontend`
2. Install dependency
3. Jalankan Vite dev server

```bash
cd frontend
npm install
npm run dev
```

Frontend default berjalan di `http://localhost:5173`.

## Backend (Apa yang Dibuat untuk PBI-01)

### 1) Routing Produk
- Base path: `/api/products`
- File: `backend/routes/productRoutes.js`

Endpoint:
- `GET /api/products` — ambil list produk (pagination + search)
- `GET /api/products/:id` — ambil detail 1 produk (termasuk variants)
- `POST /api/products` — create produk + create variants (transaction)
- `PUT /api/products/:id` — update produk + replace variants (transaction)
- `DELETE /api/products/:id` — soft delete (set `is_active=false`)

### 2) Controller Produk (Transaksi & Varian)
- File: `backend/controllers/productController.js`

Poin penting:
- **Create dengan transaksi**: produk dibuat dahulu, lalu variants dibuat dengan `bulkCreate` memakai `product_id` yang baru.
- **Update dengan transaksi**: update produk, lalu variants di-*replace* (hapus variants lama lalu create ulang berdasarkan payload terbaru).
- **Soft delete**: data tidak dihapus permanen, hanya `is_active` diubah menjadi `false`.
- **Anti duplikasi SKU**: pada create, backend melakukan pengecekan `sku` dan mengembalikan `409` jika sudah terpakai.

### 3) Model & Relasi (Sequelize)
- `backend/models/Product.js`
  - Field penting: `name`, `sku` (unique), `category_id`, `base_price`, `is_active`
- `backend/models/ProductVariant.js`
  - Field penting: `product_id`, `variant_name`, `sku_variant`, `additional_price`, `stock`
- Relasi:
  - `Product.hasMany(ProductVariant, { as: 'variants' })`
  - `ProductVariant.belongsTo(Product)`

## Frontend (Apa yang Dibuat untuk PBI-01)

### 1) Tailwind Brand Colors (UI gelap)
- Tailwind config: `frontend/tailwind.config.cjs`
- CSS entry Tailwind: `frontend/src/index.css`

Brand palette yang dipakai di UI:
- `bg-brand-dark`, `text-brand-ice`, `bg-brand-slate`, `bg-brand-frost`, dll.

### 2) Inventory Grid Card (Bukan Table)
- File: `frontend/src/Inventory.jsx`

Fitur utama di halaman Inventory:
- Layout **grid card** (responsif) untuk list produk.
- Tombol utama **“Tambah Produk Baru”** di header untuk membuka modal (tanpa pindah halaman).
- Tombol **Edit** & **Delete** di setiap card.
- **Auto-refresh**: setelah create/update/delete, UI memanggil ulang fetch list produk.
- Dummy image realistis:
  - Menggunakan `loremflickr` dengan keyword English yang lebih relevan (mis. `shirt,workwear,office` untuk “kemeja”)
  - Memakai `lock=<productId>` agar gambar konsisten per produk (tidak berubah-ubah tiap refresh).

### 3) Modal Form Produk + Varian Dinamis (Core PBI-01)
- File: `frontend/src/ProductFormModal.jsx`

Fitur modal:
- Overlay glassmorphism: `bg-black/50 backdrop-blur-sm`
- Input dark-mode premium: `bg-brand-dark/50 border border-white/20 ...`
- State varian dinamis:
  - `variants` berbentuk array
  - Tombol **Tambah Varian** menambah row input baru
  - Tombol hapus per row varian
- Submit (Create/Update) mengirim payload produk + array variants ke API
- Anti-duplikasi submit:
  - Guard `useRef` untuk mencegah double-submit (double click/enter) memicu request ganda

## Payload API (Kontrak Data yang Dipakai UI)

### Create / Update (POST/PUT)
Contoh payload:
```json
{
  "name": "Kemeja Kerja Oxford",
  "sku": "KMJ-001",
  "category_id": 1,
  "base_price": 150000,
  "variants": [
    {
      "variant_name": "Size L - Putih",
      "additional_price": 10000,
      "stock": 25,
      "sku_variant": "KMJ-001-V1"
    }
  ]
}
```

### Delete (Soft Delete)
- `DELETE /api/products/:id` mengubah `is_active=false`

## File yang Relevan untuk PBI-01

**Backend**
- `backend/index.js`
- `backend/routes/productRoutes.js`
- `backend/controllers/productController.js`
- `backend/models/Product.js`
- `backend/models/ProductVariant.js`

**Frontend**
- `frontend/src/Inventory.jsx`
- `frontend/src/ProductFormModal.jsx`
- `frontend/src/index.css`
- `frontend/tailwind.config.cjs`

