// routes/admin.js
const express = require('express');
const router  = express.Router();
const adminCtrl = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
// login / logout
router.post('/login',  adminCtrl.login);
router.post('/logout', adminCtrl.logout);

// a ping endpoint
router.get('/ping', authMiddleware, adminCtrl.ping);

// listings
router.get  ('/listings',           authMiddleware, adminCtrl.getListings);
router.put  ('/listings/:id',       authMiddleware, adminCtrl.updateListing);
router.delete('/listings/:id',      authMiddleware, adminCtrl.deleteListing);

// reviews
router.get  ('/reviews',                         authMiddleware, adminCtrl.getReviews);
router.patch('/reviews/:rid/toggle-hidden',      authMiddleware, adminCtrl.toggleReviewHidden);

// users
router.get  ('/users',                  authMiddleware, adminCtrl.getUsers);
router.put  ('/users/:id',              authMiddleware, adminCtrl.updateUser);
router.delete('/users/:id',             authMiddleware, adminCtrl.deleteUser);
router.get  ('/users/:id/activity',     authMiddleware, adminCtrl.getUserActivity);

// sales
router.get  ('/sales',                  authMiddleware, adminCtrl.getSales);

module.exports = router;