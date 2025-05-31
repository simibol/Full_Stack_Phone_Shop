const Phone = require('../models/Phone');
const User = require('../models/User');
const path = require('path');

// Create phone
exports.createPhone = async (req, res) => {
  try {
    const { title, brand, stock, price, seller } = req.body;
    const image = `/images/${req.file.filename}`;

    if (!title || !brand || !price || !stock) {
      return res.status(500).json({ message: 'All fields are required.' });
    }

    const newPhone = new Phone({ title, brand, image, stock, seller, price });
    await newPhone.save();
    res.status(201).json(newPhone);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// Get all phones
exports.getPhones = async (req, res) => {
  try {
    let phones = await Phone.find().lean();

    if (req.query.query) {
      const q = req.query.query.toLowerCase();
      phones = phones.filter(p => p.title.toLowerCase().includes(q));
    }

    if (req.query.brand) {
      phones = phones.filter(p => p.brand === req.query.brand);
    }

    phones = await Promise.all(phones.map(async p => {
      p.reviews = await Promise.all(p.reviews.map(async r => {
        const rev = await User.findById(r.reviewer).lean();
        return {
          ...r,
          reviewerName: rev ? `${rev.firstname} ${rev.lastname}` : 'Unknown reviewer'
        };
      }));
      return { ...p, reviews: p.reviews };
    }));

    res.json(phones);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// Get phone by ID
exports.getPhoneById = async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id).lean();
    if (!phone) return res.sendStatus(404);

    const seller = await User.findById(phone.seller).lean();
    phone.sellerName = seller ? `${seller.firstname} ${seller.lastname}` : 'Unknown seller';

    phone.reviews = await Promise.all(phone.reviews.map(async r => {
      const rev = await User.findById(r.reviewer).lean();
      return {
        ...r,
        reviewerName: rev ? `${rev.firstname} ${rev.lastname}` : 'Unknown reviewer'
      };
    }));

    res.json(phone);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.deletePhone = async (req, res) => {
  try {
    const phone = await Phone.findByIdAndDelete(req.params.id);
    if (!phone) return res.sendStatus(404);
    res.json({ message: 'Phone deleted successfully' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.hidePhone = async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.sendStatus(404);
    phone.disabled = true;
    await phone.save();
    res.json({ message: 'Phone hidden successfully' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.unhidePhone = async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.sendStatus(404);
    phone.disabled = false;
    await phone.save();
    res.json({ message: 'Phone unhidden successfully' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.toggleReviewHidden = async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.sendStatus(404);
    const review = phone.reviews.id(req.params.rid);
    if (!review) return res.sendStatus(404);
    review.hidden = !review.hidden;
    await phone.save();
    res.json({ hidden: review.hidden });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.postReview = async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.sendStatus(404);

    const review = {
      rating: req.body.rating,
      comment: req.body.comment,
      reviewer: req.user.id
    };

    phone.reviews.unshift(review);
    await phone.save();

    const newReview = phone.reviews[0];
    const reviewer = await User.findById(req.user.id).lean();

    res.json({
      ...newReview.toObject(),
      reviewerName: `${reviewer.firstname} ${reviewer.lastname}`
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.decreaseStock = async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.sendStatus(404);

    const quantity = req.body.quantity;
    if (phone.stock < quantity) {
      return res.status(500).json({ message: 'Not enough stock' });
    }

    phone.stock -= quantity;
    await phone.save();
    res.json({ stock: phone.stock });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
