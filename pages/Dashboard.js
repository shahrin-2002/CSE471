/**
 * Dashboard Page - After successful login
 * Updated to include Doctor Availability Button
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Auth.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to check if user is a doctor (handles case sensitivity)
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  return (
    <div className="auth-container">
      {/* Header with App Title */}
      <div className="auth-header" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Health Connect</h1>
      </div>
      
      {/* Navigation */}
      <nav className="auth-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">{t('hospitals')}</Link></li>
          <li><Link to="/doctors">{t('doctors')}</Link></li>
          <li><Link to="/appointments">{t('appointments')}</Link></li>
          <li><Link to="/profile">{t('myProfile')}</Link></li>
          <li><Link to="/documents">{t('myDocuments')}</Link></li>
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
          <button className="btn-dark" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card">
          <h2>{t('appName')}</h2>

          {user && (
            <div style={{ marginTop: '30px' }}>
              <div className="success-message">
                Successfully logged in as {user.role}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '15px', color: '#2B2B2B' }}>
                  {t('myProfile')}
                </h3>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                {user.gender && <p><strong>Gender:</strong> {user.gender}</p>}
                {user.date_of_birth && (
                  <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
                )}
                {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                {user.address && <p><strong>Address:</strong> {user.address}</p>}
              </div>

              {/* Quick Links */}
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#2B2B2B' }}>Quick Links</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* ✅ NEW BUTTON: Manage Availability (Only for Doctors) */}
                  {isDoctor && (
                    <Link to="/doctor/schedule">
                      <button className="btn-submit" style={{ padding: '10px 20px', backgroundColor: '#2B2B2B', color: 'white' }}>
                        🕒 {t('manageAvailability')}
                      </button>
                    </Link>
                  )}

                  <Link to="/hospitals">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      🏥 {t('findHospitals')}
                    </button>
                  </Link>
                  <Link to="/doctors">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      👨‍⚕️ {t('findDoctor')}
                    </button>
                  </Link>
                  <Link to="/appointments">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      📅 {t('myAppointments')}
                    </button>
                  </Link>
                  <Link to="/documents">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      📄 {t('myDocuments')}
                    </button>
                  </Link>
                  <Link to="/labs">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      🧪 Lab Orders
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;