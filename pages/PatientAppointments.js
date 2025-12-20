import { useEffect, useState } from 'react';
import { appointmentsAPI, reviewAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './PatientAppointments.css';

export default function PatientAppointments() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviewStatuses, setReviewStatuses] = useState({});
  const [form, setForm] = useState({ doctorId: '', date: '' });
  const [msg, setMsg] = useState('');

  // Load patient's appointments
  const loadAppointments = async () => {
    try {
      const { data } = await appointmentsAPI.mine();
      setAppointments(data.appointments || []);
      // Check review statuses for completed appointments
      checkReviewStatuses(data.appointments || []);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load appointments');
    }
  };

  // Load favorites
  const loadFavorites = async () => {
    try {
      const { data } = await favoriteAPI.mine();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.log('Failed to load favorites:', err);
    }
  };

  // Check review status for appointments
  const checkReviewStatuses = async (appts) => {
    const statuses = {};
    for (const appt of appts) {
      if (new Date(appt.date) < new Date()) { // completed
        try {
          const { data } = await reviewAPI.checkStatus(appt._id);
          statuses[appt._id] = data;
        } catch (err) {
          statuses[appt._id] = { reviewed: false, appointmentCompleted: true };
        }
      }
    }
    setReviewStatuses(statuses);
  };

  useEffect(() => {
    loadAppointments();
    loadFavorites();
  }, []);

  // Book new appointment
  const bookAppointment = async () => {
    setMsg('');
    try {
      const { data } = await appointmentsAPI.book(form);
      setMsg(`Appointment ${data.status}`);
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Booking failed');
    }
  };

  // Reschedule existing appointment
  const rescheduleAppointment = async (id) => {
    const newDate = prompt('Enter new date/time (ISO format):', new Date().toISOString());
    if (!newDate) return;
    setMsg('');
    try {
      const { data } = await appointmentsAPI.reschedule(id, { newDate });
      setMsg(`Reschedule ${data.status}`);
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Reschedule failed');
    }
  };

  // Cancel appointment
  const cancelAppointment = async (id) => {
    setMsg('');
    try {
      await appointmentsAPI.cancel(id);
      setMsg('Appointment cancelled');
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Cancel failed');
    }
  };

  // Submit review
  const submitReview = async (appointment) => {
    const rating = prompt('Rate 1-5 stars:');
    const comment = prompt('Comment (optional):');
    if (!rating || rating < 1 || rating > 5) return;
    setMsg('');
    try {
      await reviewAPI.create({
        appointmentId: appointment._id,
        targetType: 'doctor',
        targetId: appointment.doctorId._id || appointment.doctorId,
        rating: parseInt(rating),
        comment: comment || '',
      });
      setMsg('Review submitted');
      await loadAppointments(); // refresh review statuses
    } catch (err) {
      setMsg(err.response?.data?.error || 'Review failed');
    }
  };

  const renderStatus = (status) => {
    if (status === 'waitlisted') return <span className="badge waitlisted">⏳ Waitlisted</span>;
    if (status === 'booked') return <span className="badge booked">Booked</span>;
    if (status === 'cancelled') return <span className="badge cancelled">Cancelled</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <div className="card">
      <h2>{t('myAppointments')}</h2>

      {/* Booking form */}
      <div className="row">
        <input
          className="input"
          placeholder="Doctor ID"
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
        />
        <input
          className="input"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <button className="btn" onClick={bookAppointment}>{t('book')}</button>
      </div>

      {msg && <p className="kicker">{msg}</p>}

      {/* Appointment list */}
      <ul className="appointment-list">
        {appointments.map((a) => {
          const isCompleted = new Date(a.date) < new Date();
          const reviewStatus = reviewStatuses[a._id];
          const canReview = isCompleted && reviewStatus && !reviewStatus.reviewed;
          return (
            <li key={a._id} className="appointment-item">
              <div>
                <strong>Doctor:</strong> {a.doctorId?.name || a.doctorId} <br />
                <strong>Hospital:</strong> {a.doctorId?.hospital_id?.name || 'N/A'} <br />
                <strong>When:</strong> {new Date(a.date).toLocaleString()} <br />
                <strong>Status:</strong> {renderStatus(a.status)}
                {isCompleted && reviewStatus && (
                  <span> {reviewStatus.reviewed ? 'Reviewed' : 'Not reviewed'}</span>
                )}
              </div>
              <div className="actions">
                <button className="btn secondary" onClick={() => rescheduleAppointment(a._id)}>{t('reschedule')}</button>
                <button className="btn danger" onClick={() => cancelAppointment(a._id)}>{t('cancel')}</button>
                {canReview && (
                  <button className="btn" onClick={() => submitReview(a)}>Review</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Favorites */}
      <h3>My Favorites</h3>
      <ul className="appointment-list">
        {favorites.map((f) => (
          <li key={f._id} className="appointment-item">
            <div>
              <strong>{f.targetType}:</strong> {f.targetId?.name || f.targetId}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
