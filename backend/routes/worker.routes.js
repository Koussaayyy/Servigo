// routes/worker.routes.js
const express = require("express");
const router  = express.Router();
const workerController       = require("../controllers/worker.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadAvatar, uploadPortfolioImage } = require("../middleware/Upload.middleware");

// Public
router.get("/all", workerController.getAllWorkers);

// Protected — worker only
router.get("/profile",      protect, authorize("worker"), workerController.getProfile);
router.put("/profile",      protect, authorize("worker"), workerController.updateProfile);
router.put("/password",     protect, authorize("worker"), workerController.changePassword);
router.put("/avatar",       protect, authorize("worker"), uploadAvatar, workerController.updateAvatar);
router.delete("/avatar",    protect, authorize("worker"), workerController.deleteAvatar);
router.post("/portfolio/image", protect, authorize("worker"), uploadPortfolioImage, workerController.uploadPortfolioImage);
router.put("/availability", protect, authorize("worker"), workerController.toggleAvailability);

module.exports = router;