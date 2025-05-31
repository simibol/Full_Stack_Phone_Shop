const AdminLog = require('../models/AdminLog');

module.exports = async function logAdminAction(req, action, target, meta = {}) {
  let adminId
  if (req.session.isAdmin) {
    adminId = 'admin@example.com'
  } else if (req.session.userId) {
    adminId = req.session.userId
  } else {
    adminId = 'unknown'
  }
  // create a new log entry
  await AdminLog.create({
    action, 
    target,
    admin: adminId,
    meta
  })
}