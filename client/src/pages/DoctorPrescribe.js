import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { prescriptionAPI } from '../services/api';
import '../styles/Auth.css'; // Re-use auth styles

const DoctorPrescribe = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Initialize medications
  const [medications, setMedications] = useState([
    { drug: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addMedication = () => {
    setMedications([...medications, { drug: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedication = (index) => {
    const newMeds = medications.filter((_, i) => i !== index);
    setMedications(newMeds);
  };

  const handleMedChange = (index, field, value) => {
    const newMeds = [...medications];
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await prescriptionAPI.create({
        patientId: state?.patientId || '', // Handles empty state for testing
        medications,
        diagnosis,
        notes
      });
      alert('✅ Prescription Created & PDF Generated Successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to create prescription. Check console for details.');
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
        <div className="nav-logo"><span>🏥</span></div>
        <ul className="nav-links">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li><Link to="/appointments">Appointments</Link></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/dashboard"><button className="btn-dark">Back</button></Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card" style={{ maxWidth: '800px', width: '95%' }}>
          <h2>💊 Write New Prescription</h2>
          <p style={{marginBottom: '20px', color: '#666'}}>
            {state?.patientId ? `Prescribing for Patient ID: ${state.patientId}` : 'Creating new prescription'}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Diagnosis</label>
              <input 
                type="text"
                placeholder="e.g. Acute Bronchitis" 
                value={diagnosis} 
                onChange={e => setDiagnosis(e.target.value)} 
                required
              />
            </div>

            <div className="form-group">
              <label>Medications</label>
              {medications.map((med, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                  gap: '10px', 
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px'
                }}>
                  <input placeholder="Drug Name" value={med.drug} onChange={e => handleMedChange(index, 'drug', e.target.value)} required />
                  <input placeholder="Dosage" value={med.dosage} onChange={e => handleMedChange(index, 'dosage', e.target.value)} required />
                  <input placeholder="Freq (1-0-1)" value={med.frequency} onChange={e => handleMedChange(index, 'frequency', e.target.value)} required />
                  <input placeholder="Duration" value={med.duration} onChange={e => handleMedChange(index, 'duration', e.target.value)} required />
                  
                  {medications.length > 1 && (
                    <button type="button" onClick={() => removeMedication(index)} style={{background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '0 10px'}}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMedication} className="btn-dark" style={{fontSize: '12px', padding: '5px 10px'}}>
                + Add Another Drug
              </button>
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea 
                placeholder="Instructions, advice, or follow-up..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                style={{width: '100%', minHeight: '80px', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
              />
            </div>
            
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Generating PDF...' : 'Generate PDF & QR Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescribe;