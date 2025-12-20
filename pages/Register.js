/**
 * Registration Page Component
 * Matches the registration.jpeg design
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    date_of_birth: '',
    password: '',
    confirmPassword: '',
    role: 'patient', // Default role
    acceptTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
      };

      const result = await signup(userData);

      if (result.success) {
        // Redirect to login page for OTP verification
        navigate('/login', { state: { message: 'Account created! Please login to verify with OTP.' } });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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
          <li><Link to="/ambulance">{t('ambulance')}</Link></li>
          <li><Link to="/doctors">{t('doctors')}</Link></li>
          <li><Link to="/locations">{t('locations')}</Link></li>
          <li><Link to="/booking">{t('booking')}</Link></li>
          <li><Link to="/contact">{t('contact')}</Link></li>
          <li><Link to="/link">{t('link')}</Link></li>
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
          <Link to="/login">
            <button className="btn-outline">{t('signIn')}</button>
          </Link>
          <Link to="/register">
            <button className="btn-dark">{t('register')}</button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card">
          <h2>{t('registration')}</h2>
          <p className="subtitle">{t('createAccount')}</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('name')}</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">{t('gender')}</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date_of_birth">{t('dateOfBirth')}</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                placeholder="dd/mm/yyyy"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">{t('registerAs')}</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="patient">{t('patient')}</option>
                <option value="doctor">{t('doctor')}</option>
                <option value="admin">{t('admin')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm {t('password')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
              />
              <label htmlFor="acceptTerms">
                {t('acceptTerms')} <Link to="/terms">Read our T&Cs</Link>
              </label>
            </div>

            <button
              type="submit"
              className="btn-submit btn-submit-teal"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : t('createAccount')}
            </button>
          </form>

          <div className="auth-link-bottom">
            {t('haveAccount')}{' '}<Link to="/login">{t('signIn')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
