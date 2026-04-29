const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If admin user, set req.user from decoded token (admin is not in DB)
    if (decoded.role === "admin") {
      req.user = {
        _id: decoded._id,
        email: decoded.email,
        role: "admin",
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        isActive: true,
      };
    } else {
      // Regular user, fetch from database
      req.user = await User.findById(decoded.id || decoded._id).select("-password");
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: "Account disabled or not found" });
      }
    }
    
    return next();

  } catch (err) {
    console.error("🔐 AUTH MIDDLEWARE ERROR:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format" });
    }
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

exports.authorize = function() {
  var roles = Array.from(arguments);
  return function(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    return next();
  };
};