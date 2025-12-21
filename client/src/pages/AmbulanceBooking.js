import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ambulanceAPI } from '../services/api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const AmbulanceBooking = () => {
  const { user } = useAuth();
  const [type, setType] = useState('BLS');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Connect for real-time updates
    const socket = io('http://localhost:9358');
    
    // Listen for updates specific to this user
    socket.on(`ambulance_update_${user.id}`, (updatedBooking) => {
      setStatus(updatedBooking);
      setLoading(false);
    });

    return () => socket.disconnect();
  }, [user]);

  const handleBook = async () => {
    if (!address) return alert('Please enter a pickup address');
    
    setLoading(true);
    try {
      await ambulanceAPI.book({
        type,
        location: { address, lat: 23.8103, lng: 90.4125 }
      });
      // The socket will update the status shortly
    } catch (err) {
      alert('Booking failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      <nav className="auth-nav">
        <div className="nav-logo"><span>🏥</span></div>
        <ul className="nav-links">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/hospitals">Hospitals</Link></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/dashboard"><button className="btn-dark">Back</button></Link>
        </div>
      </nav>

      <div className="auth-content">
        <div className="auth-card">
          <h2>🚑 Ambulance Service</h2>
          
          {!status ? (
            // Booking Form
            <div style={{textAlign: 'left'}}>
              <p style={{marginBottom: '20px', color: '#666'}}>
                Request immediate emergency transport. Please ensure your phone line is open.
              </p>

              <div className="form-group">
                <label>Ambulance Type</label>
                <select value={type} onChange={e => setType(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '5px'}}>
                  <option value="BLS">Basic Life Support (BLS)</option>
                  <option value="ALS">Advanced Life Support (ALS) - ICU</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pickup Location</label>
                <input 
                  type="text" 
                  placeholder="Enter full address..." 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                />
              </div>

              <button onClick={handleBook} className="btn-submit" disabled={loading} style={{backgroundColor: '#dc3545'}}>
                {loading ? 'Requesting...' : 'Request Ambulance Now'}
              </button>
            </div>
          ) : (
            // Tracking View
            <div style={{textAlign: 'center', padding: '20px'}}>
              <div style={{fontSize: '50px', marginBottom: '10px'}}>🚑 💨</div>
              
              <h3 style={{color: status.status === 'arrived' ? '#28a745' : '#ffc107', textTransform: 'uppercase', letterSpacing: '2px'}}>
                {status.status}
              </h3>
              
              <div style={{margin: '30px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0'}}>
                <div style={{marginBottom: '10px'}}>
                  <span style={{color: '#888'}}>Estimated Arrival</span><br/>
                  <strong style={{fontSize: '24px'}}>{status.eta || 'Calculating...'}</strong>
                </div>
                <div>
                  <span style={{color: '#888'}}>Vehicle ID</span><br/>
                  <strong>{status.ambulanceId || 'Assigning...'}</strong>
                </div>
              </div>

              <p>Please stay at <strong>{address}</strong>.</p>
              <button className="btn-dark" onClick={() => setStatus(null)}>New Request</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmbulanceBooking;