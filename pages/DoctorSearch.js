
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { doctorAPI, appointmentsAPI, reviewAPI, favoriteAPI } from '../services/api';
import '../styles/Search.css';

const DoctorSearch = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  // Slots & booking
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Reviews & favorites
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [favorited, setFavorited] = useState(false);
  // New: User's appointments for this doctor
  const [userAppointments, setUserAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const isPatient = user?.role?.toLowerCase() === 'patient';

  // Helper: localize specialization & status
  const getSpecializationLabel = (spec) => {
    if (!spec) return '';
    const normalized = spec.trim().toLowerCase();
    if (language === 'bn') {
      if (normalized === 'pediatrics') return 'শিশু রোগ';
      if (normalized === 'gynecology') return 'গাইনিকোলজি';
      if (normalized === 'psychiatry') return 'সাইকিয়াট্রি';
      if (normalized === 'internal medicine') return 'ইন্টারনাল মেডিসিন';
      if (normalized === 'urology') return 'ইউরোলজি';
      if (normalized === 'oncology') return 'অনকোলজি';
    }
    return spec;
  };

  const getStatusLabel = (status) => {
    if (!status) return language === 'bn' ? t('available') : t('available');
    const normalized = status.toLowerCase();
    if (language === 'bn') {
      if (normalized === 'available'.toLowerCase()) return t('available');
      if (normalized === 'busy'.toLowerCase()) return t('busy');
      if (normalized === 'on_leave'.toLowerCase()) return t('onLeave');
    }
    return status;
  };

  // Fetch doctors
  const fetchDoctors = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { limit, offset };
      if (search) params.search = search;

      const response = await doctorAPI.getAll(params);
      const data = response.data.data || response.data.doctors || [];
      setDoctors(data);
      setTotal(response.data.total || data.length);

      // Auto-select first doctor if available
      if (data.length > 0 && !selectedDoctor) {
        handleSelectDoctor(data[0]); // Changed to use the handler to reset slots
      }
    } catch (err) {
      setError('Failed to load doctors');
      console.error('Fetch doctors error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctor details
  const fetchDoctorDetails = async (id) => {
    try {
      const response = await doctorAPI.getById(id);
      setSelectedDoctor(response.data.data || response.data.doctor || response.data);
    } catch (err) {
      console.error('Fetch doctor details error:', err);
    }
  };

  const fetchSlots = async (date) => {
    if (!selectedDoctor || !date) return;
    setLoadingSlots(true);
    try {
      const id = selectedDoctor._id || selectedDoctor.id;
      const response = await doctorAPI.getSlots(id, date);
      setAvailableSlots(response.data.slots);
    } catch (err) {
      console.error("Error fetching slots", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };


  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchSlots(date);
  };

  // Initial load
  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchDoctors(searchQuery);
  };

  // Handle doctor selection
  const handleSelectDoctor = (doctor) => {
    // Reset slot state when switching doctors
    setSelectedDate('');
    setAvailableSlots([]);
    fetchDoctorDetails(doctor._id || doctor.id);
  };

  // Load reviews and appointments when doctor changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedDoctor) return;
      try {
        const id = selectedDoctor._id || selectedDoctor.id;
        const resp = await reviewAPI.listForTarget('doctor', id);
        setReviews(resp.data.reviews || []);
        setAverageRating(resp.data.averageRating || 0);
      } catch (err) {
        console.error('Load doctor reviews error:', err);
      }
      // Load user's appointments with this doctor
      loadUserAppointments();
    };
    loadData();
  }, [selectedDoctor]);

  // Load user's appointments with this doctor
  const loadUserAppointments = async () => {
    if (!selectedDoctor || !isPatient) return;
    setLoadingAppointments(true);
    try {
      const resp = await appointmentsAPI.doctor(selectedDoctor._id || selectedDoctor.id);
      // Filter only completed appointments
      const completed = (resp.data.appointments || []).filter(apt =>
        new Date(apt.date) < new Date() && apt.status === 'booked'
      );
      setUserAppointments(completed);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setUserAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
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
      const id = selectedDoctor._id || selectedDoctor.id;
      await reviewAPI.create({
        appointmentId: selectedAppointmentId,
        targetType: 'doctor',
        targetId: id,
        rating: Number(newRating),
        comment: newComment,
      });
      setNewRating(5);
      setNewComment('');
      setSelectedAppointmentId('');
      const resp = await reviewAPI.listForTarget('doctor', id);
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
    if (!selectedDoctor) return;
    try {
      const id = selectedDoctor._id || selectedDoctor.id;
      const resp = await favoriteAPI.toggle({
        targetType: 'doctor',
        targetId: id,
      });
      setFavorited(resp.data.favorited);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update favorite');
    }
  };


  // ✅ Booking handler
  const handleSlotClick = async (slot) => {
    try {
      const doctorId = selectedDoctor._id || selectedDoctor.id;
      await appointmentsAPI.book({ doctorId, date: slot });
      alert('YOUR APPOINTMENT IS BOOKED'); // popup confirmation
      navigate('/appointments');           // redirect to My Appointments page
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
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
          <li><Link to="/hospitals">{t('hospitals')}</Link></li>
          <li><Link to="/doctors" className="active">{t('doctors')}</Link></li>
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
            placeholder={t('findDoctor')}
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
      <div className="search-content" style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 300px)' }}>
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">{t('loadingDoctors')}</div>
        ) : (
          <>
            {/* Left Panel: Doctor List */}
            <div className="search-list">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id || doctor.id}
                  className={`list-item ${(selectedDoctor?._id || selectedDoctor?.id) === (doctor._id || doctor.id) ? 'active' : ''}`}
                  onClick={() => handleSelectDoctor(doctor)}
                >
                  <div className="list-item-image">
                    <span className="placeholder-icon">👨‍⚕️</span>
                  </div>
                  <div className="list-item-info">
                    <h4>{doctor.name}</h4>
                    <p>{getSpecializationLabel(doctor.specialization)}</p>
                    <span className="availability-tag" data-status={doctor.availability_status}>
                      {getStatusLabel(doctor.availability_status) || t('available')}
                    </span>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && !loading && (
                <div className="no-results">{t('noDoctors')}</div>
              )}
            </div>

            {/* Middle Panel: Doctor Image */}
            {selectedDoctor && (
              <div style={{ width: '350px', minWidth: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#A8D5BA', position: 'relative' }}>
                <button
                  className="favorite-btn"
                  onClick={handleToggleFavorite}
                  aria-label="Favorite doctor"
                  style={{ position: 'absolute', top: '15px', left: '15px' }}
                >
                  {favorited ? '♥' : '♡'}
                </button>
                <div className="image-placeholder doctor" style={{ width: '280px', height: '280px' }}>
                  <span>👨‍⚕️</span>
                </div>
              </div>
            )}

            {/* Right Panel: Doctor Details */}
            {selectedDoctor && (
              <div className="search-details" style={{ flex: 1, overflow: 'auto' }}>
                <div className="details-card">
                  <div className="details-info">
                    <h2>Dr. {selectedDoctor.name}</h2>
                    <p className="doctor-specialization">{getSpecializationLabel(selectedDoctor.specialization)}</p>

                    <div className="price-badge">
                      <span className="badge-label">{t('visitingFeeLabel')}</span>
                      <div className="price-value">
                        <span className="currency">{t('taka')}</span>
                        <span className="amount">{selectedDoctor.consultation_fee || 500}</span>
                      </div>
                    </div>

                    <p className="details-instruction">
                      {t('instructionDoctor')}
                    </p>

                 
                    <div className="booking-form">
                      <div className="form-field full-width">
                        <label>{t('selectDate')}</label>
                        <input 
                          type="date" 
                          className="form-select"
                          min={new Date().toISOString().split('T')[0]}
                          value={selectedDate}
                          onChange={handleDateChange}
                        />
                      </div>

                      {/* Slots Display Section */}
                      {selectedDate && (
                        <div className="slots-container" style={{ marginTop: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2B2B2B' }}>
                            {t('availableTimeSlots')}
                          </label>
                          
                          {loadingSlots ? (
                            <div style={{ color: '#666', fontSize: '0.9rem', padding: '10px' }}>
                              {t('checkingSchedule')}
                            </div>
                          ) : availableSlots.length > 0 ? (
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(3, 1fr)', 
                              gap: '10px',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}>
                              {availableSlots.map((slot) => (
                                <button 
                                  key={slot}
                                  className="btn-outline"
                                  style={{ 
                                    padding: '8px', 
                                    fontSize: '0.85rem', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                  }}
                                  onClick={() => handleSlotClick(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '5px' }}>
                              {t('noSlots')}
                            </div>
                          )}
                        </div>
                      )}

                      {!selectedDate && (
                        <button className="btn-booking" disabled style={{ opacity: 0.5, marginTop: '15px' }}>
                          {t('selectDateFirst')}
                        </button>
                      )}
                    </div>

                    <div className="about-section">
                      <div className="about-header">
                        <span>{t('about')}</span>
                        <span className="about-toggle">▲</span>
                      </div>
                      <p>
                        {language === 'bn'
                          ? `ডা. ${selectedDoctor.name} একজন ${getSpecializationLabel(selectedDoctor.specialization)} বিশেষজ্ঞ।` +
                            (selectedDoctor.qualifications ? ` ${selectedDoctor.qualifications}.` : '') +
                            (selectedDoctor.hospital_name ? ` বর্তমানে ${selectedDoctor.hospital_name}-এ কর্মরত।` : '') +
                            (selectedDoctor.experience_years > 0
                              ? ` অভিজ্ঞতা: ${selectedDoctor.experience_years} বছর।`
                              : '')
                          : `Dr. ${selectedDoctor.name} is a ${selectedDoctor.specialization} specialist.` +
                            (selectedDoctor.qualifications ? ` ${selectedDoctor.qualifications}.` : '') +
                            (selectedDoctor.hospital_name
                              ? ` Currently practicing at ${selectedDoctor.hospital_name}.`
                              : '') +
                            (selectedDoctor.experience_years > 0
                              ? ` With ${selectedDoctor.experience_years} years of experience.`
                              : '')}
                      </p>
                      {selectedDoctor.license_number && (
                        <p><strong>{t('licenseLabel')}</strong> {selectedDoctor.license_number}</p>
                      )}
                      {selectedDoctor.hospital_name && (
                        <p><strong>{t('hospitalLabel')}</strong> {selectedDoctor.hospital_name}</p>
                      )}
                      {selectedDoctor.phone && (
                        <p><strong>{t('phoneLabel')}</strong> {selectedDoctor.phone}</p>
                      )}
                      {selectedDoctor.email && (
                        <p><strong>{t('emailLabel')}</strong> {selectedDoctor.email}</p>
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
      {selectedDoctor && (
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
                          {new Date(apt.date).toLocaleDateString()} - {apt.doctorId?.name || (language === 'bn' ? 'ডাক্তার অজানা' : 'Dr. Unknown')}
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
                      {language === 'bn' ? 'এই ডাক্তারের সাথে কোনো সম্পন্ন অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।' : 'No completed appointments found with this doctor.'}
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
                    placeholder={language === 'bn' ? 'এই ডাক্তার সম্পর্কে আপনার অভিজ্ঞতা বলুন...' : 'Tell us about your experience with this doctor...'}
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
          {selectedDoctor && !isPatient && (
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
                    {language === 'bn' ? `${selectedDoctor.name} ডাক্তারের পর্যালোচনা` : `Review for Dr. ${selectedDoctor.name}`}
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

export default DoctorSearch;
