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
  timeout: 60000, // 60 seconds timeout for slow internet connections
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
    // Log full error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    // Handle timeout errors (slow internet)
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('⏱️ Request timeout - Your internet connection may be slow');
      error.message = 'Request timed out. Please check your internet connection and try again.';
    }
    
    // Handle network errors (server not reachable)
    if (!error.response && error.request) {
      console.error('🌐 Network error - Unable to reach server');
      if (error.code === 'ECONNREFUSED') {
        error.message = 'Cannot connect to server. Please make sure the server is running on port 9358.';
      } else {
        error.message = 'Network error. Please check your internet connection.';
      }
    }
    
    // Handle 500 server errors with better messages
    if (error.response?.status === 500) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || 'Server error occurred';
      console.error('❌ Server Error:', serverMessage);
      // Keep the server's error message
      error.message = serverMessage;
    }
    
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
// User API endpoints
// =======================
export const userAPI = {
  search: (params) => api.get('/users/search', { params }),
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
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
  approve: (id) => api.patch(`/appointments/${id}/approve`),
  complete: (id) => api.patch(`/appointments/${id}/complete`),
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

// =======================
// ICU API endpoints
// =======================
export const icuAPI = {
  // Get all hospitals with ICU (with optional filters)
  getAll: (params) => api.get('/icu', { params }),

  // Get available locations
  getLocations: () => api.get('/icu/locations'),

  // Get ICU details for specific hospital
  getByHospital: (hospitalId) => api.get(`/icu/hospital/${hospitalId}`),

  // Book an ICU (requires auth)
  book: (payload) => api.post('/icu/book', payload),

  // Join waitlist (requires auth)
  joinWaitlist: (payload) => api.post('/icu/waitlist', payload),

  // Get user's ICU bookings
  myBookings: () => api.get('/icu/my-bookings'),

  // Get user's waitlist entries
  myWaitlist: () => api.get('/icu/my-waitlist'),

  // Cancel ICU booking
  cancelBooking: (bookingId) => api.delete(`/icu/booking/${bookingId}`),
};

// =======================
// General Bed API endpoints
// =======================
export const generalBedAPI = {
  // Get all hospitals with General Beds (with optional filters)
  getAll: (params) => api.get('/general-bed', { params }),

  // Get available locations
  getLocations: () => api.get('/general-bed/locations'),

  // Get General Bed details for specific hospital
  getByHospital: (hospitalId) => api.get(`/general-bed/hospital/${hospitalId}`),

  // Book a General Bed (requires auth)
  book: (payload) => api.post('/general-bed/book', payload),

  // Join waitlist (requires auth)
  joinWaitlist: (payload) => api.post('/general-bed/waitlist', payload),

  // Get user's General Bed bookings
  myBookings: () => api.get('/general-bed/my-bookings'),

  // Cancel General Bed booking
  cancelBooking: (bookingId) => api.delete(`/general-bed/booking/${bookingId}`),
};

// =======================
// Cabin API endpoints
// =======================
export const cabinAPI = {
  // Get all hospitals with Cabins (with optional filters)
  getAll: (params) => api.get('/cabin', { params }),

  // Get available locations
  getLocations: () => api.get('/cabin/locations'),

  // Get Cabin details for specific hospital
  getByHospital: (hospitalId) => api.get(`/cabin/hospital/${hospitalId}`),

  // Book a Cabin (requires auth)
  book: (payload) => api.post('/cabin/book', payload),

  // Join waitlist (requires auth)
  joinWaitlist: (payload) => api.post('/cabin/waitlist', payload),

  // Get user's Cabin bookings
  myBookings: () => api.get('/cabin/my-bookings'),

  // Cancel Cabin booking
  cancelBooking: (bookingId) => api.delete(`/cabin/booking/${bookingId}`),
};

// =======================
// Reviews API endpoints
// =======================
export const reviewsAPI = {
  list: () => api.get('/reviews/all'),
  getByTarget: (targetType, targetId) => api.get(`/reviews/${targetType}/${targetId}`),
  create: (reviewData) => api.post('/reviews', reviewData),
  update: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  delete: (id) => api.delete(`/reviews/${id}`),
  checkStatus: (appointmentId) => api.get(`/reviews/check/${appointmentId}`),
  myReviews: () => api.get('/reviews/patient/my'),
  myDoctorReviews: () => api.get('/reviews/doctor/my'),
  listPending: () => api.get('/reviews/admin/pending/list'),
  approve: (id) => api.patch(`/reviews/${id}/approve`),
  reject: (id) => api.patch(`/reviews/${id}/reject`),
};

// =======================
// Favorites API endpoints
// =======================
export const favoritesAPI = {
  toggle: (favoriteData) => api.post('/favorites/toggle', favoriteData),
  list: (params) => api.get('/favorites/mine', { params }),
  isFavorited: (targetType, targetId) => api.get(`/favorites/check/${targetType}/${targetId}`),
};

// =======================
// Lab Orders API endpoints
// =======================
export const labAPI = {
  // Get lab orders for current user (patient)
  mine: () => api.get('/lab-orders/mine'),
  
  // Get lab orders for doctor (with search and filter)
  mineDoctor: (params) => api.get('/lab-orders/doctor/mine', { params }),
  
  // Get lab orders for lab personnel
  listLab: () => api.get('/lab-orders/lab/mine'),
  
  // Patient submits lab report (creates new order with file upload)
  submitReport: (formData) => api.post('/lab-orders/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Create new lab order (doctor only)
  create: (orderData) => api.post('/lab-orders', orderData),
  
  // Update lab order status
  update: (id, updateData) => api.patch(`/lab-orders/${id}`, updateData),
  
  // Upload patient result
  uploadResult: (id, formData) => api.patch(`/lab-orders/${id}/upload-result`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Upload lab result (lab personnel)
  uploadLabResult: (id, formData) => api.patch(`/lab-orders/${id}/lab-upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Update lab status (lab personnel)
  updateLabStatus: (id, statusData) => api.patch(`/lab-orders/${id}/lab-update`, statusData),
  
  // Delete lab order
  delete: (id) => api.delete(`/lab-orders/${id}`),
};

// =======================
// Notifications API endpoints
// =======================
export const notificationsAPI = {
  sendOtp: (email) => api.post('/notifications/send-otp', { email }),
  sendBookingConfirmation: (bookingData) => api.post('/notifications/booking-confirmation', bookingData),
  sendAppointmentReminder: (appointmentId) => api.post('/notifications/appointment-reminder', { appointmentId }),
  sendStatusUpdate: (userId, statusData) => api.post('/notifications/status-update', { userId, ...statusData }),
};

export default api;
