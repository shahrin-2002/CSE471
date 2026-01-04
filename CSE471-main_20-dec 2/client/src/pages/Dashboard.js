/**
 * Dashboard Page - After successful login
 * Updated to include Doctor Availability Button
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toggleLanguage, language, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to check if user is a doctor (handles case sensitivity)
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  return (
    <div className="search-container">
      {/* Header */}
      <div className="search-header">
        <button className="hamburger-menu">☰</button>
        <h1>{t('appName')}</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="search-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">{t('hospitals')}</Link></li>
          <li><Link to="/doctors">{t('doctors')}</Link></li>
          <li className="nav-dropdown">
            <span className="nav-dropdown-toggle">
              {t('booking')} <span className="dropdown-arrow">▼</span>
            </span>
            <ul className="nav-dropdown-menu">
              <li><Link to="/booking/icu">{t('icu')}</Link></li>
              <li><Link to="/booking/general-bed">{t('generalBed')}</Link></li>
              <li><Link to="/booking/cabin">{t('cabin')}</Link></li>
            </ul>
          </li>
          <li><Link to="/appointments">{t('appointments')}</Link></li>
          <li><Link to="/dashboard" className="active">{t('dashboard')}</Link></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/dashboard">
            <button className="btn-outline">{t('dashboard')}</button>
          </Link>
          <button className="btn-dark" onClick={handleLogout}>{t('logout')}</button>
          <button onClick={toggleLanguage} style={{ marginLeft: '10px' }} className="btn-outline">{language === 'en' ? 'বাংলা' : 'English'}</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        <h1 className="welcome-message" style={{ textAlign: 'center' }}> {t('welcomeMessage')}</h1>

      {user && (
        <>
          <div className="dashboard-card">
            <div className="profile-info">
              <h2>{t('yourProfile')}</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <span className="profile-label">{t('name')}:</span>
                  <span className="profile-value">{user.name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">{t('email')}:</span>
                  <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">{t('registerAs')}:</span>
                  <span className="profile-value">{t(user.role)}</span>
                </div>
                {user.gender && (
                  <div className="profile-item">
                    <span className="profile-label">{t('gender')}:</span>
                    <span className="profile-value">{t(user.gender)}</span>
                  </div>
                )}
                {user.date_of_birth && (
                  <div className="profile-item">
                    <span className="profile-label">{t('dateOfBirth')}:</span>
                    <span className="profile-value">{user.date_of_birth}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="profile-item">
                    <span className="profile-label">{t('phone')}:</span>
                    <span className="profile-value">{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="profile-item">
                    <span className="profile-label">{t('address')}:</span>
                    <span className="profile-value">{user.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="dashboard-card">
            <h2>{t('quickLinks')}</h2>
            <div className="quick-links-grid">
              
              {/* Doctor-only buttons */}
              {isDoctor && (
                <>
                  <Link to="/doctor/online-appointments" className="quick-link doctor-link">
                    <div className="quick-link-icon">📹</div>
                    <div className="quick-link-text">
                      <h3>{t('onlineAppointments')}</h3>
                      <p>{t('manageOnlineConsultations')}</p>
                    </div>
                  </Link>
                  <Link to="/doctor/schedule" className="quick-link doctor-link">
                    <div className="quick-link-icon">🕒</div>
                    <div className="quick-link-text">
                      <h3>{t('manageAvailability')}</h3>
                      <p>{t('setYourSchedule')}</p>
                    </div>
                  </Link>
                </>
              )}

              <Link to="/hospitals" className="quick-link">
                <div className="quick-link-icon">🏥</div>
                <div className="quick-link-text">
                  <h3>{t('findHospitals')}</h3>
                  <p>{t('searchMedicalFacilities')}</p>
                </div>
              </Link>
              
              <Link to="/doctors" className="quick-link">
                <div className="quick-link-icon">👨‍⚕️</div>
                <div className="quick-link-text">
                  <h3>{t('findDoctor')}</h3>
                  <p>{t('findHealthcareProviders')}</p>
                </div>
              </Link>
              
              <Link to="/appointments" className="quick-link">
                <div className="quick-link-icon">📅</div>
                <div className="quick-link-text">
                  <h3>{t('myAppointments')}</h3>
                  <p>{t('viewYourBookings')}</p>
                </div>
              </Link>
              
              <Link to="/documents" className="quick-link">
                <div className="quick-link-icon">📄</div>
                <div className="quick-link-text">
                  <h3>{t('myDocuments')}</h3>
                  <p>{t('manageYourFiles')}</p>
                </div>
              </Link>
              
              <Link to="/favorites" className="quick-link">
                <div className="quick-link-icon">❤️</div>
                <div className="quick-link-text">
                  <h3>{t('myFavorites')}</h3>
                  <p>{t('savedDoctorsHospitals')}</p>
                </div>
              </Link>
              
              <Link to="/reviews" className="quick-link">
                <div className="quick-link-icon">⭐</div>
                <div className="quick-link-text">
                  <h3>{t('reviews')}</h3>
                  <p>{t('rateReviewServices')}</p>
                </div>
              </Link>
              
              <Link to="/notifications" className="quick-link">
                <div className="quick-link-icon">🔔</div>
                <div className="quick-link-text">
                  <h3>{t('notifications')}</h3>
                  <p>{t('yourAlertsMessages')}</p>
                </div>
              </Link>
              
              <Link to="/lab-orders" className="quick-link">
                <div className="quick-link-icon">🧪</div>
                <div className="quick-link-text">
                  <h3>{t('myLabOrders')}</h3>
                  <p>{t('labTestsResults')}</p>
                </div>
              </Link>
              
              <div className="quick-link logout-link" onClick={handleLogout}>
                <div className="quick-link-icon">🚪</div>
                <div className="quick-link-text">
                  <h3>{t('logout')}</h3>
                  <p>{t('signOutAccount')}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Dashboard;