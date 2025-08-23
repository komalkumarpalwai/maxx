const express = require('express');
const router = express.Router();
const { logoutAll } = require('../controllers/logoutController');
const { auth } = require('../middlewares/auth');

router.post('/logout-all', auth, logoutAll);

module.exports = router;
