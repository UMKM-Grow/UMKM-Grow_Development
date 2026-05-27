const { Customer, ensureDbReady } = require('../models');
const { Op } = require('sequelize');
const { broadcastWhatsApp } = require('../services/whatsappService');

/**
 * GET /api/broadcast/targets
 * Returns the list of active customers (members) with a valid phone number.
 * Used by the frontend to preview who will receive the broadcast.
 */
const getBroadcastTargets = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const customers = await Customer.findAll({
      where: {
        is_active: true,
        phone: { [Op.not]: null, [Op.ne]: '' },
      },
      attributes: ['id', 'name', 'phone', 'email', 'level', 'loyalty_points'],
      order: [['name', 'ASC']],
    });

    res.json({ total: customers.length, data: customers });
  } catch (error) {
    console.error('getBroadcastTargets error:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar penerima broadcast.' });
  }
};

/**
 * POST /api/broadcast/promo
 * Body: { message: string, branch_id?: number }
 *
 * Sends a WhatsApp broadcast to all active customers with a phone number.
 * If branch_id is provided, it is used as context only (logged/stored).
 * Returns a summary of sent / failed results.
 */
const sendPromoBroadcast = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const message = String(req.body?.message || '').trim();
    const branchId = req.body?.branch_id ? Number(req.body.branch_id) : null;

    if (!message) {
      return res.status(400).json({ message: 'Isi pesan broadcast tidak boleh kosong.' });
    }
    if (message.length > 4096) {
      return res.status(400).json({ message: 'Pesan terlalu panjang (maks 4096 karakter).' });
    }

    // Fetch all active customers with a phone number
    const customers = await Customer.findAll({
      where: {
        is_active: true,
        phone: { [Op.not]: null, [Op.ne]: '' },
      },
      attributes: ['id', 'name', 'phone'],
    });

    if (customers.length === 0) {
      return res.status(404).json({
        message: 'Tidak ada member/customer aktif dengan nomor HP yang terdaftar.',
      });
    }

    const phones = customers.map((c) => c.phone);

    console.log(
      `[Broadcast] Sending promo to ${phones.length} targets | branch_id=${branchId} | sender=${req.user?.name}`
    );

    // Execute broadcast (with 1.5s delay between each message to avoid rate limiting)
    const summary = await broadcastWhatsApp(phones, message, 1500);

    res.json({
      message: `Broadcast selesai. ${summary.sent} berhasil, ${summary.failed} gagal.`,
      summary: {
        total: summary.total,
        sent: summary.sent,
        failed: summary.failed,
      },
      // Include detailed results for debugging (omit in production if sensitive)
      results: summary.results.map((r) => ({
        phone: r.phone,
        success: r.success,
        mock: r.mock || false,
        error: r.error || null,
      })),
    });
  } catch (error) {
    console.error('sendPromoBroadcast error:', error);
    res.status(500).json({ message: 'Gagal mengirim broadcast.' });
  }
};

module.exports = { sendPromoBroadcast, getBroadcastTargets };
