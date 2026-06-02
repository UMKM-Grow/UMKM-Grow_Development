# 🍎 UMKM-Grow - Panduan macOS/Linux

Panduan lengkap untuk menjalankan UMKM-Grow di macOS atau Linux.

---

## 📋 Prerequisites

### 1. **Install Homebrew** (Package Manager untuk macOS)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. **Install Node.js (v18 atau lebih baru)**
```bash
# Via Homebrew
brew install node

# Verifikasi instalasi
node --version  # harus v18+
npm --version
```

### 3. **Install MySQL**
```bash
# Via Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (optional tapi recommended)
mysql_secure_installation
```

### 4. **Install Git**
```bash
# Via Homebrew (biasanya sudah ter-install di macOS)
brew install git

# Verifikasi
git --version
```

---

## 🚀 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/UMKM-Grow/UMKM-Grow_Development.git
cd UMKM-Grow_Development
```

### **2. Setup Database**
```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE umkm_grow;
exit;
```

### **3. Setup Backend**
```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env file dengan MySQL credentials
nano .env  # atau gunakan: code .env (VS Code) / vim .env
```

**Isi .env:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=umkm_grow
DB_PORT=3306
JWT_SECRET=your_secret_key_here
PORT=5000
```

### **4. Run Project (Otomatis)**

Ada **2 cara** untuk menjalankan project:

#### **Cara 1: Menggunakan Shell Script (Recommended untuk macOS/Linux)** ✅
```bash
# Kembali ke root folder
cd ..

# Berikan permission execute ke script
chmod +x scripts/start.sh

# Jalankan script
./scripts/start.sh
```

#### **Cara 2: Menggunakan Node Script (Cross-platform)**
```bash
# Dari root folder
npm run dev
```

Script akan otomatis:
- ✅ Check & install dependencies (root, backend, frontend)
- ✅ Jalankan backend (port 5000)
- ✅ Jalankan frontend (port 5173)

---

## 🔧 Manual Start (Alternative)

Jika ingin menjalankan secara manual:

### **Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

### **Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Access Application

Setelah berhasil running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Login Default:**
  - Email: `admin@umkm.com`
  - Password: `password123`

---

## 🐛 Troubleshooting

### **1. Permission Denied saat jalankan .sh**
```bash
# Berikan permission
chmod +x scripts/start.sh

# Atau jalankan dengan bash
bash scripts/start.sh
```

### **2. MySQL Connection Error**
```bash
# Cek MySQL service
brew services list

# Restart MySQL
brew services restart mysql

# Cek apakah MySQL berjalan
mysql -u root -p -e "SELECT 1"
```

### **3. Port 5000 atau 5173 sudah digunakan**
```bash
# Cek process yang menggunakan port
lsof -i :5000
lsof -i :5173

# Kill process
kill -9 <PID>
```

### **4. Node Version Terlalu Lama**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, lalu install Node v18
nvm install 18
nvm use 18

# Verifikasi
node --version
```

### **5. npm install gagal**
```bash
# Clear npm cache
npm cache clean --force

# Hapus node_modules & package-lock.json
rm -rf node_modules package-lock.json

# Install ulang
npm install
```

### **6. Database "too many keys" error**
Lihat file `FIX-ER_TOO_MANY_KEYS.md` di root folder.

### **7. Backend "503 Database belum tersambung"**
Lihat file `TROUBLESHOOTING-503.md` di root folder.

---

## 🧪 Running Tests (Cypress)

### **Install Cypress (jika belum)**
```bash
cd frontend
npm install cypress --save-dev
```

### **Run E2E Tests**

**Headless mode (tanpa UI):**
```bash
cd frontend
npm run cy:run
```

**Interactive mode (dengan UI):**
```bash
cd frontend
npm run cy:open
```

---

## 📁 File Permissions

Pastikan folder `public/uploads` di backend memiliki write permission:

```bash
cd backend
chmod -R 755 public/uploads
```

---

## 🔄 Update Project

```bash
# Pull latest changes
git pull origin main

# Install/update dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Atau gunakan script
./scripts/start.sh
```

---

## 🛠️ Development Tools (Optional)

### **MySQL GUI Client:**
- **Sequel Ace** (free, macOS only): https://sequel-ace.com/
- **TablePlus**: https://tableplus.com/
- **MySQL Workbench**: https://www.mysql.com/products/workbench/

### **Code Editor:**
- **VS Code** (Recommended): https://code.visualstudio.com/
```bash
# Install via Homebrew
brew install --cask visual-studio-code
```

### **Terminal:**
- **iTerm2** (Better terminal): https://iterm2.com/
- **Oh My Zsh** (Terminal themes): https://ohmyz.sh/

---

## 📦 Build for Production

### **Frontend:**
```bash
cd frontend
npm run build
```
Output akan ada di `frontend/dist/`

### **Backend:**
Backend tidak perlu build, bisa langsung deploy dengan:
```bash
NODE_ENV=production npm start
```

---

## 🔐 Environment Variables

Jangan commit file `.env` ke Git! File ini sudah ada di `.gitignore`.

Untuk production, set environment variables di hosting provider:
- Heroku: `heroku config:set KEY=VALUE`
- Vercel: Melalui dashboard
- AWS: Via Parameter Store / Secrets Manager

---

## 📚 Dokumentasi Lengkap

- **Arsitektur System:** `PENJELASAN.md`
- **Fix Database Error:** `FIX-ER_TOO_MANY_KEYS.md`
- **Troubleshooting:** `TROUBLESHOOTING-503.md`
- **Cypress README:** `frontend/cypress/README.md`

---

## 🆘 Need Help?

- **GitHub Issues:** https://github.com/UMKM-Grow/UMKM-Grow_Development/issues
- **Email:** support@umkm-grow.com

---

## 🎉 Tips & Tricks

### **1. Alias untuk Quick Start**
Tambahkan ke `~/.zshrc` atau `~/.bashrc`:
```bash
alias umkm-start="cd /path/to/UMKM-Grow && ./scripts/start.sh"
alias umkm-backend="cd /path/to/UMKM-Grow/backend && npm start"
alias umkm-frontend="cd /path/to/UMKM-Grow/frontend && npm run dev"
```

Reload shell:
```bash
source ~/.zshrc  # atau source ~/.bashrc
```

Sekarang bisa jalankan dengan:
```bash
umkm-start
```

### **2. Auto-start MySQL on Boot**
```bash
brew services start mysql
```

### **3. VS Code Extensions (Recommended)**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Cypress Snippets

---

📝 **Last Updated:** June 2026  
🍎 **macOS Version:** Tested on macOS Monterey & Ventura  
🐧 **Linux:** Compatible with Ubuntu 20.04+ & Debian 11+
