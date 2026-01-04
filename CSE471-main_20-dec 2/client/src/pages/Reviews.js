import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../services/api';
import './Reviews.css';

export default function Reviews() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Load reviews based on active tab
  const loadReviews = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my') {
        if (user?.role === 'patient') {
          // Patients see reviews they submitted
          const { data } = await reviewsAPI.myReviews();
          setMyReviews(data.reviews || []);
        } else if (user?.role === 'doctor') {
          // Doctors see reviews given to them by patients
          try {
            const response = await reviewsAPI.myDoctorReviews();
            console.log('Doctor reviews API response:', response);
            console.log('Doctor reviews data:', response.data);
            const reviews = response.data?.reviews || response.data || [];
            console.log('Setting myReviews to:', reviews);
            setMyReviews(reviews);
          } catch (apiErr) {
            console.error('Error fetching doctor reviews:', apiErr);
            setMyReviews([]);
          }
        }
      } else if (activeTab === 'pending' && user?.role === 'admin') {
        const { data } = await reviewsAPI.listPending();
        setPendingReviews(data.reviews || []);
      } else {
        const { data } = await reviewsAPI.list();
        setReviews(data.reviews || []);
      }
      setMsg('');
    } catch (err) {
      setMsg(err.response?.data?.error || t('failedToLoadReviews'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeTab, user]);

  // Approve review (admin only)
  const approveReview = async (reviewId) => {
    try {
      await reviewsAPI.approve(reviewId);
      setMsg('Review approved');
      await loadReviews();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to approve review');
    }
  };

  // Reject review (admin only)
  const rejectReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to reject this review?')) return;
    
    try {
      await reviewsAPI.reject(reviewId);
      setMsg('Review rejected');
      await loadReviews();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to reject review');
    }
  };

  // Delete review (patient only)
  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await reviewsAPI.delete(reviewId);
      setMsg('Review deleted');
      await loadReviews();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete review');
    }
  };

  // Render star rating component
  const StarRating = ({ rating, readOnly = true, size = 'small' }) => {
    return (
      <div className={`star-rating ${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderStars = (rating) => (
    <StarRating rating={rating} readOnly={true} size="small" />
  );

  if (!user) {
    return (
      <div className="container">
        <p>Please log in to view reviews</p>
      </div>
    );
  }

  const renderReviewsList = (reviewsList, emptyMessage) => {
    // For "My Reviews" tab:
    // - Patients: Show reviews they submitted (filtered by patientId)
    // - Doctors: Show reviews given to them (no filtering needed, backend handles it)
    let filteredReviews = reviewsList;
    if (activeTab === 'my' && user?.role === 'patient') {
      // Only filter for patients - doctors see all reviews given to them
      filteredReviews = reviewsList.filter((review) => {
        if (!review.patientId) return false;
        const reviewPatientId = typeof review.patientId === 'object' 
          ? review.patientId._id?.toString() || review.patientId.toString()
          : review.patientId.toString();
        return reviewPatientId === user.id;
      });
    }
    // For doctors, use all reviews as-is (backend already filtered correctly)

    return (
      <div className="reviews-list">
        {loading ? (
          <div className="loading" style={{ gridColumn: '1 / -1' }}>
            <p>Loading...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const targetName = typeof review.targetId === 'object' && review.targetId?.name 
              ? review.targetId.name 
              : 'Unknown';
            
            const targetDetails = typeof review.targetId === 'object' && review.targetId
              ? (review.targetType === 'doctor' 
                  ? (review.targetId.specialization || '')
                  : review.targetType === 'hospital'
                  ? (review.targetId.city || '')
                  : review.targetType === 'patient'
                  ? (review.targetId.email || '')
                  : '')
              : '';

            return (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="review-meta">
                    <span className="review-type">
                      {review.targetType === 'doctor' ? 'Doctor' : 'Hospital'}: <strong>{targetName}</strong>
                      {targetDetails && <span className="review-detail"> - {targetDetails}</span>}
                    </span>
                    {renderStars(review.rating)}
                  </div>
                  <div className="review-actions">
                    {user?.role === 'admin' && !review.isApproved && (
                      <>
                        <button 
                          onClick={() => approveReview(review._id)}
                          className="approve-btn"
                          aria-label="Approve"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => rejectReview(review._id)}
                          className="reject-btn"
                          aria-label="Reject"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {user?.role === 'patient' && review.patientId && (
                      (typeof review.patientId === 'object' 
                        ? review.patientId._id?.toString() === user.id 
                        : review.patientId.toString() === user.id) && (
                      <button 
                        onClick={() => deleteReview(review._id)}
                        className="delete-btn"
                        aria-label="Delete"
                      >
                        🗑️
                      </button>
                      )
                    )}
                  </div>
                </div>
                
                <div className="review-content">
                  <p>{review.comment}</p>
                </div>
                
                <div className="review-footer">
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  {review.appointmentId && (
                    <span className="appointment-ref">
                      Appointment: {typeof review.appointmentId === 'object' 
                        ? review.appointmentId._id 
                        : review.appointmentId}
                    </span>
                  )}
                  {review.isApproved ? (
                    <span className="status approved">Approved</span>
                  ) : (
                    <span className="status pending">Pending</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="reviews-header">
        <h1>Reviews</h1>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Reviews
          </button>
          {(user?.role === 'patient' || user?.role === 'doctor') && (
            <button
              className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              My Reviews
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Reviews
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={`message ${msg.includes('Failed') || msg.includes('error') ? 'error' : 'success'}`}>
          {msg}
        </div>
      )}

      {/* Add Write Review Button - Only for patients */}
      {user?.role === 'patient' && (
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/reviews/write')}
            className="submit-btn"
            style={{ 
              maxWidth: '300px',
              margin: '0 auto',
              display: 'block',
              fontSize: '18px',
              padding: '16px 32px'
            }}
          >
            ✍️ Write a Review
          </button>
        </div>
      )}

      {/* Reviews List */}
      {activeTab === 'all' && renderReviewsList(reviews, 'No reviews found')}
      {activeTab === 'my' && user?.role === 'patient' && renderReviewsList(myReviews, 'You haven\'t written any reviews yet')}
      {activeTab === 'my' && user?.role === 'doctor' && renderReviewsList(myReviews, 'No patients have reviewed you yet')}
      {activeTab === 'pending' && user?.role === 'admin' && renderReviewsList(pendingReviews, 'No pending reviews')}
    </div>
  );
}
