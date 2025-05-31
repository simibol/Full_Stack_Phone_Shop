const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const authenticate = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Image upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../..', 'dataset_dev', 'phone_default_images'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'image/jpeg' && ext === '.jpeg') cb(null, true);
  else cb(new Error('Only .jpeg images allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });



// Routes
router.post('/create', upload.single('image'), phoneController.createPhone);
router.get('/', phoneController.getPhones);
router.get('/:id', phoneController.getPhoneById);
router.delete('/:id', phoneController.deletePhone);
router.post('/hide/:id', phoneController.hidePhone);
router.post('/unhide/:id', phoneController.unhidePhone);
router.patch('/:id/reviews/:rid/toggle-hidden', phoneController.toggleReviewHidden);
router.post('/:id/post-review', authenticate, phoneController.postReview);
router.patch('/:id/decrease-stock', phoneController.decreaseStock);

module.exports = router;
