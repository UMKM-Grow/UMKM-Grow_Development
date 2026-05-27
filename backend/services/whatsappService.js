/**
 * WhatsApp Broadcast Service
 *
 * Supports two gateway modes, configured via .env:
 *   WA_GATEWAY=fonnte   → uses Fonnte API (https://fonnte.com) – most common for Indonesian projects
 *   WA_GATEWAY=wablas   → uses Wablas API (https://wablas.com)
 *   WA_GATEWAY=mock     → (default) simulated/logged only, no real message sent
 *
 * Required .env variables:
 *   WA_GATEWAY=fonnte
 *   WA_TOKEN=<your_api_token>
 */

const https = require('https');
const http = require('http');

/**
 * Normalize phone number to international format without leading '+'
 * e.g. "08123456789" → "628123456789"
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p;
}

/**
 * Send a WhatsApp message to a single phone number via Fonnte.
 * Returns { success, phone, message }
 */
async function sendViaFonnte(phone, message) {
  const token = process.env.WA_TOKEN || '';
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { success: false, phone, error: 'Invalid phone number' };

  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      target: normalizedPhone,
      message,
      delay: '2',
      countryCode: '62',
    }).toString();

    const options = {
      hostname: 'api.fonnte.com',
      port: 443,
      path: '/send',
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ success: json.status === true, phone: normalizedPhone, response: json });
        } catch {
          resolve({ success: false, phone: normalizedPhone, response: body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, phone: normalizedPhone, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send a WhatsApp message to a single phone number via Wablas.
 * Returns { success, phone, message }
 */
async function sendViaWablas(phone, message) {
  const token = process.env.WA_TOKEN || '';
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { success: false, phone, error: 'Invalid phone number' };

  return new Promise((resolve) => {
    const postData = JSON.stringify({ phone: normalizedPhone, message });

    const options = {
      hostname: 'solo.wablas.com',
      port: 443,
      path: '/api/send-message',
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ success: json.status === true, phone: normalizedPhone, response: json });
        } catch {
          resolve({ success: false, phone: normalizedPhone, response: body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, phone: normalizedPhone, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Mock sender — logs the message to console, simulates success.
 * Used when WA_GATEWAY=mock or WA_TOKEN is not set.
 */
async function sendViaMock(phone, message) {
  const normalizedPhone = normalizePhone(phone) || phone;
  console.log(`[WA-MOCK] → ${normalizedPhone}: ${message.slice(0, 60)}...`);
  return { success: true, phone: normalizedPhone, mock: true };
}

/**
 * Main export: send one WA message.
 * Automatically picks the correct gateway from WA_GATEWAY env.
 */
async function sendWhatsApp(phone, message) {
  const gateway = (process.env.WA_GATEWAY || 'mock').toLowerCase();
  if (gateway === 'fonnte') return sendViaFonnte(phone, message);
  if (gateway === 'wablas') return sendViaWablas(phone, message);
  return sendViaMock(phone, message);
}

/**
 * Broadcast a message to multiple phone numbers with a small delay between each.
 * Returns summary: { total, sent, failed, results[] }
 */
async function broadcastWhatsApp(phones, message, delayMs = 1500) {
  const results = [];
  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    const result = await sendWhatsApp(phone, message);
    results.push(result);
    if (result.success) sent++;
    else failed++;

    // Small delay to avoid rate limiting
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { total: phones.length, sent, failed, results };
}

module.exports = { sendWhatsApp, broadcastWhatsApp, normalizePhone };
