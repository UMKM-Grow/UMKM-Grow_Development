# 📚 Penjelasan Arsitektur UMKM-Grow

## 🎯 Ringkasan
UMKM-Grow adalah sistem manajemen toko UMKM berbasis web dengan arsitektur **Full-Stack JavaScript** yang menggunakan pola **MVC (Model-View-Controller)** dan **REST API**.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP Request/Response
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React.js)                       │
│  - Components (UI)                                           │
│  - Axios (HTTP Client)                                       │
│  - React Router (Navigation)                                 │
│  - Tailwind CSS (Styling)                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes → Middleware → Controller → Model            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                          │
│  - Tables (Data Storage)                                     │
│  - Relations (Foreign Keys)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Struktur Folder

### **Backend (Server-Side)**
```
backend/
├── controllers/        # Logic bisnis (CRUD operations)
├── models/            # Definisi tabel database (Sequelize ORM)
├── routes/            # Endpoint API
├── middlewares/       # Authentication & validation
├── services/          # Business logic tambahan
├── config/            # Konfigurasi database
└── index.js           # Entry point server
```

### **Frontend (Client-Side)**
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── *.jsx          # Pages (Members, POS, Dashboard, dll)
│   ├── App.jsx        # Routing & layout utama
│   └── main.jsx       # Entry point frontend
└── cypress/e2e/       # End-to-end testing
```

---

## 🔄 Alur Kerja Sistem

Mari kita gunakan **Fitur Member (Loyalty Customer)** sebagai contoh case:

### **1️⃣ USER MEMBUKA HALAMAN MEMBERS**

**Frontend (Members.jsx)**
```javascript
// User buka halaman /members
cy.visit("/members")

// React component dimuat
function Members() {
  useEffect(() => {
    fetchMembers(); // Panggil API saat halaman load
  }, []);
}
```

---

### **2️⃣ FRONTEND REQUEST DATA KE BACKEND**

**Frontend → Backend**
```javascript
// Members.jsx (Frontend)
const fetchMembers = async () => {
  const response = await axios.get(
    `${API_BASE}/members?page=1&limit=10&search=`
  );
  setMembers(response.data.data);
};
```

**Request yang dikirim:**
```
GET http://localhost:5000/api/members?page=1&limit=10&search=
Headers: {
  Authorization: "Bearer <JWT_TOKEN>"
}
```

---

### **3️⃣ BACKEND MENERIMA REQUEST**

**A. Routes (memberRoutes.js)**
```javascript
// Routing: Menentukan endpoint dan handler
router.get('/members', authMiddleware, memberController.getAllMembers);
```

**B. Middleware (authMiddleware.js)**
```javascript
// Validasi: Cek apakah user sudah login
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  // Verify JWT token
  const decoded = jwt.verify(token, SECRET_KEY);
  req.user = decoded;
  next(); // Lanjut ke controller
};
```

**C. Controller (memberController.js)**
```javascript
// Logic Bisnis: Ambil data dari database
getAllMembers: async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  
  // Query ke database
  const members = await Customer.findAndCountAll({
    where: { is_active: true },
    limit: parseInt(limit),
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']]
  });
  
  res.status(200).json({ data: members.rows });
}
```

**D. Model (Member.js / Customer.js)**
```javascript
// Definisi struktur tabel database
const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, unique: true },
  email: { type: DataTypes.STRING },
  loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  level: { type: DataTypes.ENUM('Bronze', 'Silver', 'Gold') },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
});
```

---

### **4️⃣ DATABASE QUERY**

**SQL Query yang dijalankan (Behind the scenes oleh Sequelize):**
```sql
SELECT id, name, phone, email, loyalty_points, level
FROM customers
WHERE is_active = 1
ORDER BY createdAt DESC
LIMIT 10 OFFSET 0;
```

**Response dari Database:**
```json
[
  {
    "id": 1,
    "name": "Budi Santoso",
    "phone": "081234567890",
    "email": "budi@email.com",
    "loyalty_points": 150,
    "level": "Gold"
  },
  ...
]
```

---

### **5️⃣ BACKEND KIRIM RESPONSE KE FRONTEND**

**Backend → Frontend**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Budi Santoso",
      "phone": "081234567890",
      "loyalty_points": 150,
      "level": "Gold"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### **6️⃣ FRONTEND RENDER DATA**

**Frontend (Members.jsx)**
```javascript
// Update state dengan data dari backend
setMembers(response.data.data);

