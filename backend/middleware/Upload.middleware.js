// middleware/upload.middleware.js
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// ── Create upload folders if they don't exist ──────────────
const avatarDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
const portfolioDir = path.join(__dirname, "../uploads/portfolio");
if (!fs.existsSync(portfolioDir)) fs.mkdirSync(portfolioDir, { recursive: true });
const workerDocsDir = path.join(__dirname, "../uploads/worker-docs");
if (!fs.existsSync(workerDocsDir)) fs.mkdirSync(workerDocsDir, { recursive: true });

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

exports.uploadPortfolioImages = multer({
  storage: portfolioStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10);

const onboardingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "avatar") return cb(null, avatarDir);
    return cb(null, workerDocsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const field = String(file.fieldname || "file").replace(/[^a-zA-Z0-9_-]/g, "");
    const name = `${req.user.id}-${field}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const onboardingFileFilter = (req, file, cb) => {
  if (file.fieldname === "avatar") {
    return fileFilter(req, file, cb);
  }

  const allowedDocs = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowedDocs.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Only JPG, PNG, WEBP or PDF files are allowed"), false);
};

exports.uploadOnboarding = multer({
  storage: onboardingStorage,
  fileFilter: onboardingFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).fields([
  { name: "avatar", maxCount: 1 },
  { name: "cinDocument", maxCount: 1 },
  { name: "certificationDocument", maxCount: 1 },
]);