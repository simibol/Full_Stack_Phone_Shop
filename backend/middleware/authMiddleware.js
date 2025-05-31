const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Sets user info in request
    next();
  } catch (err) {
    console.error('JWT error:', err);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