// React render UI
{members.map((member) => (
  <tr key={member.id}>
    <td>{member.name}</td>
    <td>{member.phone}</td>
    <td>
      <span className="badge-gold">{member.level}</span>
    </td>
    <td>{member.loyalty_points} poin</td>
  </tr>
))}
```

**User melihat tampilan:**
```
┌───────────────────────────────────────────────────────┐
│ 👤 Member Management                    [+ Add Member] │
├───────────────────────────────────────────────────────┤
│ Nama            │ Nomor HP      │ Level  │ Poin       │
├───────────────────────────────────────────────────────┤
│ Budi Santoso    │ 081234567890  │ 🥇Gold │ 150        │
│ Ani Wijaya      │ 081298765432  │ 🥈Silver│ 80        │
│ Citra Lestari   │ 081356781234  │ 🥉Bronze│ 20        │
└───────────────────────────────────────────────────────┘
```

---

## ✏️ CREATE Member (Tambah Data Baru)

### **1. User Klik Tombol "Add Member"**

**Frontend:**
```javascript
const handleCreate = async (memberData) => {
  await axios.post(`${API_BASE}/members`, {
    nama: memberData.nama,
    nomor_telepon: memberData.nomor_telepon,
    email: memberData.email,
    address: memberData.address
  });
  
  fetchMembers(); // Refresh data
};
```

**Request:**
```
POST http://localhost:5000/api/members
Body: {
  "nama": "Doni Ahmad",
  "nomor_telepon": "081999888777",
  "email": "doni@email.com"
}
```

### **2. Backend Proses**

**Controller:**
```javascript
createMember: async (req, res) => {
  const { nama, nomor_telepon, email } = req.body;
  
  // Insert ke database
  const customer = await Customer.create({
    name: nama,
    phone: nomor_telepon,
    email: email,
    loyalty_points: 0,
    level: 'Bronze',
    is_active: true
  });
  
  res.status(201).json({
    message: 'Member created successfully',
    data: customer
  });
}
```

**SQL Query:**
```sql
INSERT INTO customers (name, phone, email, loyalty_points, level, is_active)
VALUES ('Doni Ahmad', '081999888777', 'doni@email.com', 0, 'Bronze', 1);
```

---

## 🔄 UPDATE Member (Edit Data)

**Frontend:**
```javascript
const handleUpdate = async (memberData, memberId) => {
  await axios.put(`${API_BASE}/members/${memberId}`, {
    nama: memberData.nama,
    nomor_telepon: memberData.nomor_telepon,
    loyalty_points: memberData.loyalty_points,
    level: memberData.level
  });
};
```

**SQL Query:**
```sql
UPDATE customers
SET name = 'Budi Santoso Updated',
    loyalty_points = 200,
    level = 'Gold'
WHERE id = 1;
```

---

## 🗑️ DELETE Member (Soft Delete)

**Note:** Sistem ini menggunakan **soft delete** (tidak menghapus data fisik)

**Frontend:**
```javascript
const handleDelete = async (memberId) => {
  await axios.delete(`${API_BASE}/members/${memberId}`);
};
```

**Backend Controller:**
```javascript
deleteMember: async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  
  // Soft delete: ubah is_active jadi false
  await customer.update({ is_active: false });
  
  res.status(200).json({ message: 'Member deleted' });
}
```

**SQL Query:**
```sql
UPDATE customers
SET is_active = 0
WHERE id = 1;
```

---

## 🔗 Relasi Database

### **Contoh: Transaksi POS**

**Relasi Tables:**
```
customers (Member/Pelanggan)
    ↓ 1:N
