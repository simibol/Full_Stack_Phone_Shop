const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

// User CRUD for debugging (remove in production)
router.get('/', authCtrl.listUsers);
router.delete('/delete/:email', authCtrl.deleteUserByEmail);

// Authentication flows
router.post('/signup', authCtrl.signup);
router.post('/verify-email', authCtrl.verifyEmail);
router.post('/email-verify-fail', authCtrl.failEmailVerification);
router.post('/login', authCtrl.login);
router.post('/req-password', authCtrl.requestPasswordReset);
router.post('/reset-password', authCtrl.resetPassword);

module.exports = router;