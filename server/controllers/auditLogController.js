const AuditLog = require('../models/AuditLog');

// Create a new audit log entry
exports.logAction = async (action, performedBy, details = {}) => {
  try {
    await AuditLog.create({ action, performedBy, details });
  } catch (err) {
    // Optionally log error
    console.error('Failed to log audit action:', err);
  }
};

// Get recent audit logs (optionally filter by user)
exports.getRecentLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('performedBy', 'name email role');
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};
