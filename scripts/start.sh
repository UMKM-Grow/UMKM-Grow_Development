#!/bin/bash
#############################################################################
# UMKM-Grow Smart Start Script for macOS/Linux
# - Check node_modules in root, backend, frontend
# - Auto install if missing or package.json is newer than node_modules
# - Run backend + frontend concurrently
#############################################################################

# Colors
RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RED='\033[31m'
MAGENTA='\033[35m'

# Logging functions
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

# Check if needs install
needs_install() {
    local dir=$1
    local pkg_json="$dir/package.json"
    local node_modules="$dir/node_modules"
    
    # No package.json, skip
    if [ ! -f "$pkg_json" ]; then
        return 1
    fi
    
    # node_modules doesn't exist
    if [ ! -d "$node_modules" ]; then
        return 0
    fi
    
    # Check if package.json is newer than node_modules
    if [ "$pkg_json" -nt "$node_modules" ]; then
        return 0
    fi
    
    return 1
}

# Run npm install
run_install() {
    local dir=$1
    local label=$2
    
    warn "$label: node_modules tidak ditemukan atau outdated → menjalankan npm install..."
    
    if ! (cd "$dir" && npm install); then
        error "$label: npm install gagal! Periksa koneksi internet atau package.json."
        exit 1
    fi
    
    ok "$label: install selesai."
}

# Main script
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# Banner
echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════╗"
echo "║       UMKM-Grow Smart Starter        ║"
echo -e "╚══════════════════════════════════════╝${RESET}\n"

# 1. Check & install root dependencies (concurrently, etc)
if needs_install "$ROOT"; then
    run_install "$ROOT" "root"
else
    ok "root: node_modules sudah up-to-date."
fi

# 2. Check & install backend
if needs_install "$BACKEND"; then
    run_install "$BACKEND" "backend"
else
    ok "backend: node_modules sudah up-to-date."
fi

# 3. Check & install frontend
if needs_install "$FRONTEND"; then
    run_install "$FRONTEND" "frontend"
else
    ok "frontend: node_modules sudah up-to-date."
fi

# 4. Ensure concurrently is available
CONCURRENTLY="$ROOT/node_modules/.bin/concurrently"
if [ ! -f "$CONCURRENTLY" ]; then
    warn "concurrently tidak ditemukan, install ulang root dependencies..."
    run_install "$ROOT" "root"
fi

# 5. Run backend + frontend
echo -e "\n${BOLD}${GREEN}▶ Menjalankan backend & frontend...${RESET}\n"

# Use concurrently to run both
"$CONCURRENTLY" \
    -n "backend,frontend" \
    -c "magenta,cyan" \
    "npm --prefix backend start" \
    "npm --prefix frontend run dev"

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    error "Server berhenti dengan kode: $EXIT_CODE"
    exit $EXIT_CODE
fi
