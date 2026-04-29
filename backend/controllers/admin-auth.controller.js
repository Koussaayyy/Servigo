// Admin Authentication Controller
// Simple hardcoded admin credentials for secure admin access

const jwt = require("jsonwebtoken");

const adminLogin = (req, res) => {
  const { email, password } = req.body;

  // Hardcoded admin credentials (replace with your values)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@servigo.tn";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  // Create proper JWT token for admin
  const adminData = {
    _id: "admin_001",
    email: ADMIN_EMAIL,
    role: "admin",
    firstName: "Admin",
    lastName: "Servigo",
  };

  const token = jwt.sign(adminData, process.env.JWT_SECRET || "servigo_super_secret_key_2026", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  // Return admin token and info
  res.status(200).json({
    success: true,
    admin: adminData,
    token: token,
  });
};

module.exports = { adminLogin };
