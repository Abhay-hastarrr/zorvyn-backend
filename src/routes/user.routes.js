const { adminAuth } = require('../middlewares/auth.middleware')
const { adminUserUpdateLimiter } = require('../middlewares/rateLimit.middleware')
const { getUsers, updateRole, updateStatus } = require('../contorllers/user.controller')

const express = require('express');

const router = express.Router();

router.get('/', adminAuth, getUsers)
router.patch('/:id/role', adminUserUpdateLimiter, adminAuth, updateRole)
router.patch('/:id/status', adminUserUpdateLimiter, adminAuth, updateStatus)

module.exports = router;

