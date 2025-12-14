import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css'; // Import the CSS file

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(user || {});
  const [msg, setMsg] = useState('');

  // Load profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/me');
        setForm(data.user || data);
        setUser(data.user || data);
      } catch (err) {
        setMsg('Failed to load profile');
      }
    };
    fetchProfile();
  }, [setUser]);

  const save = async () => {
    setMsg('');
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data.user || data);
      setMsg('Profile updated successfully');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Update failed');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="card">
      <h2>My Profile</h2>
      {user.locked && (
        <p style={{ color: 'red', textAlign: 'center' }}>
          Your profile is locked. You cannot edit.
        </p>
      )}

      <div className="row">
        <input
          className="input"
          value={form.name || ''}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          disabled={user.locked}
        />
        <input
          className="input"
          value={form.phone || ''}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone"
          disabled={user.locked}
        />
        <input
          className="input"
          value={form.address || ''}
          onChange={e => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
          disabled={user.locked}
        />
        <input
          className="input"
          value={form.gender || ''}
          onChange={e => setForm({ ...form, gender: e.target.value })}
          placeholder="Gender"
          disabled={user.locked}
        />
      </div>

      <button className="btn" onClick={save} disabled={user.locked}>
        Save
      </button>

      {msg && <p className="kicker">{msg}</p>}
    </div>
  );
}
