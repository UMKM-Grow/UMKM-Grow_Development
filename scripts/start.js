#!/usr/bin/env node
/**
 * UMKM-Grow Smart Start Script
 * - Cek node_modules root, backend, frontend
 * - Auto install jika belum ada atau package.json lebih baru dari node_modules
 * - Jalankan backend + frontend secara bersamaan via concurrently
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// ─── Warna terminal ───────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

const log = (color, prefix, msg) =>
  console.log(`${color}${c.bold}[${prefix}]${c.reset} ${msg}`);

const info = (msg) => log(c.cyan, "INFO", msg);
const ok = (msg) => log(c.green, " OK ", msg);
const warn = (msg) => log(c.yellow, "WARN", msg);
const err = (msg) => log(c.red, "ERR ", msg);

// ─── Helper: cek apakah perlu install ────────────────────────────────────────
function needsInstall(dir) {
  const pkgPath = path.join(dir, "package.json");
  const nmPath = path.join(dir, "node_modules");

  if (!fs.existsSync(pkgPath)) return false; // tidak ada package.json, skip
  if (!fs.existsSync(nmPath)) return true;   // node_modules belum ada

  // Cek apakah package.json lebih baru dari node_modules
  const pkgMtime = fs.statSync(pkgPath).mtimeMs;
  const nmMtime = fs.statSync(nmPath).mtimeMs;
  return pkgMtime > nmMtime;
}

// ─── Helper: jalankan install ─────────────────────────────────────────────────
function runInstall(dir, label) {
  warn(`${label}: node_modules tidak ditemukan atau outdated → menjalankan npm install...`);
  try {
    execSync("npm install", {
      cwd: dir,
      stdio: "inherit",
      shell: true,
    });
    ok(`${label}: install selesai.`);
  } catch (e) {
    err(`${label}: npm install gagal! Periksa koneksi internet atau package.json.`);
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");

console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════╗`);
console.log(`║       UMKM-Grow Smart Starter        ║`);
console.log(`╚══════════════════════════════════════╝${c.reset}\n`);

// 1. Cek & install root dependencies (concurrently, dll)
if (needsInstall(ROOT)) {
  runInstall(ROOT, "root");
} else {
  ok("root: node_modules sudah up-to-date.");
}

// 2. Cek & install backend
if (needsInstall(BACKEND)) {
  runInstall(BACKEND, "backend");
} else {
  ok("backend: node_modules sudah up-to-date.");
}

// 3. Cek & install frontend
if (needsInstall(FRONTEND)) {
  runInstall(FRONTEND, "frontend");
} else {
  ok("frontend: node_modules sudah up-to-date.");
}

// 4. Pastikan concurrently tersedia
const concurrentlyBin = path.join(ROOT, "node_modules", ".bin", "concurrently");
if (!fs.existsSync(concurrentlyBin) && !fs.existsSync(concurrentlyBin + ".cmd")) {
  warn("concurrently tidak ditemukan, install ulang root dependencies...");
  runInstall(ROOT, "root");
}

// 5. Jalankan backend + frontend
console.log(`\n${c.bold}${c.green}▶ Menjalankan backend & frontend...${c.reset}\n`);

const isWin = process.platform === "win32";
const concurrentlyCmd = isWin ? "concurrently.cmd" : "concurrently";
const concurrentlyPath = path.join(ROOT, "node_modules", ".bin", concurrentlyCmd);

const child = spawn(
  concurrentlyPath,
  [
    "--names", "backend,frontend",
    "--prefix-colors", "magenta,cyan",
    "--kill-others-on-fail",
    "npm --prefix backend start",
    "npm --prefix frontend run dev",
  ],
  {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  }
);

child.on("error", (e) => {
  err(`Gagal menjalankan server: ${e.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    err(`Server berhenti dengan kode: ${code}`);
    process.exit(code);
  }
});

// Teruskan sinyal CTRL+C ke child process
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
