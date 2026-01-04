import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import './Notifications.css';

export default function Notifications() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Mock notifications data - in a real app, this would come from an API
  const mockNotifications = [
    {
      id: '1',
      type: 'appointment_reminder',
      title: t('appointmentReminder'),
      message: 'Your appointment with Dr. Smith is tomorrow at 2:00 PM',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      data: { appointmentId: 'app_123' }
    },
    {
      id: '2',
      type: 'booking_confirmation',
      title: t('bookingConfirmed'),
      message: 'Your ICU booking for Dec 25, 2024 has been confirmed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
      data: { bookingId: 'icu_456', bookingType: 'ICU' }
    },
    {
      id: '3',
      type: 'status_updated',
      title: t('statusUpdated'),
      message: 'Your profile verification status has been updated',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
      data: { entityType: 'Profile', entityId: 'user_789' }
    },
    {
      id: '4',
      type: 'lab_results',
      title: 'Lab Results Available',
      message: 'Your blood test results are now available',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      read: true,
      data: { labOrderId: 'lab_101' }
    }
  ];

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      // const { data } = await notificationsAPI.list();
      // setNotifications(data.notifications || []);
      
      // For now, use mock data
      setNotifications(mockNotifications);
      setMsg('');
    } catch (err) {
      setMsg(err.response?.data?.error || t('failedToLoadNotifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_reminder':
        return '🗓️';
      case 'booking_confirmation':
        return '✅';
      case 'status_updated':
        return '📋';
      case 'lab_results':
        return '🧪';
      case 'prescription':
        return '💊';
      default:
        return '🔔';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  if (!user) {
    return (
      <div className="container">
        <p>{t('accessDenied')}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container">
      <div className="notifications-header">
        <h1>{t('notifications')}</h1>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-btn">
              {t('markAllAsRead')}
            </button>
          )}
          <span className="notification-count">
            {unreadCount > 0 && `${unreadCount} ${t('unread')}`}
          </span>
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
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p>{t('noNotificationsFound')}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-card ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  <span className="notification-time">
                    {formatRelativeTime(notification.timestamp)}
                  </span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="action-btn"
                    >
                      {t('markAsRead')}
                    </button>
                  )}
                  
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="delete-btn"
                    aria-label={t('deleteNotification')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}