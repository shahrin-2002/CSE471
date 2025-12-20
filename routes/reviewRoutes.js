const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();


router.post('/', verifyToken, checkRole('patient'), reviewController.createReview);

// Publicly list approved reviews for a doctor/hospital
router.get('/:targetType/:targetId', reviewController.listReviews);


router.get('/check/:appointmentId', verifyToken, checkRole('patient'), reviewController.checkReviewStatus);


router.get('/patient/my', verifyToken, checkRole('patient'), reviewController.listPatientReviews);

// Admin moderation endpoints
router.get('/admin/pending/list', verifyToken, checkRole('admin'), reviewController.listPending);
router.patch('/:id/approve', verifyToken, checkRole('admin'), reviewController.approveReview);
router.patch('/:id/reject', verifyToken, checkRole('admin'), reviewController.rejectReview);

// Patient delete own review
router.delete('/:id', verifyToken, checkRole('patient'), reviewController.deleteReview);

module.exports = router;

