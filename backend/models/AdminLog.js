const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  action:    { type: String, required: true },
  target:    { type: String, required: true },
  meta:      { type: mongoose.Schema.Types.Mixed },
  admin:     { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);