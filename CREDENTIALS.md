# 🔐 UMKM-Grow - Login Credentials

Dokumentasi lengkap semua akun login yang tersedia di sistem UMKM-Grow.

---

## 🚨 PENTING - KEAMANAN

⚠️ **File ini berisi kredensial default untuk development/testing.**

- ✅ Gunakan HANYA untuk **development** dan **testing**
- ❌ JANGAN gunakan di **production**
- ❌ JANGAN commit file ini ke repository public
- ✅ Ganti semua password di production

---

## 📊 Default Accounts (Seeded via `seedData.js`)

### 1️⃣ **Admin Utama**
```
Email:    admin@example.com
Password: password123
Role:     admin
Branch:   Cabang Utama
Status:   Active
```

**Akses:**
- ✅ Full system access
- ✅ Manage users
- ✅ Manage all branches
- ✅ View all reports
- ✅ Manage products, inventory, POS
- ✅ Access all features

---

### 2️⃣ **Kasir Cabang Utama**
```
Email:    kasir@example.com
Password: password123
Role:     kasir
Branch:   Cabang Utama
Status:   Active
```

**Akses:**
- ✅ POS (Point of Sale)
- ✅ View products & inventory
- ✅ Process transactions
- ✅ Customer management
- ❌ User management
- ❌ Financial reports (limited)

---

### 3️⃣ **HRD Utama**
```
Email:    hrd@example.com
Password: password123
Role:     hrd
Branch:   Cabang Utama
Status:   Active
```

**Akses:**
- ✅ Employee management
- ✅ Attendance (Absensi)
- ✅ Payroll
- ✅ Shift management
- ❌ POS & Products
- ❌ Financial management

---

## 👨‍💻 Additional Accounts

### 4️⃣ **Lavio (Admin)**
```
Email:    lavio@example.com
Password: password123
Role:     admin
Branch:   -
Status:   Active
```

**Note:** Created via `createLavioUser.js`

**Akses:** Same as Admin (full system access)

---

## 🧪 Testing Accounts (Cypress E2E)

### 5️⃣ **Owner/Testing Account**
```
Email:    owner@umkmgrow.com
Password: rahasia123
Role:     owner (atau admin)
```

**Location:** `frontend/cypress/fixtures/user.json`

**Usage:**
- Digunakan untuk automated E2E testing
- All Cypress tests menggunakan akun ini
- Pastikan akun ini ada di database sebelum run tests

---

### 6️⃣ **Invalid User (untuk testing)**
```
Email:    salah@email.com
Password: passwordsalah
```

**Usage:** Testing negative scenarios (login gagal)

---

## 🏢 Branch Information

### **Cabang Utama**
```
ID:       (auto-generated)
Name:     Cabang Utama
Location: Jl. Raya Utama No. 123, Jakarta
Phone:    021-1234567
```

**Store Settings:**
- Service Charge: 5%
- Tax: 11%

---

### **Cabang Selatan**
```
ID:       (auto-generated)
Name:     Cabang Selatan
Location: Jl. Raya Selatan No. 45, Jakarta Selatan
Phone:    021-7654321
```

**Store Settings:**
- Service Charge: 0%
- Tax: 11%

---

## 🔄 How to Create Accounts

### **Cara 1: Via Seed Script (Recommended untuk setup awal)**

```bash
cd backend
node seedData.js
```

Output:
```
=== Seed completed successfully! ===

Login credentials:
Admin: admin@example.com / password123
Kasir: kasir@example.com / password123
HRD: hrd@example.com / password123
```

---

