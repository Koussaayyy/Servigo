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
router.get("/reservations",     authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getAllReservations);
router.get("/notifications",    authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getAdminNotifications);
router.put("/notifications/read-all", authMiddleware.protect, authMiddleware.authorize("admin"), adminController.markAdminNotificationsRead);
router.get("/worker-verifications", authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getWorkerVerifications);
router.patch("/worker-verifications/:id/review", authMiddleware.protect, authMiddleware.authorize("admin"), adminController.reviewWorkerVerification);
router.post("/migrate-legacy-workers", authMiddleware.protect, authMiddleware.authorize("admin"), adminController.migrateOldWorkers);
router.get("/signals",               authMiddleware.protect, authMiddleware.authorize("admin"), adminController.getSignals);
router.patch("/signals/:id/status",  authMiddleware.protect, authMiddleware.authorize("admin"), adminController.updateSignalStatus);

module.exports = router;
