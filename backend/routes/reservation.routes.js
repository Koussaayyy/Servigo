const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// Workers can also book other workers — allow both roles on booking routes
router.post("/", protect, authorize("client", "worker"), reservationController.createReservation);
router.get("/worker/:workerId/available-slots", protect, authorize("client", "worker"), reservationController.getWorkerAvailableSlots);
router.get("/worker/:workerId/month-availability", protect, authorize("client", "worker"), reservationController.getWorkerMonthlyAvailability);

router.get("/client", protect, authorize("client", "worker"), reservationController.getClientReservations);
router.get("/client/history", protect, authorize("client", "worker"), reservationController.getClientHistory);
router.patch("/:id/client-cancel", protect, authorize("client", "worker"), reservationController.cancelClientReservation);
router.patch("/:id/client-review", protect, authorize("client", "worker"), reservationController.submitClientReview);

router.get("/worker", protect, authorize("worker"), reservationController.getWorkerReservations);
router.get("/worker/reviews", protect, authorize("worker"), reservationController.getWorkerReviews);
router.patch("/:id/worker-status", protect, authorize("worker"), reservationController.updateWorkerReservationStatus);

module.exports = router;
