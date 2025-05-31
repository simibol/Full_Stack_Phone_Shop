const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const User    = require('../models/User');
const Phone  = require('../models/Phone');
const Order  = require('../models/Order');
const logAdminAction = require('../middleware/audit');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_HASH  = process.env.ADMIN_HASH_PW;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Is this the hard-coded admin?
    if (email === ADMIN_EMAIL) {
      const match = await bcrypt.compare(password, ADMIN_HASH);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Issue a short-lived admin token
      const token = jwt.sign(
        { isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      return res.json({ success: true, isAdmin: true, token });
    }

    // 2) Otherwise it's a regular user
    const user = await User.findOne({ email });
    if (!user || user.disabled) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Issue a user token (longer lived, e.g. 1d)
    const token = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        _id:       user._id,
        firstname: user.firstname,
        lastname:  user.lastname,
        email:     user.email,
      }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.sendStatus(500);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.sendStatus(500);
    res.clearCookie('admin.sid');
    res.json({ success: true });
  });
};
exports.ping = (req, res) => {
  res.json({ ok: true });
};

// ─── LISTING MANAGEMENT ─────────────────────────────────────

exports.getListings = async (req, res) => {
  try {
    const q = {};
    if (req.query.query) q.title = new RegExp(req.query.query, 'i');
    if (req.query.brand) q.brand = req.query.brand;

    const phones = await Phone.find(q).lean().sort({ title: 1 });
    const withMeta = await Promise.all(phones.map(async p => {
      const seller = await User.findById(p.seller).lean();
      return {
        ...p,
        sellerName: seller ? `${seller.firstname} ${seller.lastname}` : 'Unknown',
        reviewCount: p.reviews.length
      };
    }));
    res.json(withMeta);
  } catch (err) {
    console.error('GET /admin/listings error', err);
    res.sendStatus(500);
  }
};

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await Phone.findById(id).lean();
    if (!before) return res.sendStatus(404);

    const updates = {};
    ['title','price','stock','disabled','brand'].forEach(f =>
      req.body[f] !== undefined && (updates[f] = req.body[f])
    );

    const after = await Phone.findByIdAndUpdate(id, updates, { new: true, lean: true });
    if (!after) return res.sendStatus(404);

    await logAdminAction(req, 'UPDATE_LISTING', `Listing:${id}`, { before, after });
    res.json({ success: true, phone: after });
  } catch (err) {
    console.error('PUT /admin/listings/:id error', err);
    res.sendStatus(500);
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await Phone.findById(id).lean();
    if (!before) return res.sendStatus(404);

    const start = process.hrtime();
    await Phone.findByIdAndDelete(id);
    const [sec,nano] = process.hrtime(start);
    const durationMs = sec * 1e3 + nano / 1e6;

    await logAdminAction(req,
      'DELETE_LISTING',
      `Listing:${id}`,
      { before, durationMs }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/listings/:id error', err);
    res.sendStatus(500);
  }
};

// ─── REVIEW MODERATION ──────────────────────────────────────

exports.getReviews = async (req, res) => {
  try {
    let all = [];
    const phones = await Phone.find().lean();
    phones.forEach(p => p.reviews.forEach(r => {
      all.push({
        _id:          r._id,
        listingId:    p._id,
        listingTitle: p.title,
        reviewer:     r.reviewer,
        rating:       r.rating,
        comment:      r.comment,
        hidden:       r.hidden
      });
    }));

    // filter/listing
    if (req.query.listing) {
      all = all.filter(r => String(r.listingId) === req.query.listing);
    }

    // attach reviewerName
    all = await Promise.all(all.map(async r => {
      const u = await User.findById(r.reviewer).lean();
      return {...r, reviewerName: u ? `${u.firstname} ${u.lastname}` : 'Unknown'};
    }));

    // filter by user substring
    if (req.query.user) {
      const re = req.query.user.toLowerCase();
      all = all.filter(r => r.reviewerName.toLowerCase().includes(re));
    }

    // filter by content
    if (req.query.content) {
      const re = req.query.content.toLowerCase();
      all = all.filter(r => r.comment.toLowerCase().includes(re));
    }

    res.json(all);
  } catch (err) {
    console.error('GET /admin/reviews error', err);
    res.sendStatus(500);
  }
};

