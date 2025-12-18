import { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function DoctorSlots() {
  const { user } = useAuth(); // doctor user
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [msg, setMsg] = useState('');

  // Load doctor's appointments
  const loadAppointments = async () => {
    try {
      const { data } = await appointmentsAPI.doctor(user._id);
      setAppointments(data.appointments || []);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load doctor appointments');
    }
  };

  useEffect(() => {
    if (user) loadAppointments();
  }, [user]);

  return (
    <div className="card">
      <h2>{t('myAppointments')}</h2>
      {msg && <p className="kicker">{msg}</p>}

      <ul>
        {appointments.map((a) => (
          <li key={a._id}>
            Patient: {a.patientId?.name || a.patientId} | 
            Date: {new Date(a.date).toLocaleString()} | 
            Status: {a.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