### **Cara 2: Via API (Manual)**

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "kasir",
  "branch_id": 1
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 5,
    "name": "User Name",
    "email": "user@example.com",
    "role": "kasir"
  }
}
```

---

### **Cara 3: Via MySQL Direct Insert**

```sql
-- Note: Password akan di-hash otomatis via Sequelize hooks
INSERT INTO users (name, email, password, role, branch_id, is_active, createdAt, updatedAt)
VALUES (
  'New User',
  'newuser@example.com',
  'password123',
  'kasir',
  1,
  1,
  NOW(),
  NOW()
);
```

---

## 🎭 Roles & Permissions

### **Available Roles:**

1. **owner** - Pemilik bisnis (full access)
2. **admin** - Administrator (manage system)
3. **hrd** - Human Resource (employee & payroll)
4. **kasir** - Cashier (POS & transactions)
5. **staff** - General staff (limited access)

### **Permission Matrix:**

| Feature             | Owner | Admin | HRD | Kasir | Staff |
|---------------------|-------|-------|-----|-------|-------|
| Dashboard           | ✅    | ✅    | ✅  | ✅    | ✅    |
| POS                 | ✅    | ✅    | ❌  | ✅    | ❌    |
| Inventory           | ✅    | ✅    | ❌  | ✅    | ❌    |
| Products            | ✅    | ✅    | ❌  | ✅    | ❌    |
| Members/CRM         | ✅    | ✅    | ❌  | ✅    | ❌    |
| Suppliers           | ✅    | ✅    | ❌  | ❌    | ❌    |
| Absensi             | ✅    | ✅    | ✅  | ✅    | ✅    |
| Payroll             | ✅    | ✅    | ✅  | ❌    | ❌    |
| Financial Reports   | ✅    | ✅    | ❌  | ❌    | ❌    |
| Expenses            | ✅    | ✅    | ❌  | ❌    | ❌    |
| Debts               | ✅    | ✅    | ❌  | ❌    | ❌    |
| Branches            | ✅    | ✅    | ❌  | ❌    | ❌    |
| User Management     | ✅    | ✅    | ❌  | ❌    | ❌    |
| Settings            | ✅    | ✅    | ❌  | ❌    | ❌    |
| Broadcast Promo     | ✅    | ✅    | ❌  | ❌    | ❌    |

---

## 🔒 Password Security

### **Hashing:**
- Passwords di-hash menggunakan **bcrypt**
- Salt rounds: 10
- Hash dilakukan otomatis via Sequelize hooks

### **Password Requirements:**
- Minimum length: 6 characters (recommended: 8+)
- Gunakan kombinasi: huruf besar, kecil, angka, simbol
- Jangan gunakan password yang mudah ditebak

### **Change Password (Production):**

**Endpoint:** `PUT /api/users/:id/password`

**Request:**
```json
{
  "oldPassword": "password123",
  "newPassword": "NewSecurePass@2024"
}
```

---

## 🧪 Testing Credentials

### **Untuk Cypress E2E Tests:**

File: `frontend/cypress/fixtures/user.json`

```json
{
  "validUser": {
    "email": "owner@umkmgrow.com",
    "password": "rahasia123"
  },
  "invalidUser": {
    "email": "salah@email.com",
    "password": "passwordsalah"
  }
}
```

### **Setup Test User:**

```bash
cd backend
node -e "
const { User } = require('./models');
User.create({
  name: 'Owner Test',
  email: 'owner@umkmgrow.com',
  password: 'rahasia123',
  role: 'owner',
  is_active: true
}).then(() => console.log('Test user created')).catch(console.error);
"
```

---

## 📱 First Time Login Flow

1. **Open Browser:** http://localhost:5173
2. **Login Page:** Masukkan email & password
3. **Dashboard:** Redirect ke dashboard setelah login sukses
4. **JWT Token:** Disimpan di `localStorage`
5. **Session:** Berlaku 24 jam (expired otomatis)

### **Login API Flow:**

```
POST /api/auth/login
↓
Verify credentials
↓
Generate JWT token
↓
Return token + user info
↓
Frontend save to localStorage
```

---

## 🚨 Troubleshooting

### **❌ Login Gagal "Invalid credentials"**

**Solusi:**
1. Pastikan email & password benar (case-sensitive)
2. Cek user ada di database:
   ```sql
   SELECT * FROM users WHERE email = 'admin@example.com';
   ```
3. Pastikan `is_active = 1`
4. Reset password jika perlu

---

### **❌ User tidak ada di database**

**Solusi:**
```bash
cd backend
node seedData.js
```

---

### **❌ Password tidak cocok**

**Note:** Password di database sudah di-hash (tidak bisa dibaca langsung)

**Solusi:** Reset via script:
```bash
node -e "
const { User } = require('./models');
User.findOne({ where: { email: 'admin@example.com' }})
  .then(user => user.update({ password: 'password123' }))
  .then(() => console.log('Password reset!'));
"
```

---

## 📝 Production Checklist

Sebelum deploy ke production:

- [ ] Ganti SEMUA default passwords
- [ ] Generate JWT_SECRET yang kuat (32+ chars random)
- [ ] Set password policy yang ketat
- [ ] Enable 2FA (jika ada)
- [ ] Disable test accounts (owner@umkmgrow.com)
- [ ] Review & update role permissions
- [ ] Implement rate limiting untuk login
- [ ] Add login attempt logging
- [ ] Setup password reset via email

---

## 🔗 Related Files

- `backend/seedData.js` - Seed script untuk default users
- `backend/createLavioUser.js` - Create user Lavio
- `backend/models/User.js` - User model dengan password hashing
- `backend/controllers/authController.js` - Login & auth logic
- `backend/middlewares/authMiddleware.js` - JWT verification
- `frontend/cypress/fixtures/user.json` - Testing credentials

---

## 📞 Need Help?

- **Email:** support@umkm-grow.com
- **GitHub Issues:** https://github.com/UMKM-Grow/UMKM-Grow_Development/issues

---

🔐 **Last Updated:** June 2026  
⚠️ **Remember:** Change all passwords in production!
