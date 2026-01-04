const Review = require('../models/Review');
// Note: File is lowercase 'appointment.js' but model name is 'Appointment'
const Appointment = require('../models/appointment');
const User = require('../models/User');

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { targetType, targetId, appointmentId, rating, comment } = req.body;
    const patientId = req.user.id;

    console.log('Review submission data:', { targetType, targetId, appointmentId, rating, hasComment: !!comment });

    // Validate required fields
    if (!targetType || !targetId || !rating) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'targetType, targetId, and rating are required',
        details: { targetType: !!targetType, targetId: !!targetId, rating: !!rating }
      });
    }

    // Validate targetId is a valid ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Invalid targetId format. Please select a valid ' + targetType + ' from the search results.'
      });
    }

    // If appointmentId is provided, validate it
    if (appointmentId) {
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

      // Check if review already exists for this appointment
      const existingReview = await Review.findOne({ appointmentId });
      if (existingReview) {
        return res.status(409).json({ error: 'You have already reviewed this appointment' });
      }
    } else {
      // If no appointmentId, check if user already reviewed this target
      const existingReview = await Review.findOne({ 
        patientId, 
        targetType, 
        targetId,
        appointmentId: null 
      });
      if (existingReview) {
        return res.status(409).json({ error: 'You have already reviewed this ' + targetType });
      }
    }

    // Create the review - only include appointmentId if it's provided
    const reviewData = {
      patientId,
      targetType,
      targetId,
      rating,
      comment: comment || '',
    };
    
    // Only add appointmentId if it's provided and not empty
    // IMPORTANT: Don't include appointmentId at all if it's empty to avoid validation issues
    if (appointmentId && typeof appointmentId === 'string' && appointmentId.trim() !== '') {
      reviewData.appointmentId = appointmentId.trim();
    } else if (appointmentId && typeof appointmentId !== 'string' && appointmentId) {
      // If it's not a string but exists (like an ObjectId), include it
      reviewData.appointmentId = appointmentId;
    }
    // If appointmentId is empty/undefined/null, don't include it in reviewData at all

    console.log('Creating review with data:', { 
      patientId: reviewData.patientId ? 'provided' : 'missing',
      targetType: reviewData.targetType,
      targetId: reviewData.targetId ? 'provided' : 'missing',
      rating: reviewData.rating,
      hasComment: !!reviewData.comment,
      appointmentId: reviewData.appointmentId ? 'provided' : 'not included (optional)'
    });

    const review = await Review.create(reviewData);

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (err) {
    console.error('Review creation error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      errors: err.errors
    });
    
    // FIRST: Check if error message mentions appointmentId as required (catch any format)
    const errorMsg = String(err.message || '');
    if (errorMsg.includes('appointmentId') && errorMsg.includes('required')) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'targetType, targetId, and rating are required. appointmentId is optional.'
      });
    }
    
    // Handle unique index violation (E11000 error)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already submitted a review for this' });
    }
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      // Filter out appointmentId from required field errors since it's optional
      const validationErrors = Object.keys(err.errors || {}).filter(key => key !== 'appointmentId').map(key => {
        return `${key}: ${err.errors[key].message}`;
      }).join(', ');
      
      // If the error message mentions appointmentId as required, override it
      let errorMessage = validationErrors || err.message;
      if (errorMessage.includes('appointmentId') && errorMessage.includes('required')) {
        errorMessage = 'targetType, targetId, and rating are required. appointmentId is optional.';
      }
      
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: errorMessage || 'Please provide all required fields: targetType, targetId, and rating'
      });
    }
    
    // Handle CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID Format', 
        message: `Invalid ${err.path} format. Please select a valid ${targetType} from the search results.` 
      });
    }
    
    // If error message lists all fields including appointmentId, replace it
    if (errorMsg.includes('appointmentId') && errorMsg.includes('targetType') && errorMsg.includes('targetId') && errorMsg.includes('rating')) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'targetType, targetId, and rating are required. appointmentId is optional.'
      });
    }
    
    return res.status(400).json({ 
      error: 'Failed to submit review', 
      message: errorMsg || 'An error occurred while submitting the review' 
    });
  }
};

