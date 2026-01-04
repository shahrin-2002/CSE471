import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { labAPI, userAPI } from '../services/api';
import './LabOrders.css';

const CreateLabOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    testName: '',
    notes: '',
  });
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search patients
  useEffect(() => {
    if (!patientSearchQuery || patientSearchQuery.length < 2) {
      setPatientSearchResults([]);
      setShowPatientSearch(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const response = await userAPI.search({ search: patientSearchQuery, role: 'patient', limit: 10, offset: 0 });
        const results = response.data?.data || [];
        setPatientSearchResults(results);
        setShowPatientSearch(true);
      } catch (err) {
        console.error('Patient search error:', err);
        setPatientSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [patientSearchQuery]);

  // Close patient search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPatientSearch && !event.target.closest('.patient-search-container')) {
        setShowPatientSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPatientSearch]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setForm({ ...form, patientId: patient._id || patient.id });
    setPatientSearchQuery(patient.name);
    setShowPatientSearch(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!form.patientId || !form.testName) {
      setError('Patient Name and Test Name are required');
      return;
    }

    setSubmitting(true);
    try {
      await labAPI.create(form);
      setMsg('Lab order created successfully!');
      setTimeout(() => {
        navigate('/lab-orders');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lab order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'doctor') {
    return (
      <div className="container">
        <p>Access Denied. Only doctors can create lab orders.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="lab-orders-header">
        <h1>Create New Lab Order</h1>
        <button 
          onClick={toggleLanguage} 
          className="language-toggle"
          aria-label={t('toggleLanguage') || 'Toggle Language'}
        >
          {language === 'en' ? 'বাংলা' : 'English'}
        </button>
      </div>

      {msg && (
        <div className={`message ${msg.includes('Failed') || msg.includes('ব্যর্থ') ? 'error' : 'success'}`}>
          {msg}
        </div>
      )}

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      <div className="create-lab-order-card">
        <form onSubmit={handleSubmit} className="lab-order-form">
          <div className="form-row">
            <div className="form-group patient-search-container">
              <label htmlFor="patientSearch">Patient Name *</label>
              <input
                type="text"
                id="patientSearch"
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  if (e.target.value === '') {
                    setSelectedPatient(null);
                    setForm({ ...form, patientId: '' });
                  }
                }}
                placeholder="Search for a patient..."
                required
              />
              {showPatientSearch && patientSearchResults.length > 0 && (
                <div className="doctor-search-results" style={{ position: 'absolute', zIndex: 1000 }}>
                  {patientSearchResults.map((patient) => (
                    <div
                      key={patient._id || patient.id}
                      className="doctor-search-item"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div>
                        <strong>{patient.name}</strong>
                        {patient.email && <div style={{ fontSize: '12px', color: '#666' }}>{patient.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showPatientSearch && patientSearchResults.length === 0 && patientSearchQuery.length >= 2 && (
                <div className="doctor-search-results" style={{ position: 'absolute', zIndex: 1000 }}>
                  <div className="doctor-search-item" style={{ color: '#666', fontStyle: 'italic' }}>
                    No patients found
                  </div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="testName">Test Name *</label>
              <input
                type="text"
                id="testName"
                value={form.testName}
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
                placeholder="e.g., Complete Blood Count (CBC)"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows="3"
            />
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Lab Order'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/lab-orders')}
              className="close-btn"
              style={{ background: '#6c757d' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLabOrder;

