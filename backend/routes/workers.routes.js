const express = require("express");
const router = express.Router();
const workerController = require("../controllers/worker.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// Public marketplace endpoint
router.get("/", workerController.getAllWorkers);
router.get("/:workerId", workerController.getWorkerById);

// Portfolio likes & comments — any authenticated user
router.post("/:workerId/portfolio/:itemId/like",                          protect, workerController.togglePortfolioLike);
router.post("/:workerId/portfolio/:itemId/comment",                       protect, workerController.addPortfolioComment);
router.put("/:workerId/portfolio/:itemId/comment/:commentId",             protect, workerController.editPortfolioComment);
router.delete("/:workerId/portfolio/:itemId/comment/:commentId",          protect, workerController.deletePortfolioComment);
router.post("/:workerId/portfolio/:itemId/comment/:commentId/like",       protect, workerController.toggleCommentLike);

module.exports = router;
