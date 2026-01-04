import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { labAPI, doctorAPI, userAPI } from '../services/api';
import './LabOrders.css';

const LabOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Patient submission form
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientForm, setPatientForm] = useState({
    testName: '',
    status: 'ordered',
    doctorId: '',
    notes: '',
    report: null,
  });
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorSearchResults, setDoctorSearchResults] = useState([]);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Doctor search and filter
  const [doctorSearchFilter, setDoctorSearchFilter] = useState('');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('');

  // Doctor form (for creating orders)
  const [form, setForm] = useState({
    patientId: '',
    testName: '',
    notes: '',
  });
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Patient upload
  const [uploading, setUploading] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const isLab = user?.role === 'lab';
  const isPatient = user?.role === 'patient';

  // Load orders with filters for doctors
  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      let resp;
      if (isDoctor) {
        const params = {};
        if (doctorSearchFilter) params.search = doctorSearchFilter;
        if (doctorStatusFilter) params.status = doctorStatusFilter;
        resp = await labAPI.mineDoctor(params);
      } else if (isLab) {
        resp = await labAPI.listLab();
      } else {
        resp = await labAPI.mine();
      }
      setOrders(resp.data.orders || []);
      setMsg('');
    } catch (err) {
      setError(err.response?.data?.error || t('failedToLoadLabOrders') || 'Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, doctorSearchFilter, doctorStatusFilter]);

  // Search doctors for patient form
  useEffect(() => {
    if (!showSubmitForm || !doctorSearchQuery || doctorSearchQuery.length < 2) {
      setDoctorSearchResults([]);
      setShowDoctorSearch(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const response = await doctorAPI.getAll({ search: doctorSearchQuery, limit: 10, offset: 0 });
        const results = response.data?.data || [];
        setDoctorSearchResults(results);
        setShowDoctorSearch(true);
      } catch (err) {
        console.error('Doctor search error:', err);
        setDoctorSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [doctorSearchQuery, showSubmitForm]);

  // Search patients for doctor form
  useEffect(() => {
    if (!isDoctor || !patientSearchQuery || patientSearchQuery.length < 2) {
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
  }, [patientSearchQuery, isDoctor]);

  // Close doctor search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDoctorSearch && !event.target.closest('.doctor-search-container')) {
        setShowDoctorSearch(false);
      }
      if (showPatientSearch && !event.target.closest('.patient-search-container')) {
        setShowPatientSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDoctorSearch, showPatientSearch]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setForm({ ...form, patientId: patient._id || patient.id });
    setPatientSearchQuery(patient.name);
    setShowPatientSearch(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPatientForm({ ...patientForm, report: file });
      setUploadedFileName(file.name);
      // Show success notification
      setMsg(`File "${file.name}" selected successfully!`);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!patientForm.testName || !patientForm.doctorId) {
      setError('Test Name and Doctor are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('testName', patientForm.testName);
      formData.append('status', patientForm.status);
      formData.append('doctorId', patientForm.doctorId);
      if (patientForm.notes) formData.append('notes', patientForm.notes);
      if (patientForm.report) formData.append('report', patientForm.report);

      await labAPI.submitReport(formData);
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Reset form
      setPatientForm({
        testName: '',
        status: 'ordered',
        doctorId: '',
        notes: '',
        report: null,
      });
      setSelectedDoctor(null);
      setDoctorSearchQuery('');
      setUploadedFileName('');
      setShowSubmitForm(false);
      
      // Reload orders
      await loadOrders();
      
      // Close popup and navigate after 2 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        // Scroll to top to show the orders list
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit lab report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setPatientForm({ ...patientForm, doctorId: doctor._id });
    setDoctorSearchQuery(doctor.name);
    setShowDoctorSearch(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      if (!form.patientId || !form.testName) {
        setError(t('fillAllRequiredFields') || 'Please fill all required fields');
        return;
      }
      await labAPI.create(form);
      setForm({ patientId: '', testName: '', notes: '' });
      setSelectedPatient(null);
      setPatientSearchQuery('');
      setMsg(t('labOrderCreated') || 'Lab order created');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToCreateLabOrder') || 'Failed to create lab order');
    }
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
  });

  const handleUpdateClick = (id, currentStatus, currentNotes) => {
    setSelectedOrderId(id);
    setUpdateForm({
      status: currentStatus || '',
      notes: currentNotes || '',
    });
    setShowUpdateModal(true);
    setError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    
    setError('');
    try {
      await labAPI.update(selectedOrderId, { 
        status: updateForm.status,
        notes: updateForm.notes 
      });
      setMsg('Lab order updated successfully!');
      setShowUpdateModal(false);
      setSelectedOrderId(null);
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update lab order');
    }
  };

  const handleUpload = async (id, file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('result', file);
    try {
      await labAPI.uploadResult(id, formData);
      setMsg(t('resultUploaded') || 'Result uploaded');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToUploadResult') || 'Failed to upload result');
    } finally {
      setUploading(false);
    }
  };

  const handleLabUpdate = async (id) => {
    const status = window.prompt(t('enterNewStatus') || 'Enter new status', t('inProgress') || 'in-progress');
    if (!status) return;
    try {
      await labAPI.updateLabStatus(id, { status });
      setMsg(t('labStatusUpdated') || 'Status updated');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToUpdateStatus') || 'Failed to update status');
    }
  };

  const handleLabUpload = async (id, file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('result', file);
    try {
      await labAPI.uploadLabResult(id, formData);
      setMsg(t('labResultUploaded') || 'Result uploaded');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToUploadLabResult') || 'Failed to upload result');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '⏳';
      case 'ordered':
        return '📝';
      default:
        return '❓';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In-Progress';
      case 'ordered':
        return 'Ordered';
      default:
        return status;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleViewResult = (resultUrl) => {
    if (!resultUrl) return;
    // If it's a relative path, prepend the API base URL
    const fullUrl = resultUrl.startsWith('http') 
      ? resultUrl 
      : `${process.env.REACT_APP_API_URL || 'http://localhost:9358'}${resultUrl}`;
    window.open(fullUrl, '_blank');
  };

  if (!user) {
    return (
      <div className="container">
        <p>{t('accessDenied') || 'Access Denied'}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="lab-orders-header">
        <h1>
          {isDoctor ? (t('labOrdersDoctor') || 'My Lab Orders') : isLab ? (t('labOrdersLab') || 'Lab Orders') : (t('myLabOrders') || 'My Lab Orders')}
        </h1>
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '30px 40px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          textAlign: 'center',
          border: '2px solid #28a745'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Submitted Successfully!</h3>
          <p style={{ margin: '0', color: '#666' }}>Your lab report has been submitted.</p>
        </div>
      )}

      {/* Overlay for popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        }} />
      )}

      {/* Patient Submit Lab Report Form */}
      {isPatient && (
        <div className="submit-lab-report-section">
          {!showSubmitForm ? (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="submit-btn submit-report-btn"
            >
              📋 Submit a Lab Report
            </button>
          ) : (
            <div className="create-lab-order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Submit Lab Report</h3>
                <button
                  onClick={() => {
                    setShowSubmitForm(false);
                    setPatientForm({
                      testName: '',
                      status: 'ordered',
                      doctorId: '',
                      notes: '',
                      report: null,
                    });
                    setSelectedDoctor(null);
                    setDoctorSearchQuery('');
                    setError('');
                  }}
                  className="close-btn"
                  style={{ background: '#dc3545', padding: '8px 16px', borderRadius: '6px', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  ✕ Cancel
                </button>
              </div>
              <form onSubmit={handlePatientSubmit} className="lab-order-form">
                <div className="form-group">
                  <label htmlFor="testName">Test Name *</label>
                  <input
                    type="text"
                    id="testName"
                    value={patientForm.testName}
                    onChange={(e) => setPatientForm({ ...patientForm, testName: e.target.value })}
                    placeholder="e.g., Complete Blood Count (CBC)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Test Status *</label>
                  <select
                    id="status"
                    value={patientForm.status}
                    onChange={(e) => setPatientForm({ ...patientForm, status: e.target.value })}
                    required
                  >
                    <option value="ordered">Ordered</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group doctor-search-container">
                  <label htmlFor="doctorSearch">Select Doctor *</label>
                  <input
                    type="text"
                    id="doctorSearch"
                    value={doctorSearchQuery}
                    onChange={(e) => {
                      setDoctorSearchQuery(e.target.value);
                      if (e.target.value === '') {
                        setSelectedDoctor(null);
                        setPatientForm({ ...patientForm, doctorId: '' });
                      }
                    }}
                    placeholder="Search for a doctor..."
                    required
                  />
                  {showDoctorSearch && doctorSearchResults.length > 0 && (
                    <div className="doctor-search-results">
                      {doctorSearchResults.map((doctor) => (
                        <div
                          key={doctor._id}
                          className="doctor-search-item"
                          onClick={() => handleSelectDoctor(doctor)}
                        >
                          <div>
                            <strong>{doctor.name}</strong>
                            {doctor.specialization && <div style={{ fontSize: '12px', color: '#666' }}>{doctor.specialization}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showDoctorSearch && doctorSearchResults.length === 0 && doctorSearchQuery.length >= 2 && (
                    <div className="doctor-search-results">
                      <div className="doctor-search-item" style={{ color: '#666', fontStyle: 'italic' }}>
                        No doctors found
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="report">Upload Report (PDF or Image)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      id="report"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="file-input"
                      style={{ flex: '1', minWidth: '200px' }}
                    />
                    {uploadedFileName && (
                      <span style={{ 
                        color: '#28a745', 
                        fontWeight: '500',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        ✓ {uploadedFileName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={patientForm.notes}
                    onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                    placeholder="Additional remarks related to the test..."
                    rows="3"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Lab Report'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Doctor Search and Filter */}
      {isDoctor && (
        <div className="search-filter-section">
          <div className="search-filter-row">
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label htmlFor="patientSearch">Search by Patient Name</label>
              <input
                type="text"
                id="patientSearch"
                value={doctorSearchFilter}
                onChange={(e) => setDoctorSearchFilter(e.target.value)}
                placeholder="Enter patient name..."
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ flex: 0, minWidth: '200px' }}>
              <label htmlFor="statusFilter">Filter by Status</label>
              <select
                id="statusFilter"
                value={doctorStatusFilter}
                onChange={(e) => setDoctorStatusFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Status</option>
                <option value="ordered">Ordered</option>
                <option value="in-progress">In-Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Create New Lab Order Button */}
      {isDoctor && (
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/lab-orders/create')}
            className="submit-btn submit-report-btn"
            style={{ maxWidth: '300px', margin: '0 auto', display: 'block' }}
          >
            ➕ Create New Lab Order
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <p>{t('loadingLabOrders') || 'Loading lab orders...'}</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && (
        <div className="lab-orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>{t('noLabOrdersFound') || 'No lab orders found'}</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="lab-order-card">
                <div className="lab-order-header">
                  <div className="order-info">
                    <h3>{order.testName}</h3>
                    <span className={`status-badge ${order.status}`}>
                      {getStatusIcon(order.status)} {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="order-date">
                    <small>Created on: {formatDate(order.createdAt)}</small>
                  </div>
                </div>

                <div className="lab-order-details">
                  <div className="detail-row">
                    <span className="detail-label">Patient:</span>
                    <span className="detail-value">
                      {typeof order.patientId === 'object' && order.patientId?.name 
                        ? order.patientId.name 
                        : order.patientId || 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Doctor:</span>
                    <span className="detail-value">
                      {typeof order.doctorId === 'object' && order.doctorId?.name 
                        ? order.doctorId.name 
                        : order.doctorId || 'N/A'
                      }
                    </span>
                  </div>
                  {order.notes && (
                    <div className="detail-row">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{order.notes}</span>
                    </div>
                  )}
                  {order.resultUrl && (
                    <div className="detail-row">
                      <span className="detail-label">Result:</span>
                      <button
                        onClick={() => handleViewResult(order.resultUrl)}
                        className="result-link result-button"
                      >
                        📄 View Result
                      </button>
                    </div>
                  )}
                </div>

                <div className="lab-order-actions">
                  {/* Patient Upload */}
                  {isPatient && order.status !== 'completed' && order._id && !order._id.startsWith('demo') && (
                    <div className="upload-section">
                      <label htmlFor={`upload-${order._id}`} className="upload-label">
                        {t('uploadPatientResult') || 'Upload Result'}
                      </label>
                      <input
                        type="file"
                        id={`upload-${order._id}`}
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleUpload(order._id, file);
                        }}
                        disabled={uploading}
                        className="file-input"
                      />
                      {uploading && <span className="uploading-text">{t('uploading') || 'Uploading...'}</span>}
                    </div>
                  )}

                  {/* Doctor Update */}
                  {isDoctor && order._id && !order._id.startsWith('demo') && (
                    <button 
                      onClick={() => handleUpdateClick(order._id, order.status, order.notes)}
                      className="action-btn update-btn"
                    >
                      {t('updateLabOrder') || 'Update Lab Order'}
                    </button>
                  )}

                  {/* Lab Personnel Actions */}
                  {isLab && order._id && !order._id.startsWith('demo') && (
                    <div className="lab-actions">
                      <button 
                        onClick={() => handleLabUpdate(order._id)}
                        className="action-btn update-btn"
                      >
                        {t('updateStatus') || 'Update Status'}
                      </button>
                      <div className="upload-section">
                        <label htmlFor={`lab-upload-${order._id}`} className="upload-label">
                          {t('uploadLabResult') || 'Upload Result'}
                        </label>
                        <input
                          type="file"
                          id={`lab-upload-${order._id}`}
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleLabUpload(order._id, file);
                          }}
                          disabled={uploading}
                          className="file-input"
                        />
                        {uploading && <span className="uploading-text">{t('uploading') || 'Uploading...'}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }} onClick={() => setShowUpdateModal(false)} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            minWidth: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Update Lab Order</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="updateStatus">Status *</label>
                <select
                  id="updateStatus"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd' }}
                >
                  <option value="">Select Status</option>
                  <option value="ordered">Ordered</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label htmlFor="updateNotes">Notes</label>
                <textarea
                  id="updateNotes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  placeholder="Update notes..."
                  rows="3"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="submit-btn">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedOrderId(null);
                    setUpdateForm({ status: '', notes: '' });
                  }}
                  className="close-btn"
                  style={{ background: '#6c757d' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default LabOrders;
