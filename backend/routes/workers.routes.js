const express = require("express");
const router = express.Router();
const workerController = require("../controllers/worker.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// Public marketplace endpoint
router.get("/", workerController.getAllWorkers);

// Portfolio review — authenticated clients or workers (not self)
router.post("/:workerId/portfolio/:itemId/review", protect, authorize("client"), workerController.submitPortfolioReview);

module.exports = router;
