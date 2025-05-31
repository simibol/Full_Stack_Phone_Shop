const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  phone:    { type: mongoose.Schema.Types.ObjectId, ref: 'Phone', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true, min: 0 }     // snapshot of unit price
});

const OrderSchema = new mongoose.Schema({
  buyer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:    [OrderItemSchema],
  total:    { type: Number, required: true, min: 0 },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('Order', OrderSchema);