const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");

console.log("protect:", typeof authMiddleware.protect);
console.log("authorize:", typeof authMiddleware.authorize);
console.log("getAllUsers:", typeof adminController.getAllUsers);

router.get("/users",            authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getAllUsers);
router.get("/stats",            authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getStats);
router.get("/reclamations",     authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getReclamations);
router.put("/users/:id/toggle", authMiddleware.protect, authMiddleware.authorize("admin"), adminController.toggleUserStatus);
router.delete("/users/:id",     authMiddleware.protect, authMiddleware.authorize("admin"), adminController.deleteUser);

module.exports = router;
