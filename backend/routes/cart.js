const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/checkout', cartController.checkout);

module.exports = router;
