/**
 * Doctor Online Appointments Page
 * Shows list of online appointments
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import './DoctorOnlineAppointments.css';

export default function DoctorOnlineAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Load online appointments
  const loadAppointments = useCallback(async () => {
    try {
      // Get doctor's appointments and filter for online type
      const { data } = await appointmentsAPI.doctor(user?.doctorId);
      const onlineAppts = (data.appointments || []).filter(a => a.type === 'online');
      setAppointments(onlineAppts);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.doctorId) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [user, loadAppointments]);

  // Mark appointment as completed
  const markCompleted = async (appointmentId) => {
    try {
      await appointmentsAPI.complete(appointmentId);
      setMsg('Appointment marked as completed');
      loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="online-appointments-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="online-appointments-container">
      <div className="page-header">
        <h1>Online Appointments</h1>
        <p>View your scheduled online appointments</p>
      </div>

      {msg && <div className="message">{msg}</div>}

      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Online Appointments</h3>
          <p>You don't have any online appointments scheduled yet.</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appt) => (
            <div key={appt._id} className="appointment-card">
              <div className="patient-info">
                <div className="patient-avatar">
                  {appt.patientId?.name?.charAt(0) || '?'}
                </div>
                <div className="patient-details">
                  <h3>{appt.patientId?.name || 'Unknown Patient'}</h3>
                  <p>{appt.patientId?.email}</p>
                </div>
              </div>

              <div className="appointment-meta">
                <div className="meta-item">
                  <span className="meta-label">Scheduled</span>
                  <span className="meta-value">
                    {new Date(appt.slotId?.date || appt.date).toLocaleString()}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`status-badge ${appt.status}`}>{appt.status}</span>
                </div>
              </div>

              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                <div className="appointment-actions">
                  <button
                    className="btn-complete"
                    onClick={() => markCompleted(appt._id)}
                  >
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
