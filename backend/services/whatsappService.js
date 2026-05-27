/**
 * WhatsApp Broadcast Service — powered by whatsapp-web.js (open-source, free)
 *
 * HOW IT WORKS:
 *   1. On first run, call initWhatsApp() — the backend generates a QR code.
 *   2. Open the frontend /broadcast page → it shows the QR image.
 *   3. Scan the QR with your phone (WhatsApp → Linked Devices → Link a Device).
 *   4. Session is saved to ./.wwebjs_auth/ — you only need to scan ONCE.
 *   5. After that the client stays connected and messages are sent for free.
 *
 * STATUS values: 'disconnected' | 'qr' | 'connecting' | 'ready' | 'error'
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

// ─── State ────────────────────────────────────────────────────────────────────
let client = null;
let status = 'disconnected'; // 'disconnected' | 'qr' | 'connecting' | 'ready' | 'error'
let qrDataUrl = null;         // base64 PNG data URL of the current QR code
let initCalled = false;

/**
 * Normalize Indonesian phone number to international WA format.
 * "08123456789" → "6281234567890@c.us"
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p + '@c.us';
}

/**
 * Hapus file lock Chromium yang tersisa agar tidak error "browser already running".
 * Dipanggil otomatis sebelum inisialisasi client.
 */
function cleanupLockFile() {
  try {
    const sessionDir = path.join(__dirname, '..', '.wwebjs_auth', 'session');
    const lockFile = path.join(sessionDir, 'SingletonLock');
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      console.log('[WA] File lock lama dihapus, siap memulai ulang.');
    }
  } catch (e) {
    // abaikan jika file tidak ada atau tidak bisa dihapus
  }
}

/**
 * Initialize (atau reuse) WhatsApp client.
 * Aman dipanggil berkali-kali — hanya membuat client satu kali.
 */
function initWhatsApp() {
  if (initCalled) return;
  initCalled = true;
  status = 'connecting';

  // Bersihkan lock file Chromium sebelum mulai
  cleanupLockFile();

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '..', '.wwebjs_auth'),
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qr) => {
    status = 'qr';
    try {
      qrDataUrl = await qrcode.toDataURL(qr);
      console.log('[WA] QR code generated — open /broadcast page to scan.');
    } catch (err) {
      console.error('[WA] Failed to generate QR data URL:', err.message);
    }
  });

  client.on('authenticated', () => {
    status = 'connecting';
    qrDataUrl = null;
    console.log('[WA] Authenticated successfully.');
  });

  client.on('ready', () => {
    status = 'ready';
    qrDataUrl = null;
    console.log('[WA] Client is ready! Broadcasts can now be sent.');
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    qrDataUrl = null;
    initCalled = false;
    client = null;
    console.warn('[WA] Disconnected:', reason);
  });

  client.on('auth_failure', (msg) => {
    status = 'error';
    initCalled = false;
    client = null;
    console.error('[WA] Auth failure:', msg);
  });

  client.initialize().catch((err) => {
    status = 'error';
    initCalled = false;
    client = null;
    console.error('[WA] initialize() error:', err.message);
    // Jika error karena browser lock, coba ulang setelah 3 detik
    if (err.message && err.message.includes('already running')) {
      console.log('[WA] Mencoba ulang inisialisasi dalam 3 detik...');
      setTimeout(() => { initWhatsApp(); }, 3000);
    }
  });
}

/** Returns current WA status and QR data URL (if in qr state). */
function getStatus() {
  return { status, qrDataUrl };
}

/**
 * Send a single WhatsApp message.
 * Returns { success, phone, error? }
 */
async function sendWhatsApp(phone, message) {
  const chatId = normalizePhone(phone);
  if (!chatId) return { success: false, phone, error: 'Nomor HP tidak valid.' };

  if (status !== 'ready' || !client) {
    return { success: false, phone: chatId, error: `WA client belum siap (status: ${status})` };
  }

  try {
    await client.sendMessage(chatId, message);
    return { success: true, phone: chatId };
  } catch (err) {
    console.error(`[WA] Failed to send to ${chatId}:`, err.message);
    return { success: false, phone: chatId, error: err.message };
  }
}

/**
 * Broadcast a message to multiple phone numbers with a delay between each.
 * Returns { total, sent, failed, results[] }
 */
async function broadcastWhatsApp(phones, message, delayMs = 2000) {
  const results = [];
  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    const result = await sendWhatsApp(phone, message);
    results.push(result);
    if (result.success) sent++;
    else failed++;

    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { total: phones.length, sent, failed, results };
}

module.exports = { initWhatsApp, getStatus, sendWhatsApp, broadcastWhatsApp, normalizePhone };
