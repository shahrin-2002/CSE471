import { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await appointmentsAPI.mine();
    setAppointments(data.appointments || []);
  };

  useEffect(() => { load(); }, []);

  const book = async () => {
    try {
      const { data } = await appointmentsAPI.book(form);
      setMsg(`Appointment ${data.status}`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Booking failed');
    }
  };

  const reschedule = async (id, newDate) => {
    try {
      const { data } = await appointmentsAPI.reschedule(id, { doctorId: form.doctorId || user._id, newDate });
      setMsg(`Reschedule ${data.status}`);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Reschedule failed');
    }
  };

  const cancel = async (id) => {
    try {
      await appointmentsAPI.cancel(id);
      setMsg('Appointment cancelled');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Cancel failed');
    }
  };

  return (
    <div className="card">
      <h2>My Appointments</h2>
      <div className="row">
        <input className="input" placeholder="Doctor ID" value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} />
        <input className="input" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <button className="btn" onClick={book}>Book</button>
      </div>

      {msg && <p className="kicker">{msg}</p>}

      <ul>
        {appointments.map(a => (
          <li key={a._id}>
            Doctor: {a.doctorId?.name || a.doctorId} | {new Date(a.date).toLocaleString()} | Status: {a.status}
            <button className="btn" onClick={() => reschedule(a._id, prompt('New date (ISO):', new Date().toISOString()))}>Reschedule</button>
            <button className="btn" onClick={() => cancel(a._id)}>Cancel</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
