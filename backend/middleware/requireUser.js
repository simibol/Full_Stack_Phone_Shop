export default async function requireUser(req, res, next) {
    if (!req.session.userId) {
      return res.sendStatus(401);
    }
  
    const user = await User.findById(req.session.userId);
    if (!user || user.disabled) {
      // either no such user, or they’ve been disabled since last login
      return res.sendStatus(403);
    }
  
    // attach to req for downstream handlers
    req.user = user;
    next();
  };