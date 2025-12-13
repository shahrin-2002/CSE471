/**
 * Login Page Component
 * Matches the login.jpeg design with 2FA support
 */

import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyOtp } = useAuth();

  // Get success message from registration redirect
  const successMessage = location.state?.message;

  // State to track if we are in the OTP step
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (step === 'credentials' && (!formData.email || !formData.password)) {
      setError('Please fill in all fields');
      return;
    }
    if (step === 'otp' && !formData.otp) {
        setError('Please enter the code');
        return;
    }

    setLoading(true);

    try {
      if (step === 'credentials') {
        // Step 1: Submit Email/Password
        const result = await login(formData.email, formData.password);

        if (result.requiresOtp) {
          setStep('otp'); // Switch UI to OTP mode
        } else if (result.success) {
          // Redirect based on role
          const role = result.user?.role;
          if (role === 'Hospital_Admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          setError(result.error);
        }
      } else {
        // Step 2: Submit OTP
        const result = await verifyOtp(formData.email, formData.otp);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Header */}
      <div className="auth-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="auth-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">Hospitals</Link></li>
          <li><Link to="/ambulance">Ambulance</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li><Link to="/locations">Locations</Link></li>
          <li><Link to="/booking">Booking</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/link">Link</Link></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/register">
            <button className="btn-dark">Register</button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card">
          {/* Sign Up Link (Only show in credentials step) */}
          {step === 'credentials' && (
            <div className="auth-link-top">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
          )}

          <h2>{step === 'credentials' ? 'Log In' : 'Verification'}</h2>

          {/* OTP Instruction Text */}
          {step === 'otp' && (
            <p style={{textAlign: 'center', fontSize: '14px', marginBottom: '20px', color: '#666'}}>
              We sent a code to <strong>{formData.email}</strong>
            </p>
          )}

          {successMessage && <div className="success-message">{successMessage}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {step === 'credentials' ? (
              // STEP 1: EMAIL & PASSWORD
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
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
              </>
            ) : (
              // STEP 2: OTP INPUT
              <div className="form-group">
                <label htmlFor="otp">Enter 6-digit Code</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  maxLength="6"
                  autoFocus
                  style={{ letterSpacing: '5px', textAlign: 'center', fontSize: '18px' }}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-submit btn-submit-dark"
              disabled={loading}
            >
              {loading 
                ? 'Processing...' 
                : (step === 'credentials' ? 'Sign In' : 'Verify Code')
              }
            </button>
          </form>

          {/* Back button for OTP step */}
          {step === 'otp' && (
            <div style={{textAlign: 'center', marginTop: '10px'}}>
               <button 
                 type="button" 
                 onClick={() => setStep('credentials')}
                 style={{background:'none', border:'none', color:'#2B2B2B', textDecoration:'underline', cursor:'pointer'}}
               >
                 Back to Login
               </button>
            </div>
          )}

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