// GET /api/reviews/list/all - List all approved reviews
exports.listAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Manually populate targetId
    const Doctor = require('../models/Doctor');
    const Hospital = require('../models/Hospital');
    const User = require('../models/User');
    
    for (let review of reviews) {
      if (review.targetType === 'doctor') {
        const doctor = await Doctor.findById(review.targetId).select('name specialization').lean();
        if (doctor) review.targetId = doctor;
      } else if (review.targetType === 'hospital') {
        const hospital = await Hospital.findById(review.targetId).select('name city').lean();
        if (hospital) review.targetId = hospital;
      }
    }

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load reviews' });
  }
};

// GET /api/reviews/:targetType/:targetId
exports.listReviews = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    // Prevent matching specific routes like "my", "all", "pending", etc.
    // These should be handled by specific routes, not the parameterized route
    if (targetId === 'my' || targetId === 'all' || targetId === 'pending' || targetId === 'list') {
      return res.status(404).json({ error: 'Endpoint not found. Use specific routes like /reviews/doctor/my or /reviews/patient/my' });
    }
    
    // Also check if targetType is a reserved word that should use specific routes
    if (targetType === 'patient' || targetType === 'doctor' || targetType === 'admin') {
      // Only allow if targetId is a valid ObjectId (not a reserved word)
      if (targetId === 'my' || targetId === 'all' || targetId === 'pending') {
        return res.status(404).json({ error: 'Endpoint not found. Use specific routes like /reviews/doctor/my' });
      }
    }
    
    // Validate targetId is a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
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
    // Get reviews submitted by the current user (patient or doctor)
    const reviewerId = req.user.id;
    
    console.log('Fetching reviews for user:', {
      userId: reviewerId,
      userRole: req.user.role,
      userIdType: typeof reviewerId
    });
    
    // Find all reviews where this user is the reviewer (patientId)
    // Mongoose will automatically convert string IDs to ObjectId for comparison
    const reviews = await Review.find({ patientId: reviewerId })
      .populate('appointmentId', 'date')
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${reviews.length} reviews for user ${reviewerId}`);
    
    // Double-check: Filter out any reviews that don't match (safety check)
    const filteredReviews = reviews.filter(review => {
      const reviewPatientId = review.patientId?._id?.toString() || review.patientId?.toString() || String(review.patientId);
      const currentUserId = String(reviewerId);
      return reviewPatientId === currentUserId;
    });
    
    console.log(`After filtering: ${filteredReviews.length} reviews match user ${reviewerId}`);

    // Manually populate targetId based on targetType
    const Doctor = require('../models/Doctor');
    const Hospital = require('../models/Hospital');
    const User = require('../models/User');
    
    for (let review of filteredReviews) {
      if (review.targetType === 'doctor') {
        const doctor = await Doctor.findById(review.targetId).select('name specialization').lean();
        if (doctor) {
          review.targetId = doctor;
        }
      } else if (review.targetType === 'hospital') {
        const hospital = await Hospital.findById(review.targetId).select('name city address').lean();
        if (hospital) {
          review.targetId = hospital;
        }
      }
    }

    res.json({ count: filteredReviews.length, reviews: filteredReviews });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load your reviews' });
  }
};

// GET /api/reviews/doctor/my - Get reviews given to the current doctor by patients
exports.listDoctorReviews = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    
    console.log('Fetching reviews for doctor:', {
      doctorUserId: doctorUserId,
      doctorRole: req.user.role,
      doctorName: req.user.name
    });
    
    // Find the doctor's record to get their Doctor model ID
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user_id: doctorUserId }).lean();
    
    console.log('Doctor record found:', {
      found: !!doctor,
      doctorId: doctor?._id,
      doctorName: doctor?.name
    });
    
    if (!doctor) {
      console.log('No doctor record found for user:', doctorUserId);
      return res.json({ count: 0, reviews: [], message: 'Doctor profile not found' });
    }
    
    // Find all reviews where this doctor is the target
    const mongoose = require('mongoose');
    const doctorIdObjectId = mongoose.Types.ObjectId.isValid(doctor._id) 
      ? new mongoose.Types.ObjectId(doctor._id) 
      : doctor._id;
    
    console.log('Searching for reviews with:', {
      doctorId: doctor._id,
      doctorIdString: String(doctor._id),
      doctorName: doctor.name
    });
    
    // Try multiple query strategies to find reviews
    console.log('Trying to find reviews with multiple strategies...');
    
    // Strategy 1: Exact ObjectId match
    let allReviews = await Review.find({ 
      targetType: 'doctor',
      targetId: doctorIdObjectId
    })
      .populate('patientId', 'name email')
      .populate('appointmentId', 'date')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Strategy 1 (exact ObjectId): Found ${allReviews.length} reviews`);
    
    // Strategy 2: If no reviews, get all doctor reviews and match by name
    if (allReviews.length === 0) {
      console.log('No reviews with exact ID match, trying name-based search...');
      const allDoctorReviews = await Review.find({ 
        targetType: 'doctor'
      })
        .populate('patientId', 'name email')
        .populate('appointmentId', 'date')
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${allDoctorReviews.length} total doctor reviews in database`);
      
      // Log all doctor reviews to see what we have
      for (let review of allDoctorReviews) {
        const reviewDoctor = await Doctor.findById(review.targetId).select('name _id').lean();
        console.log(`Review ${review._id}: targetId=${String(review.targetId)}, doctorName=${reviewDoctor?.name}, matches=${reviewDoctor?.name === doctor.name}`);
        if (reviewDoctor && reviewDoctor.name === doctor.name) {
          allReviews.push(review);
        }
      }
      console.log(`Strategy 2 (name match): Found ${allReviews.length} reviews matching doctor name "${doctor.name}"`);
    }
    
    // Strategy 3: Also try string comparison
    if (allReviews.length === 0) {
      console.log('Trying string-based comparison...');
      const stringMatchReviews = await Review.find({ 
        targetType: 'doctor',
        targetId: String(doctor._id)
      })
        .populate('patientId', 'name email')
        .populate('appointmentId', 'date')
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Strategy 3 (string match): Found ${stringMatchReviews.length} reviews`);
      allReviews = stringMatchReviews;
    }
    
    console.log(`Total reviews found: ${allReviews.length}`);
    console.log('Review details:', allReviews.map(r => ({
      id: r._id,
      targetId: String(r.targetId),
      targetType: r.targetType,
      isApproved: r.isApproved,
      rating: r.rating,
      patientName: r.patientId?.name || 'Unknown'
    })));
    
    // Show all reviews (both approved and pending) to doctors so they can see everything
    const reviews = allReviews;
    
    console.log(`Returning ${reviews.length} reviews for doctor ${doctor.name}`);
    
    // Populate doctor details for each review
    for (let review of reviews) {
      if (review.targetType === 'doctor') {
        const doctorDetails = await Doctor.findById(review.targetId).select('name specialization').lean();
        if (doctorDetails) {
          review.targetId = doctorDetails;
        } else {
          // If doctor not found, use the doctor we already have
          review.targetId = {
            name: doctor.name,
            specialization: doctor.specialization || 'General'
          };
        }
      }
    }
    
    console.log('Final reviews being sent:', reviews.map(r => ({
      id: r._id,
      targetId: r.targetId,
      rating: r.rating,
      comment: r.comment,
      patientName: r.patientId?.name
    })));
    
    res.json({ count: reviews.length, reviews });
  } catch (err) {
    console.error('Error fetching doctor reviews:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to load doctor reviews' });
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


