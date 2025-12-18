import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import './Profile.css'; // Import the CSS file

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
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
        setMsg(t('profileLoadFailed'));
      }
    };
    fetchProfile();
  }, [setUser]);

  const save = async () => {
    setMsg('');
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data.user || data);
      setMsg(t('profileUpdated'));
    } catch (err) {
      setMsg(err.response?.data?.error || 'Update failed');
    }
  };

  if (!user) return <div>{t('loading')}</div>;

  return (
    <div className="card">
      <h2>{t('myProfile')}</h2>
      {user.locked && (
        <p style={{ color: 'red', textAlign: 'center' }}>
          {t('profileLocked')}
        </p>
      )}

      <div className="row">
        <input
          className="input"
          value={form.name || ''}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder={t('name')}
          disabled={user.locked}
        />
        <input
          className="input"
          value={form.phone || ''}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder={t('phone')}
          disabled={user.locked}
        />
        <input
          className="input"
          value={form.address || ''}
          onChange={e => setForm({ ...form, address: e.target.value })}
          placeholder={t('address')}
          disabled={user.locked}
        />
        <input
          className="input"
          value={form.gender || ''}
          onChange={e => setForm({ ...form, gender: e.target.value })}
          placeholder={t('gender')}
          disabled={user.locked}
        />
      </div>

      <button className="btn" onClick={save} disabled={user.locked}>
        {t('save')}
      </button>

      {msg && <p className="kicker">{msg}</p>}
    </div>
  );
}
