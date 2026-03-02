// routes/client.routes.js
const express = require("express");
const router  = express.Router();
const clientController       = require("../controllers/client.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadAvatar }       = require("../middleware/Upload.middleware");

router.get("/profile",   protect, authorize("client"), clientController.getProfile);
router.put("/profile",   protect, authorize("client"), clientController.updateProfile);
router.put("/password",  protect, authorize("client"), clientController.changePassword);
router.put("/avatar",    protect, authorize("client"), uploadAvatar, clientController.updateAvatar);
router.delete("/avatar", protect, authorize("client"), clientController.deleteAvatar);

module.exports = router;