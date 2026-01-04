import { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../PatientAppointment.css';

export default function PatientAppointments() {
  const { t, toggleLanguage, language } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '', type: 'in-person' });
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
    if (status === 'waitlisted') return <span className="badge waitlisted">{t('waitlisted')}</span>;
    if (status === 'booked') return <span className="badge booked">{t('booked')}</span>;
    if (status === 'approved') return <span className="badge approved">{t('approved')}</span>;
    if (status === 'cancelled') return <span className="badge cancelled">{t('cancelled')}</span>;
    if (status === 'completed') return <span className="badge completed">{t('completed')}</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('myAppointments')}</h2>
        <button onClick={toggleLanguage} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{language === 'en' ? 'বাংলা' : 'English'}</button>
      </div>

      {/* Booking form */}
      <div className="row">
        <input
          className="input"
          placeholder={t('doctorIdPlaceholder')}
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
        />
        <input
          className="input"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="input"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="in-person">{t('inPerson')}</option>
          <option value="online">{t('online')}</option>
        </select>
        <button className="btn" onClick={bookAppointment}>{t('book')}</button>
      </div>

      {msg && <p className="kicker">{msg}</p>}

      {/* Appointment list */}
      <ul className="appointment-list">
        {appointments.map((a) => (
          <li key={a._id} className="appointment-item">
            <div>
              <strong>{t('doctor')}:</strong> {a.doctorId?.name || a.doctorId} <br />
              <strong>{t('hospital')}:</strong> {a.hospitalId?.name || t('notAvailable')} <br />
              <strong>{t('when')}:</strong> {new Date(a.slotId?.date || a.date).toLocaleString()} <br />
              <strong>{t('type')}:</strong> {a.type === 'online' ? t('online') : t('inPerson')} <br />
              <strong>{t('status')}:</strong> {renderStatus(a.status)}
            </div>
            <div className="actions">
              {a.status !== 'cancelled' && a.status !== 'completed' && (
                <>
                  <button className="btn secondary" onClick={() => rescheduleAppointment(a._id)}>{t('reschedule')}</button>
                  <button className="btn danger" onClick={() => cancelAppointment(a._id)}>{t('cancel')}</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
