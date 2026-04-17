const express = require("express");
const router = express.Router();
const workerController = require("../controllers/worker.controller");

// Public marketplace endpoint
router.get("/", workerController.getAllWorkers);

module.exports = router;
