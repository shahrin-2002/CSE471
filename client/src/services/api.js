/**
 * API Service - Handles all HTTP requests to backend
 */

import axios from 'axios';

// Base API URL - update this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9358/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =======================
// Auth API endpoints
// =======================
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  getProfile: () => api.get('/auth/profile'),
};

// =======================
// Hospital API endpoints
// =======================
export const hospitalAPI = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (hospitalData) => api.post('/hospitals', hospitalData),
  update: (id, hospitalData) => api.put(`/hospitals/${id}`, hospitalData),
};

// =======================
// Doctor API endpoints
// =======================
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (doctorData) => api.post('/doctors', doctorData),
  update: (id, doctorData) => api.put(`/doctors/${id}`, doctorData),
  getSlots: (doctorId, date) => api.get(`/doctors/${doctorId}/slots?date=${date}`),
  updateAvailability: (data) => api.put('/doctors/availability/me', data),
  getMyProfile: () => api.get('/doctors/profile/me'),
};

// =======================
// Appointment API endpoints
// =======================
export const appointmentsAPI = {
  book: (payload) => api.post('/appointments/book', payload),
  reschedule: (id, payload) => api.patch(`/appointments/${id}/reschedule`, payload),
  cancel: (id) => api.delete(`/appointments/${id}/cancel`),
  mine: () => api.get('/appointments/mine'),
  doctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
};

// =======================
// Medical Record API endpoints
// =======================
export const medicalRecordAPI = {
  // Patient: view own records
  mine: () => api.get('/records/mine'),

  // Doctor: create new record
  create: (payload) => api.post('/records', payload),

  // Doctor: view patient records
  forPatient: (patientId) => api.get(`/records/${patientId}`),

  // Doctor: update record
  update: (id, payload) => api.patch(`/records/${id}`, payload),

  // Doctor: add attachment (metadata only)
  addAttachment: (id, payload) => api.post(`/records/${id}/attachments`, payload),

  // Doctor: remove attachment
  removeAttachment: (id, attachmentId) => api.delete(`/records/${id}/attachments/${attachmentId}`),
};

export default api;
