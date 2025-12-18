/**
 * Hospital Search Page Component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { hospitalAPI, reviewAPI, favoriteAPI, appointmentsAPI } from '../services/api';
import '../styles/Search.css';

const HospitalSearch = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [favorited, setFavorited] = useState(false);
  // New: User's appointments for this hospital
  const [userAppointments, setUserAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const isPatient = user?.role?.toLowerCase() === 'patient';

  // Fetch hospitals
  const fetchHospitals = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { limit, offset };
      if (search) params.search = search;

      const response = await hospitalAPI.getAll(params);
      const data = response.data.data || response.data.hospitals || [];
      setHospitals(data);
      setTotal(response.data.total || data.length);

      // Auto-select first hospital if available
      if (data.length > 0 && !selectedHospital) {
        fetchHospitalDetails(data[0]._id || data[0].id);
      }
    } catch (err) {
      setError('Failed to load hospitals');
      console.error('Fetch hospitals error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospital details
  const fetchHospitalDetails = async (id) => {
    try {
      const response = await hospitalAPI.getById(id);
      setSelectedHospital(response.data.data || response.data.hospital || response.data);
    } catch (err) {
      console.error('Fetch hospital details error:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHospitals();
  }, [offset]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchHospitals(searchQuery);
  };

  // Handle hospital selection
  const handleSelectHospital = (hospital) => {
    fetchHospitalDetails(hospital._id || hospital.id);
  };

  // Load user's appointments with this hospital
  const loadUserAppointments = async () => {
    if (!selectedHospital || !isPatient) return;
    setLoadingAppointments(true);
    try {
      const resp = await appointmentsAPI.mine();
      // Filter appointments that are with doctors from this hospital and completed
      const completed = (resp.data.appointments || []).filter(apt =>
        new Date(apt.date) < new Date() &&
        apt.status === 'booked' &&
        apt.doctorId?.hospital_id?._id === (selectedHospital._id || selectedHospital.id)
      );
      setUserAppointments(completed);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setUserAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Load reviews when hospital changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedHospital) return;
      try {
        const id = selectedHospital._id || selectedHospital.id;
        const resp = await reviewAPI.listForTarget('hospital', id);
        setReviews(resp.data.reviews || []);
        setAverageRating(resp.data.averageRating || 0);
      } catch (err) {
        console.error('Load hospital reviews error:', err);
      }
      // Load user's appointments with this hospital
      loadUserAppointments();
    };
    loadData();
  }, [selectedHospital]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    if (!isPatient) {
      alert('Only patients can submit reviews.');
      return;
    }
    if (!selectedAppointmentId) {
      alert('Please select an appointment to review.');
      return;
    }
    try {
      setSubmittingReview(true);
      const id = selectedHospital._id || selectedHospital.id;
      await reviewAPI.create({
        appointmentId: selectedAppointmentId,
        targetType: 'hospital',
        targetId: id,
        rating: Number(newRating),
        comment: newComment,
      });
      setNewRating(5);
      setNewComment('');
      setSelectedAppointmentId('');
      const resp = await reviewAPI.listForTarget('hospital', id);
      setReviews(resp.data.reviews || []);
      setAverageRating(resp.data.averageRating || 0);
      alert('Review submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedHospital) return;
    try {
      const id = selectedHospital._id || selectedHospital.id;
      const resp = await favoriteAPI.toggle({
        targetType: 'hospital',
        targetId: id,
      });
      setFavorited(resp.data.favorited);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update favorite');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="search-container">
      {/* Header with App Title */}
      <div className="search-header" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: 'white', fontSize: '24px' }}>Health Connect</h1>
      </div>
      
      {/* Navigation */}
      <nav className="search-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals" className="active">{t('hospitals')}</Link></li>
          <li><Link to="/doctors">{t('doctors')}</Link></li>
          <li><Link to="/appointments">{t('appointments')}</Link></li>
          <li><Link to="/dashboard">{t('dashboard')}</Link></li>
        </ul>
        <div className="nav-buttons">
          <button
            type="button"
            className="btn-outline"
            onClick={toggleLanguage}
            aria-label="Toggle language"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <button className="btn-outline">{t('dashboard')}</button>
              </Link>
              <button className="btn-dark" onClick={handleLogout}>{t('logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-outline">{t('signIn')}</button>
              </Link>
              <Link to="/register">
                <button className="btn-dark">{t('register')}</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="search-bar-container">
        <form onSubmit={handleSearch} className="search-form">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('findHospitals')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-mic" aria-label="Search">
            🎤
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="search-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">{t('loadingHospitals')}</div>
        ) : (
          <>
            {/* Hospital List (Left Side) */}
            <div className="search-list">
              {hospitals.map((hospital) => (
                <div
                  key={hospital._id || hospital.id}
                  className={`list-item ${(selectedHospital?._id || selectedHospital?.id) === (hospital._id || hospital.id) ? 'active' : ''}`}
                  onClick={() => handleSelectHospital(hospital)}
                >
                  <div className="list-item-image">
                    <span className="placeholder-icon">🏥</span>
                  </div>
                  <div className="list-item-info">
                    <h4>{language === 'bn' && hospital.name_bn ? hospital.name_bn : hospital.name}</h4>
                    <p>{hospital.city}</p>
                    {hospital.specializations && (
                      <span className="specialization-tag">
                        {(() => {
                          const raw = (hospital.specializations.split(',')[0] || '').trim().toLowerCase();
                          if (language === 'bn') {
                            if (raw === 'oncology') return 'অনকোলজি';
                            if (raw === 'general medicine') return 'জেনারেল মেডিসিন';
                            if (raw === 'cardiology') return 'কার্ডিওলজি';
                          }
                          return hospital.specializations.split(',')[0];
                        })()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {hospitals.length === 0 && !loading && (
                <div className="no-results">{t('noHospitals')}</div>
              )}
            </div>

            {/* Hospital Details (Right Side) */}
            {selectedHospital && (
              <div className="search-details">
                  <div className="details-card">
                  <div className="details-image">
                    <button
                      className="favorite-btn"
                      onClick={handleToggleFavorite}
                      aria-label="Favorite hospital"
                    >
                      {favorited ? '♥' : '♡'}
                    </button>
                    <div className="image-placeholder">
                      <span>🏥</span>
                    </div>
                  </div>

                  <div className="details-info">
                    <h2>{selectedHospital.name}</h2>

                    <div className="price-badge">
                      <span className="badge-label">{t('consultationLabel')}</span>
                      <div className="price-value">
                        <span className="currency">{t('taka')}</span>
                        <span className="amount">500</span>
                      </div>
                    </div>

                    <p className="details-instruction">
                      {t('instructionHospital')}
                    </p>

                    <div className="booking-form">
                      <div className="form-row">
                        <div className="form-field">
                          <label>{t('consultantList')}</label>
                          <select className="form-select">
                            <option value="">{t('selectDoctor')}</option>
                            {selectedHospital.doctors?.map((doctor) => (
                              <option key={doctor._id || doctor.id} value={doctor._id || doctor.id}>
                                {doctor.name} - {doctor.specialization}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label>{t('dateLabel')}</label>
                          <input type="date" className="form-select" />
                        </div>
                      </div>

                      <button className="btn-booking">{t('bookAppointment')}</button>
                    </div>

                    <div className="about-section">
                      <div className="about-header">
                        <span>{t('about')}</span>
                        <span className="about-toggle">▲</span>
                      </div>
                      <h4>
                        {(language === 'bn' && selectedHospital.name_bn ? selectedHospital.name_bn : selectedHospital.name)}
                        {' - '}
                        {selectedHospital.city}
                      </h4>
                      <p>
                        {selectedHospital.description ||
                          `${selectedHospital.name} is a leading healthcare facility located in ${selectedHospital.city}.
                          We provide comprehensive medical services with state-of-the-art facilities.`}
                      </p>
                      {selectedHospital.beds_total && (
                        <p><strong>{t('totalBeds')}</strong> {selectedHospital.beds_total}</p>
                      )}
                      {selectedHospital.phone && (
                        <p><strong>{t('phoneLabel')}</strong> {selectedHospital.phone}</p>
                      )}
                      {selectedHospital.email && (
                        <p><strong>{t('emailLabel')}</strong> {selectedHospital.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reviews Section - Enhanced UI with Language Support */}
      {selectedHospital && (
        <div className="reviews-section" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          borderRadius: '15px',
          margin: '20px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {language === 'bn' ? '⭐ রোগীর পর্যালোচনা' : '⭐ Patient Reviews'}
            </h3>
            {averageRating > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>⭐</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {averageRating.toFixed(1)} / 5.0
                </span>
              </div>
            )}
          </div>

          {/* Review Form for Patients */}
          {isPatient && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '25px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
                {language === 'bn' ? 'আপনার অভিজ্ঞতা শেয়ার করুন' : 'Share Your Experience'}
              </h4>
              <form onSubmit={handleSubmitReview}>
                {/* Appointment Selection */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {language === 'bn' ? 'অ্যাপয়েন্টমেন্ট নির্বাচন করুন: *' : 'Select Appointment: *'}
                  </label>
                  {loadingAppointments ? (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      {language === 'bn' ? 'অ্যাপয়েন্টমেন্ট লোড হচ্ছে...' : 'Loading appointments...'}
                    </div>
                  ) : userAppointments.length > 0 ? (
                    <select
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">{language === 'bn' ? 'আপনার অ্যাপয়েন্টমেন্ট নির্বাচন করুন...' : 'Choose your appointment...'}</option>
                      {userAppointments.map((apt) => (
                        <option key={apt._id} value={apt._id}>
                          {new Date(apt.date).toLocaleDateString()} - ডা. {apt.doctorId?.name || (language === 'bn' ? 'অজানা' : 'Unknown')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '8px',
                      color: '#856404',
                      textAlign: 'center'
                    }}>
                      {language === 'bn' ? 'এই হাসপাতালে কোনো সম্পন্ন অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।' : 'No completed appointments found with this hospital.'}
                    </div>
                  )}
                </div>

                {/* Enhanced Cool Star Rating Selection */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '12px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {language === 'bn' ? 'রেটিং: *' : 'Rating: *'}
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef'
                  }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        style={{
                          fontSize: '32px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: star <= newRating ? 'scale(1.3)' : 'scale(1)',
                          color: star <= newRating ? '#ff6b35' : '#e0e0e0',
                          filter: star <= newRating ? 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.4))' : 'none',
                          position: 'relative',
                          padding: '5px',
                          borderRadius: '50%'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.5)';
                          e.target.style.color = '#ff6b35';
                          e.target.style.filter = 'drop-shadow(0 0 12px rgba(255, 107, 53, 0.6))';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = star <= newRating ? 'scale(1.3)' : 'scale(1)';
                          e.target.style.color = star <= newRating ? '#ff6b35' : '#e0e0e0';
                          e.target.style.filter = star <= newRating ? 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.4))' : 'none';
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontWeight: 'bold',
                    color: '#333',
                    fontSize: '16px'
                  }}>
                    {newRating} {language === 'bn' ? 'তারা' : 'Star'}{newRating !== 1 ? (language === 'bn' ? 'া' : 's') : ''}
                  </div>
                </div>

                {/* Comment */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {language === 'bn' ? 'আপনার পর্যালোচনা:' : 'Your Review:'}
                  </label>
                  <textarea
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      resize: 'vertical',
                      minHeight: '80px',
                      fontFamily: 'inherit'
                    }}
                    rows={3}
                    placeholder={language === 'bn' ? 'এই হাসপাতাল সম্পর্কে আপনার অভিজ্ঞতা বলুন...' : 'Tell us about your experience with this hospital...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingReview || !selectedAppointmentId}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (!submittingReview && selectedAppointmentId) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                  }}
                >
                  {submittingReview
                    ? (language === 'bn' ? 'জমা দিচ্ছে...' : 'Submitting...')
                    : (language === 'bn' ? 'পর্যালোচনা জমা দিন' : 'Submit Review')
                  }
                </button>
              </form>
            </div>
          )}

          {/* Message for non-patients */}
          {selectedHospital && !isPatient && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ margin: '0', fontSize: '16px' }}>
                👤 {language === 'bn' ? 'পর্যালোচনা জমা দিতে রোগী হিসেবে লগইন করুন।' : 'Please login as a patient to submit a review.'}
              </p>
            </div>
          )}

          {/* Reviews Grid */}
          <div className="reviews-grid" style={{ display: 'grid', gap: '20px' }}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="review-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    backdropFilter: 'blur(10px)',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="review-stars" style={{
                    fontSize: '20px',
                    color: '#ffd700',
                    marginBottom: '10px'
                  }}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </div>
                  <h4 className="review-title" style={{
                    margin: '0 0 10px 0',
                    color: '#333',
                    fontSize: '16px'
                  }}>
                    {language === 'bn' ? `${selectedHospital.name} হাসপাতালের পর্যালোচনা` : `Review for ${selectedHospital.name}`}
                  </h4>
                  <p className="review-body" style={{
                    margin: '0 0 15px 0',
                    color: '#555',
                    lineHeight: '1.5'
                  }}>
                    {review.comment || (language === 'bn' ? 'কোনো মন্তব্য প্রদান করা হয়নি' : 'No comment provided')}
                  </p>
                  <div className="reviewer-info" style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px'
                  }}>
                    <div className="reviewer-avatar" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      color: 'white',
                      fontSize: '18px'
                    }}>
                      👤
                    </div>
                    <div>
                      <p className="reviewer-name" style={{
                        margin: '0 0 2px 0',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        {review.patientId?.name || (language === 'bn' ? 'বেনামী রোগী' : 'Anonymous Patient')}
                      </p>
                      <p className="reviewer-date" style={{
                        margin: '0',
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        {new Date(review.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
                <p style={{ margin: '0', fontSize: '18px', fontStyle: 'italic' }}>
                  {language === 'bn' ? 'এখনো কোনো পর্যালোচনা নেই। আপনার অভিজ্ঞতা শেয়ার করার প্রথম ব্যক্তি হোন!' : 'No reviews yet. Be the first to share your experience!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <h3>{t('newsletterTitle')}</h3>
        <p>{t('newsletterSubtitle')}</p>
        <div className="newsletter-form">
          <input type="email" placeholder={t('newsletterPlaceholder')} />
          <button className="btn-submit-newsletter">{t('submit')}</button>
        </div>
      </div>
    </div>
  );
};

export default HospitalSearch;
