const { Attendance } = require('../models');

const STORE_LATITUDE = -6.200000;
const STORE_LONGITUDE = 106.816666;
const MAX_DISTANCE_METERS = 100;

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeCoordinate = (value) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const attendanceController = {
  createAttendance: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Not authorized' });

      const { latitude, longitude, action } = req.body;
      const lat = normalizeCoordinate(latitude);
      const lng = normalizeCoordinate(longitude);

      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      if (action !== 'CHECK_IN' && action !== 'CHECK_OUT') {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const distanceMeters = haversineDistanceMeters(
        lat,
        lng,
        STORE_LATITUDE,
        STORE_LONGITUDE
      );

      if (distanceMeters > MAX_DISTANCE_METERS) {
        return res.status(400).json({
          message: 'Gagal: Anda berada di luar radius lokasi toko!',
          distance_meters: Math.round(distanceMeters),
          max_distance_meters: MAX_DISTANCE_METERS,
        });
      }

      const attendance = await Attendance.create({
        user_id: userId,
        action,
        latitude: lat,
        longitude: lng,
        timestamp: new Date(),
      });

      res.status(201).json({
        message: 'Attendance recorded',
        data: attendance,
        distance_meters: Math.round(distanceMeters),
        max_distance_meters: MAX_DISTANCE_METERS,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating attendance', error: error.message });
    }
  },

  getMyHistory: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Not authorized' });

      const rows = await Attendance.findAll({
        where: { user_id: userId },
        order: [['timestamp', 'DESC']],
        limit: 100,
      });

      const data = rows.map((row) => {
        const lat = Number(row.latitude);
        const lng = Number(row.longitude);
        const distanceMeters = haversineDistanceMeters(
          lat,
          lng,
          STORE_LATITUDE,
          STORE_LONGITUDE
        );
        return {
          ...row.toJSON(),
          distance_meters: Math.round(distanceMeters),
          within_radius: distanceMeters <= MAX_DISTANCE_METERS,
          max_distance_meters: MAX_DISTANCE_METERS,
        };
      });

      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching attendance history', error: error.message });
    }
  },
};

module.exports = attendanceController;
