import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI, doctorAPI, hospitalAPI, userAPI } from '../services/api';
import './Reviews.css';

export default function WriteReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('selectType'); // 'selectType', 'search', 'review'
  const [targetType, setTargetType] = useState(''); // 'doctor', 'hospital', 'patient'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [form, setForm] = useState({
    rating: 5,
    comment: '',
    appointmentId: ''
  });
  const [msg, setMsg] = useState('');

  // Search for doctors, hospitals, or patients
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const performSearch = async () => {
        setSearchLoading(true);
        setShowSearchResults(true);

        try {
          if (targetType === 'doctor') {
            const response = await doctorAPI.getAll({ search: searchQuery, limit: 10, offset: 0 });
            const results = response.data?.data || [];
            setSearchResults(results);
          } else if (targetType === 'hospital') {
            const response = await hospitalAPI.getAll({ search: searchQuery, limit: 10, offset: 0 });
            const results = response.data?.data || [];
            setSearchResults(results);
          }
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
          setMsg('Search failed. Please try again.');
        } finally {
          setSearchLoading(false);
        }
      };

      performSearch();
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, targetType]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Handle type selection
  const handleTypeSelect = (type) => {
    setTargetType(type);
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTarget(null);
    setMsg('');
  };

  // Handle target selection
  const handleSelectTarget = (target) => {
    const targetId = target._id || target.id;
    if (!targetId) {
      setMsg('Error: Selected ' + targetType + ' has no valid ID');
      return;
    }

    setSelectedTarget({ ...target, _id: targetId });
    setSearchQuery(target.name || target.email);
    setShowSearchResults(false);
    setSearchResults([]);
    setStep('review');
    setMsg('');
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'review') {
      setStep('search');
      setSelectedTarget(null);
      setSearchQuery('');
    } else if (step === 'search') {
      setStep('selectType');
      setTargetType('');
      setSearchQuery('');
      setSelectedTarget(null);
    }
  };

  // Submit review
  const submitReview = async () => {
    setMsg('');
    
    if (!selectedTarget || !selectedTarget._id) {
      setMsg('Please select a ' + targetType + ' first');
      return;
    }
    
    if (!form.comment || !form.comment.trim()) {
      setMsg('Please write a review comment');
      return;
    }
    
    if (!form.rating || form.rating < 1 || form.rating > 5) {
      setMsg('Please select a rating (1-5 stars)');
      return;
    }

    try {
      const reviewData = {
        targetType: targetType,
        targetId: selectedTarget._id.toString(),
        rating: Number(form.rating),
        comment: form.comment.trim()
      };
      
      // Only include appointmentId if it's provided and not empty
      // Don't send it at all if it's empty to avoid validation issues
      const appointmentIdValue = form.appointmentId?.trim();
      if (appointmentIdValue && appointmentIdValue.length > 0) {
        reviewData.appointmentId = appointmentIdValue;
      }

      console.log('Submitting review data:', { ...reviewData, appointmentId: reviewData.appointmentId ? 'provided' : 'not included' });

      await reviewsAPI.create(reviewData);
      setMsg('Review submitted successfully!');
      
      // Reset form and navigate to reviews page after 2 seconds
      setTimeout(() => {
        navigate('/reviews');
      }, 2000);
    } catch (err) {
      console.error('Review submission error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to submit review';
      setMsg(errorMessage);
    }
  };

  // Star Rating Component
  const StarRating = ({ rating, onRatingChange, readOnly = false, size = 'medium' }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    return (
      <div className={`star-rating ${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
            onClick={!readOnly ? () => onRatingChange(star) : undefined}
            onMouseEnter={!readOnly ? () => setHoverRating(star) : undefined}
            onMouseLeave={!readOnly ? () => setHoverRating(0) : undefined}
            disabled={readOnly}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="container">
        <p>Please log in to write a review</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="reviews-header">
        <h1>Write a Review</h1>
        <button 
          onClick={() => navigate('/reviews')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ← Back to Reviews
        </button>
      </div>

      {msg && (
        <div className={`message ${msg.includes('Failed') || msg.includes('error') || msg.includes('Error') ? 'error' : 'success'}`}>
          {msg}
        </div>
      )}

      {/* Step 1: Select Review Type */}
      {step === 'selectType' && (
        <div className="review-form-card">
          <h3>Who would you like to review?</h3>
          <p style={{ marginBottom: '30px', color: '#666' }}>Select the type of review you want to submit</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <button
              onClick={() => handleTypeSelect('doctor')}
              className="submit-btn"
              style={{ padding: '30px', fontSize: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
            >
              <span style={{ fontSize: '48px' }}>👨‍⚕️</span>
              <strong>Review a Doctor</strong>
            </button>
            
            <button
              onClick={() => handleTypeSelect('hospital')}
              className="submit-btn"
              style={{ padding: '30px', fontSize: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
            >
              <span style={{ fontSize: '48px' }}>🏥</span>
              <strong>Review a Hospital</strong>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Search and Select */}
      {step === 'search' && (
        <div className="review-form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: '2px solid #667eea',
                color: '#667eea',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ← Back
            </button>
            <h3 style={{ margin: 0 }}>Search for a {targetType}</h3>
          </div>

          <div className="form-group">
            <label htmlFor="searchTarget">Search {targetType === 'doctor' ? 'Doctor' : targetType === 'hospital' ? 'Hospital' : 'Patient'}:</label>
            <div className="search-container">
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '18px',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>🔍</span>
                <input
                  id="searchTarget"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0 || searchQuery.length >= 2) {
                      setShowSearchResults(true);
                    }
                  }}
                  placeholder={`Search for a ${targetType}...`}
                  className="search-input"
                  style={{ paddingLeft: '45px' }}
                />
              </div>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((item) => (
                    <div
                      key={item._id || item.id}
                      className="search-result-item"
                      onClick={() => handleSelectTarget(item)}
                    >
                      <div className="result-name">
                        <strong>{item.name || item.email}</strong>
                      </div>
                      {targetType === 'doctor' && item.specialization && (
                        <div className="result-detail">Specialization: {item.specialization}</div>
                      )}
                      {targetType === 'hospital' && item.city && (
                        <div className="result-detail">Location: {item.city}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchLoading && (
                <div className="search-results">
                  <div className="search-result-item" style={{ textAlign: 'center', color: '#667eea', fontStyle: 'italic' }}>
                    🔄 Searching...
                  </div>
                </div>
              )}
              
              {showSearchResults && !searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="search-results">
                  <div className="search-result-item" style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', cursor: 'default' }}>
                    No {targetType}s found matching "{searchQuery}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Write Review */}
      {step === 'review' && selectedTarget && (
        <div className="review-form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: '2px solid #667eea',
                color: '#667eea',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ← Back
            </button>
            <h3 style={{ margin: 0 }}>Write Your Review</h3>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '2px solid #667eea'
          }}>
            <strong style={{ color: '#667eea', fontSize: '16px' }}>
              Reviewing: {selectedTarget.name || selectedTarget.email}
            </strong>
            {targetType === 'doctor' && selectedTarget.specialization && (
              <div style={{ color: '#666', marginTop: '5px' }}>Specialization: {selectedTarget.specialization}</div>
            )}
            {targetType === 'hospital' && selectedTarget.city && (
              <div style={{ color: '#666', marginTop: '5px' }}>Location: {selectedTarget.city}</div>
            )}
            {targetType === 'patient' && selectedTarget.email && (
              <div style={{ color: '#666', marginTop: '5px' }}>Email: {selectedTarget.email}</div>
            )}
          </div>

          <div className="form-group">
            <label>Rating:</label>
            <StarRating 
              rating={form.rating} 
              onRatingChange={(rating) => setForm({ ...form, rating })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Review:</label>
            <textarea
              id="comment"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Share your experience..."
              rows="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="appointmentId">Appointment ID (Optional):</label>
            <input
              id="appointmentId"
              type="text"
              value={form.appointmentId}
              onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}
              placeholder="Leave empty if reviewing without an appointment"
            />
            <small>Optional: Only required if this review is for a specific appointment</small>
          </div>

          <button onClick={submitReview} className="submit-btn">
            Submit Review
          </button>
        </div>
      )}
    </div>
  );
}

