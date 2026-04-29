const express = require("express");
const router = express.Router();
const reclamationController = require("../controllers/reclamation.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Public endpoint - create reclamation
router.post("/", reclamationController.createReclamation);

// Admin protected endpoints
router.patch(
  "/:id",
  authMiddleware.protect,
  authMiddleware.authorize("admin"),
  reclamationController.updateReclamationStatus
);

router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.authorize("admin"),
  reclamationController.deleteReclamation
);

module.exports = router;
