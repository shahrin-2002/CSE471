const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Specific routes must come BEFORE parameterized routes
// Only patients can create reviews
router.post('/', verifyToken, checkRole('patient'), reviewController.createReview);

// Patient routes - get reviews they submitted
router.get('/patient/my', verifyToken, checkRole('patient'), reviewController.listPatientReviews);

// Doctor routes - get reviews given to them by patients
router.get('/doctor/my', verifyToken, checkRole('doctor'), reviewController.listDoctorReviews);

// Admin routes
router.get('/admin/pending/list', verifyToken, checkRole('admin'), reviewController.listPending);

// Check review status
router.get('/check/:appointmentId', verifyToken, checkRole('patient'), reviewController.checkReviewStatus);

// List all reviews (public) - must be before /:targetType/:targetId
router.get('/all', reviewController.listAllReviews);

// Admin moderation endpoints
router.patch('/:id/approve', verifyToken, checkRole('admin'), reviewController.approveReview);
router.patch('/:id/reject', verifyToken, checkRole('admin'), reviewController.rejectReview);

// Patient delete own review
router.delete('/:id', verifyToken, checkRole('patient'), reviewController.deleteReview);

// Publicly list approved reviews for a doctor/hospital (must be last)
router.get('/:targetType/:targetId', reviewController.listReviews);

module.exports = router;

