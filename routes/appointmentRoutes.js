const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // JWT auth middleware
const appointmentController = require('../controllers/appointmentController');

// Patient endpoints
router.post('/book', auth, appointmentController.book);
router.patch('/:id/reschedule', auth, appointmentController.reschedule);
router.delete('/:id/cancel', auth, appointmentController.cancel);
router.get('/mine', auth, appointmentController.listMine);

// Doctor endpoints
router.get('/doctor/:doctorId', auth, appointmentController.listForDoctor);

module.exports = router;
