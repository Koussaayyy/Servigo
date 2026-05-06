// routes/client.routes.js
const express = require("express");
const router  = express.Router();
const clientController       = require("../controllers/client.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadAvatar }       = require("../middleware/Upload.middleware");

router.get("/profile",   protect, authorize("client"), clientController.getProfile);
router.put("/profile",   protect, authorize("client"), clientController.updateProfile);
router.put("/password",  protect, authorize("client"), clientController.changePassword);
router.delete("/account", protect, authorize("client"), clientController.deleteAccount);
router.put("/avatar",    protect, authorize("client"), uploadAvatar, clientController.updateAvatar);
router.delete("/avatar", protect, authorize("client"), clientController.deleteAvatar);

router.get("/notifications",                    protect, clientController.getNotifications);
router.put("/notifications/read-all",           protect, clientController.markAllNotificationsAsRead);
router.put("/notifications/:notificationId/read", protect, clientController.markNotificationAsRead);

router.get("/saved-workers",              protect, clientController.getSavedWorkers);
router.post("/saved-workers/:workerId",   protect, clientController.saveWorker);
router.delete("/saved-workers/:workerId", protect, clientController.unsaveWorker);

module.exports = router;