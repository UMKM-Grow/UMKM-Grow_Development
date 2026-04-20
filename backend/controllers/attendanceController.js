const { Attendance } = require('../models');

const MAX_DISTANCE_METERS = 100;

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
        distance_meters: 0,
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

      const data = rows.map((row) => ({
        ...row.toJSON(),
        distance_meters: 0,
        within_radius: true,
        max_distance_meters: MAX_DISTANCE_METERS,
      }));

      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching attendance history', error: error.message });
    }
  },
};

module.exports = attendanceController;
