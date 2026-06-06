// routes/worker.routes.js
const express = require("express");
const router  = express.Router();
const workerController       = require("../controllers/worker.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadAvatar, uploadPortfolioImage, uploadPortfolioImages } = require("../middleware/Upload.middleware");

// Public
router.get("/all", workerController.getAllWorkers);

// Protected — worker only
router.get("/profile",      protect, authorize("worker"), workerController.getProfile);
router.put("/profile",      protect, authorize("worker"), workerController.updateProfile);
router.put("/password",              protect, authorize("worker"), workerController.changePassword);
router.post("/send-delete-code",     protect, authorize("worker"), workerController.sendDeleteCode);
router.delete("/account",            protect, authorize("worker"), workerController.deleteAccount);
router.post("/send-email-change-code", protect, authorize("worker"), workerController.sendEmailChangeCode);
router.put("/email",                 protect, authorize("worker"), workerController.changeEmail);
router.put("/avatar",       protect, authorize("worker"), uploadAvatar, workerController.updateAvatar);
router.delete("/avatar",    protect, authorize("worker"), workerController.deleteAvatar);
router.post("/portfolio/image",                            protect, authorize("worker"), uploadPortfolioImage, workerController.uploadPortfolioImage);
router.post("/portfolio",                                  protect, authorize("worker"), uploadPortfolioImages, workerController.createPortfolioItem);
router.put("/portfolio/:itemId",                           protect, authorize("worker"), uploadPortfolioImages, workerController.updatePortfolioItem);
router.delete("/portfolio/:itemId/review/:reviewId",       protect, authorize("worker"), workerController.deletePortfolioReview);
router.delete("/portfolio/:itemId",                        protect, authorize("worker"), workerController.deletePortfolioItem);
router.put("/schedule",                                    protect, authorize("worker"), workerController.updateSchedule);
router.put("/availability",                                protect, authorize("worker"), workerController.toggleAvailability);
router.post("/services",                                   protect, authorize("worker"), workerController.addService);
router.put("/services/:serviceId",                         protect, authorize("worker"), workerController.updateService);
router.delete("/services/:serviceId",                      protect, authorize("worker"), workerController.deleteService);

// Notifications
router.get("/notifications", protect, authorize("worker"), workerController.getNotifications);
router.put("/notifications/:notificationId/read", protect, authorize("worker"), workerController.markNotificationAsRead);
router.put("/notifications/read-all", protect, authorize("worker"), workerController.markAllNotificationsAsRead);

module.exports = router;