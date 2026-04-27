const express = require("express");
const router = express.Router();
const reclamationController = require("../controllers/reclamation.controller");

router.post("/", reclamationController.createReclamation);

module.exports = router;
