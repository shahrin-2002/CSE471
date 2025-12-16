import { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PatientAppointments.css';

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '' });
  const [msg, setMsg] = useState('');

  // Load patient's appointments
  const loadAppointments = async () => {
    try {
      const { data } = await appointmentsAPI.mine();
      setAppointments(data.appointments || []);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load appointments');
    }
  };

  useEffect(() => {
    loadAppointments();
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

  const renderStatus = (status) => {
    if (status === 'waitlisted') return <span className="badge waitlisted">⏳ Waitlisted</span>;
    if (status === 'booked') return <span className="badge booked">Booked</span>;
    if (status === 'cancelled') return <span className="badge cancelled">Cancelled</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <div className="card">
      <h2>My Appointments</h2>

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
        <button className="btn" onClick={bookAppointment}>Book</button>
      </div>

      {msg && <p className="kicker">{msg}</p>}

      {/* Appointment list */}
      <ul className="appointment-list">
        {appointments.map((a) => (
          <li key={a._id} className="appointment-item">
            <div>
              <strong>Doctor:</strong> {a.doctorId?.name || a.doctorId} <br />
              <strong>Hospital:</strong> {a.hospitalId?.name || 'N/A'} <br />
              <strong>When:</strong> {new Date(a.date).toLocaleString()} <br />
              <strong>Status:</strong> {renderStatus(a.status)}
            </div>
            <div className="actions">
              <button className="btn secondary" onClick={() => rescheduleAppointment(a._id)}>Reschedule</button>
              <button className="btn danger" onClick={() => cancelAppointment(a._id)}>Cancel</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