exports.toggleReviewHidden = async (req, res) => {
  try {
    const { rid } = req.params;
    const phone = await Phone.findOne({ 'reviews._id': rid });
    if (!phone) return res.sendStatus(404);

    const before = phone.reviews.id(rid).toObject();
    const rev    = phone.reviews.id(rid);
    rev.hidden   = !rev.hidden;
    await phone.save();

    const afterPhone = await Phone.findOne({ 'reviews._id': rid }).lean();
    const after      = afterPhone.reviews.find(r => String(r._id) === rid);

    await logAdminAction(req, 'TOGGLE_REVIEW_HIDDEN',
      `Review:${rid}`, { before, after }
    );
    res.json({ success: true, hidden: rev.hidden });
  } catch (err) {
    console.error('PATCH /admin/reviews/:rid/toggle-hidden error', err);
    res.sendStatus(500);
  }
};

// ─── USER MANAGEMENT ────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const q = (req.query.query||'').toLowerCase();
    let users = await User.find().lean();
    if (q) {
      users = users.filter(u =>
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    res.json(
      users.map(u => ({
        _id: u._id,
        name: `${u.firstname} ${u.lastname}`,
        email: u.email,
        lastLogin: u.lastLogin,
        disabled: u.disabled||false
      }))
    );
  } catch (err) {
    console.error('GET /admin/users error', err);
    res.sendStatus(500);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await User.findById(id).lean();
    if (!before) return res.sendStatus(404);

    const { firstname, lastname, email, disabled } = req.body;
    await User.findByIdAndUpdate(id, { firstname, lastname, email, disabled });
    const after = await User.findById(id).lean();

    await logAdminAction(req, 'UPDATE_USER', `User:${id}`, { before, after });
    res.json({ success: true, user: after });
  } catch (err) {
    console.error('PUT /admin/users/:id error', err);
    res.sendStatus(500);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await User.findById(id).lean();
    if (!before) return res.sendStatus(404);

    await User.findByIdAndDelete(id);
    await logAdminAction(req, 'DELETE_USER', `User:${id}`, { before });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/users/:id error', err);
    res.sendStatus(500);
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const userId = req.params.id;
    const listings   = await Phone.find({ seller: userId }).lean();
    const reviewsRaw = listings.flatMap(p => p.reviews);
    const userReviews = reviewsRaw.filter(r => String(r.reviewer) === userId);
    res.json({ listings, reviews: userReviews });
  } catch (err) {
    console.error('GET /admin/users/:id/activity error', err);
    res.sendStatus(500);
  }
};

// ─── SALES & ACTIVITY LOG ───────────────────────────────────

exports.getSales = async (req, res) => {
  try {
    const q = {};
    if (req.query.buyer) {
      const re = new RegExp(req.query.buyer,'i');
      const users = await User.find({
        $or: [{ firstname: re }, { lastname: re }, { email: re }]
      }).select('_id').lean();
      q.buyer = { $in: users.map(u => u._id) };
    }

    const orders = await Order.find(q)
      .sort({ createdAt: -1 })
      .populate('buyer','firstname lastname')
      .populate('items.phone','title')
      .lean();

    const out = orders.map(o => ({
      _id: o._id,
      createdAt: o.createdAt,
      buyerName: `${o.buyer.firstname} ${o.buyer.lastname}`,
      items: o.items.map(i=>({
        title: i.phone.title, quantity: i.quantity, price: i.price
      })),
      total: o.total
    }));

    res.json(out);
  } catch (err) {
    console.error('GET /admin/sales error', err);
    res.sendStatus(500);
  }
};