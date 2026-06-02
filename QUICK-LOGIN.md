# ⚡ Quick Login Reference

Akses cepat kredensial login untuk development.

---

## 🔑 Default Accounts

### **Admin** (Full Access)
```
📧 admin@example.com
🔒 password123
```

### **Kasir** (Cashier - POS)
```
📧 kasir@example.com
🔒 password123
```

### **HRD** (Human Resource)
```
📧 hrd@example.com
🔒 password123
```

### **Lavio** (Admin)
```
📧 lavio@example.com
🔒 password123
```

---

## 🧪 Testing Account (Cypress)

```
📧 owner@umkmgrow.com
🔒 rahasia123
```

---

## 🌐 Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Login Page:** http://localhost:5173/login

---

## 🚀 Setup First Time

```bash
# 1. Start MySQL
# Windows: XAMPP/Laragon
# Mac: brew services start mysql

# 2. Create Database
mysql -u root -p
CREATE DATABASE umkm_grow;
exit;

# 3. Seed Users
cd backend
node seedData.js

# 4. Start App
cd ..
npm run dev
```

---

## 📚 Full Documentation

See **[CREDENTIALS.md](CREDENTIALS.md)** for complete documentation.

---

⚠️ **Development Only** - Change passwords in production!
