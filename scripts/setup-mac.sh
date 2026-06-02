#!/bin/bash
#############################################################################
# UMKM-Grow Setup Script for macOS/Linux
# - Check prerequisites (Node.js, npm, MySQL)
# - Setup database
# - Install all dependencies
# - Create .env file if not exists
#############################################################################

# Colors
RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RED='\033[31m'

info() {
    echo -e "${CYAN}${BOLD}[INFO]${RESET} $1"
}

ok() {
    echo -e "${GREEN}${BOLD}[ OK ]${RESET} $1"
}

warn() {
    echo -e "${YELLOW}${BOLD}[WARN]${RESET} $1"
}

error() {
    echo -e "${RED}${BOLD}[ERR ]${RESET} $1"
}

# Banner
echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════╗"
echo "║    UMKM-Grow Setup for macOS/Linux   ║"
echo -e "╚══════════════════════════════════════╝${RESET}\n"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# 1. Check Node.js
info "Checking Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js tidak ditemukan! Install dengan: brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version terlalu lama (butuh v18+). Current: $(node -v)"
    warn "Update dengan: brew upgrade node atau gunakan nvm"
    exit 1
fi

ok "Node.js: $(node -v)"

# 2. Check npm
info "Checking npm..."
if ! command -v npm &> /dev/null; then
    error "npm tidak ditemukan!"
    exit 1
fi
ok "npm: $(npm -v)"

# 3. Check MySQL
info "Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    warn "MySQL tidak ditemukan!"
    echo "  Install dengan: brew install mysql"
    echo "  Setelah install, jalankan: brew services start mysql"
    read -p "Lanjutkan tanpa MySQL check? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    ok "MySQL: $(mysql --version | cut -d' ' -f6)"
fi

# 4. Install root dependencies
info "Installing root dependencies..."
cd "$ROOT"
npm install
ok "Root dependencies installed"

# 5. Setup Backend
info "Setting up backend..."
cd "$BACKEND"

# Create .env if not exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        warn "File .env dibuat dari .env.example"
        warn "PENTING: Edit file backend/.env dengan MySQL credentials Anda!"
        echo ""
        echo "  cd backend"
        echo "  nano .env  # atau: code .env"
        echo ""
    else
        error ".env.example tidak ditemukan!"
    fi
else
    ok "File .env sudah ada"
fi

# Install backend dependencies
npm install
ok "Backend dependencies installed"

# 6. Setup Frontend
info "Setting up frontend..."
cd "$FRONTEND"
npm install
ok "Frontend dependencies installed"

# 7. Create uploads directory
info "Creating uploads directory..."
mkdir -p "$BACKEND/public/uploads"
chmod 755 "$BACKEND/public/uploads"
ok "Uploads directory ready"

# 8. Make scripts executable
info "Setting script permissions..."
chmod +x "$ROOT/scripts/start.sh"
chmod +x "$ROOT/scripts/setup-mac.sh"
ok "Scripts are now executable"

# Success message
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗"
echo "║                    ✅ Setup Complete!                    ║"
echo -e "╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${BOLD}Next Steps:${RESET}"
echo ""
echo "1. Setup MySQL Database:"
echo "   ${CYAN}mysql -u root -p${RESET}"
echo "   ${CYAN}CREATE DATABASE umkm_grow;${RESET}"
echo ""
echo "2. Edit Backend Configuration:"
echo "   ${CYAN}cd backend${RESET}"
echo "   ${CYAN}nano .env${RESET}  # Update DB credentials"
echo ""
echo "3. Run Application:"
echo "   ${CYAN}./scripts/start.sh${RESET}"
echo ""
echo "4. Access Application:"
echo "   ${GREEN}Frontend: http://localhost:5173${RESET}"
echo "   ${GREEN}Backend:  http://localhost:5000${RESET}"
echo ""
echo "5. Login Default:"
echo "   ${YELLOW}Email: admin@umkm.com${RESET}"
echo "   ${YELLOW}Password: password123${RESET}"
echo ""
echo -e "${CYAN}📚 Baca README-MAC.md untuk dokumentasi lengkap!${RESET}"
echo ""
