import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { favoritesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import './Favorites.css';

export default function Favorites() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Load user's favorites
  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = filter !== 'all' ? { targetType: filter } : {};
      const { data } = await favoritesAPI.list(params);
      setFavorites(data.favorites || []);
      setMsg('');
    } catch (err) {
      console.error('Error loading favorites:', err);
      setMsg(err.response?.data?.error || t('failedToLoadFavorites'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user, filter]);

  // Remove favorite
  const removeFavorite = async (targetType, targetId) => {
    try {
      await favoritesAPI.toggle({ targetType, targetId });
      await loadFavorites();
      setMsg(t('favoriteRemoved'));
    } catch (err) {
      setMsg(err.response?.data?.error || t('failedToRemoveFavorite'));
    }
  };

  if (!user) {
    return (
      <div className="container">
        <p>{t('accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="favorites-header">
        <h1>{t('myFavorites')}</h1>
        <div className="filter-controls">
          <label htmlFor="favorite-filter">{t('filterBy')}:</label>
          <select
            id="favorite-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('all')}</option>
            <option value="doctor">{t('doctors')}</option>
            <option value="hospital">{t('hospitals')}</option>
          </select>
        </div>
      </div>

      {msg && (
        <div className={`message ${msg.includes('Failed') ? 'error' : 'success'}`}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <p>{t('loading')}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❤️</div>
          <h3>{t('noFavoritesFound')}</h3>
          <p>{t('addFavoritesHint')}</p>
          <div className="empty-actions">
            <Link to="/hospitals" className="btn-primary">
              {t('findHospitals')}
            </Link>
            <Link to="/doctors" className="btn-secondary">
              {t('findDoctor')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((favorite) => (
            <div key={favorite._id} className="favorite-card">
              <div className="favorite-header">
                <span className={`favorite-type ${favorite.targetType}`}>
                  {favorite.targetType === 'doctor' ? t('doctor') : t('hospital')}
                </span>
                <button
                  onClick={() => removeFavorite(favorite.targetType, favorite.targetId?._id)}
                  className="remove-btn"
                  aria-label={t('removeFromFavorites')}
                  title={t('removeFromFavorites')}
                >
                  ×
                </button>
              </div>
              <div className="favorite-content">
                <h3>{favorite.targetId?.name || 'Unknown'}</h3>
                {favorite.targetType === 'doctor' && (
                  <div className="doctor-info">
                    {favorite.targetId?.specialty && (
                      <p><strong>{t('specialty')}:</strong> {favorite.targetId.specialty}</p>
                    )}
                    {favorite.targetId?.hospital && (
                      <p><strong>{t('hospitalLabel')}</strong> {favorite.targetId.hospital}</p>
                    )}
                    {favorite.targetId?.fee && (
                      <p><strong>{t('consultationFee')}:</strong> {favorite.targetId.fee} {t('taka')}</p>
                    )}
                  </div>
                )}
                {favorite.targetType === 'hospital' && (
                  <div className="hospital-info">
                    {favorite.targetId?.location && (
                      <p><strong>{t('address')}:</strong> {favorite.targetId.location}</p>
                    )}
                    {favorite.targetId?.city && (
                      <p><strong>City:</strong> {favorite.targetId.city}</p>
                    )}
                    {favorite.targetId?.phone && (
                      <p><strong>{t('phoneLabel')}</strong> {favorite.targetId.phone}</p>
                    )}
                    {favorite.targetId?.specializations && (
                      <p><strong>{t('specialty')}:</strong> {favorite.targetId.specializations}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="favorite-actions">
                {favorite.targetType === 'doctor' && favorite.targetId?._id && (
                  <button
                    onClick={() => window.location.href = `/doctor/${favorite.targetId._id}`}
                    className="action-btn primary"
                  >
                    {t('viewProfile')}
                  </button>
                )}
                {favorite.targetType === 'hospital' && favorite.targetId?._id && (
                  <button
                    onClick={() => window.location.href = `/hospital/${favorite.targetId._id}`}
                    className="action-btn primary"
                  >
                    {t('viewProfile')}
                  </button>
                )}
              </div>
              <div className="favorite-date">
                <small>{t('addedOn')}: {new Date(favorite.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}