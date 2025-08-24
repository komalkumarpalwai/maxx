const express = require('express');
const router = express.Router();
const { getRecentLogs } = require('../controllers/auditLogController');
const { isAdmin } = require('../middlewares/auth');

// GET /audit-logs - get recent audit logs (admin/superadmin only)
router.get('/', isAdmin, getRecentLogs);

module.exports = router;
