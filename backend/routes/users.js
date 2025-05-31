const express = require('express');
const router  = express.Router();
const userController = require('../controllers/userController');

router.get('/:id', userController.getUserById);
router.post('/update-info', userController.updateInfo);
router.post('/update-password', userController.updatePassword);

module.exports = router;