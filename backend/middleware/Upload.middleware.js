// middleware/upload.middleware.js
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// ── Create upload folders if they don't exist ──────────────
const avatarDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
const portfolioDir = path.join(__dirname, "../uploads/portfolio");
if (!fs.existsSync(portfolioDir)) fs.mkdirSync(portfolioDir, { recursive: true });

// ── Disk storage: saves file to uploads/avatars/ ──────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

// ── Only allow image files ─────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WEBP images are allowed"), false);
};

exports.uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
}).single("avatar");

const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, portfolioDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${req.user.id}-portfolio-${Date.now()}${ext}`;
    cb(null, name);
  },
});

exports.uploadPortfolioImage = multer({
  storage: portfolioStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");