transactions (Header Transaksi)
    ↓ 1:N
transaction_details (Detail Produk)
    ↓ N:1
products (Master Produk)
```

**SQL dengan JOIN:**
```sql
SELECT 
  t.id as transaction_id,
  c.name as customer_name,
  c.loyalty_points,
  td.product_name,
  td.quantity,
  td.price,
  t.total
FROM transactions t
LEFT JOIN customers c ON t.customer_id = c.id
INNER JOIN transaction_details td ON t.id = td.transaction_id
WHERE t.id = 123;
```

**Sequelize ORM (Backend):**
```javascript
const transaction = await Transaction.findByPk(123, {
  include: [
    { model: Customer, as: 'customer' },
    { model: TransactionDetail, include: [Product] }
  ]
});
```

---

## 🔐 Authentication Flow

### **Login Process:**

**1. User Input Username & Password**
```javascript
// Login.jsx
const handleLogin = async () => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: 'admin@umkm.com',
    password: 'password123'
  });
  
  localStorage.setItem('token', response.data.token);
  navigate('/dashboard');
};
```

**2. Backend Verify**
```javascript
// authController.js
login: async (req, res) => {
  const { email, password } = req.body;
  
  // Cek user di database
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  
  // Verify password (bcrypt)
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  
  res.json({ token, user });
}
```

**3. Setiap Request Selanjutnya**
```javascript
// authMiddleware.js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Attach user info ke request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
```

---

## 🧪 Testing (Cypress E2E)

### **Contoh Test Members:**

```javascript
// members.cy.js
describe("Members CRUD", () => {
  it("Harus bisa tambah member baru", () => {
    // 1. Login dulu
    cy.login('admin@umkm.com', 'password');
    
    // 2. Buka halaman members
    cy.visit("/members");
    
    // 3. Klik tombol Add Member
    cy.contains("button", "Add Member").click();
    
    // 4. Isi form
    cy.get('input[name="nama"]').type("Test Member");
    cy.get('input[name="nomor_telepon"]').type("081234567890");
    
    // 5. Submit
    cy.contains("button", "Save").click();
    
    // 6. Verifikasi data muncul di tabel
    cy.contains("td", "Test Member").should("be.visible");
  });
});
```

---

## 📦 Technology Stack

### **Frontend:**
- **React.js** - UI Framework
- **Axios** - HTTP Client
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Cypress** - E2E Testing

### **Backend:**
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **Sequelize** - ORM (Object-Relational Mapping)
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **Multer** - File Upload

### **Database:**
- **MySQL** - Relational Database

### **Additional:**
- **WhatsApp Web.js** - WhatsApp Integration
- **QRCode** - QR Generator
- **Moment.js** - Date Handling

---

## 🚀 Cara Kerja Singkat

1. **User** buka browser → akses `localhost:5173` (Frontend)
2. **Frontend** kirim HTTP request → `localhost:5000/api/*` (Backend)
3. **Backend** terima request → verifikasi auth → proses logic
4. **Backend** query database → dapat data
5. **Backend** kirim response JSON → Frontend
6. **Frontend** render data → User lihat tampilan

---

## 🎓 Kesimpulan

**UMKM-Grow** menggunakan arsitektur **client-server** dengan pemisahan yang jelas:

- ✅ **Frontend (React)** - Tampilan UI, interaksi user
- ✅ **Backend (Express)** - Logic bisnis, API, security
- ✅ **Database (MySQL)** - Penyimpanan data

Semua berkomunikasi via **REST API** dengan format **JSON**, dan dilindungi dengan **JWT Authentication**.

Pola ini membuat sistem:
- **Scalable** - Mudah dikembangkan
- **Maintainable** - Mudah di-maintain
- **Testable** - Mudah ditest (E2E, Unit test)
- **Secure** - Terproteksi dengan auth & validation

---

📝 **Dibuat untuk dokumentasi UMKM-Grow Project**
