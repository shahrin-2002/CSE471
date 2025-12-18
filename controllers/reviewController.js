const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { targetType, targetId, appointmentId, rating, comment } = req.body;
    const patientId = req.user.id;


    if (!targetType || !targetId || !rating || !appointmentId) {
      return res.status(400).json({ error: 'appointmentId, targetType, targetId, and rating are required' });
    }


    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appt.patientId.toString() !== patientId) {
      return res.status(403).json({ error: 'This appointment does not belong to you' });
    }

  
    const now = new Date();
    if (appt.date > now) {
      return res.status(400).json({ error: 'You can only review completed appointments' });
    }


    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this appointment' });
    }

    // Create the review
    const review = await Review.create({
      patientId,
      targetType,
      targetId,
      appointmentId,
      rating,
      comment: comment || '',
    });

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (err) {
    // Handle unique index violation (E11000 error)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this appointment' });
    }
    return res.status(400).json({ error: err.message || 'Failed to submit review' });
  }
};

// GET /api/reviews/:targetType/:targetId
exports.listReviews = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const reviews = await Review.find({
      targetType,
      targetId,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    res.json({
      count: reviews.length,
      averageRating: avg,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load reviews' });
  }
};

// GET /api/reviews/admin/pending  (admin moderation)
exports.listPending = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load pending reviews' });
  }
};

// PATCH /api/reviews/:id/approve
exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review approved', review });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to approve review' });
  }
};

// PATCH /api/reviews/:id/reject
exports.rejectReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review rejected and deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to reject review' });
  }
};


exports.checkReviewStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    // Verify appointment belongs to patient
    const appt = await Appointment.findById(appointmentId);
    if (!appt || appt.patientId.toString() !== patientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const review = await Review.findOne({ appointmentId }).lean();
    res.json({ 
      reviewed: !!review, 
      appointmentCompleted: appt.date <= new Date(),
      review: review || null 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to check review status' });
  }
};

exports.listPatientReviews = async (req, res) => {
  try {
    const patientId = req.user.id;
    const reviews = await Review.find({ patientId })
      .populate('appointmentId', 'date')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load your reviews' });
  }
};

// DELETE /api/reviews/:id (patient delete own review)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    // Find the review and verify it belongs to the patient
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.patientId.toString() !== patientId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to delete review' });
  }
};


