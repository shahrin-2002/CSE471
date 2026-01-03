# Healthcare System - Booking Features Documentation

## Overview

This document describes all booking features implemented in the HealthConnect healthcare system, comparing changes from `origin/main` branch.

---

## Table of Contents

1. [ICU Bed Booking](#1-icu-bed-booking)
2. [General Bed Booking](#2-general-bed-booking)
3. [Cabin Booking](#3-cabin-booking)
4. [Doctor Appointment Booking](#4-doctor-appointment-booking)
5. [Online vs In-Person Appointments](#5-online-vs-in-person-appointments)
6. [API Endpoints Summary](#6-api-endpoints-summary)
7. [Database Models](#7-database-models)

---

## 1. ICU Bed Booking

### Description
Allows patients to search for ICU beds across hospitals in Dhaka, book available beds, or join a waitlist when no beds are available.

### Features
- **Location-based filtering**: Filter hospitals by Dhaka sub-areas (Mohammadpur, Dhanmondi, Gulshan, etc.)
- **Hospital search**: Search for specific hospitals by name
- **Real-time availability**: Shows total, available, and booked ICU counts
- **Pricing display**: Shows price per day in BDT (Taka)
- **Direct booking**: Book available ICU beds with patient details
- **Waitlist system**: Join waitlist when no beds available, with position tracking
- **Email notifications**: Confirmation emails on booking, waitlist notifications when beds become available
- **Booking management**: View and cancel bookings

### Files

**Frontend:**
- `client/src/pages/ICUBooking.js` - Main booking page component
- `client/src/styles/ICU.css` - Styles for booking pages
- `client/src/services/api.js` - API client (`icuAPI`)

**Backend:**
- `routes/icuRoutes.js` - Express routes
- `controllers/icuController.js` - Business logic
- `models/ICU.js` - ICU availability per hospital
- `models/ICUBooking.js` - Booking records
- `models/ICUWaitlist.js` - Waitlist entries

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/icu` | No | Get all hospitals with ICU (with filters) |
| GET | `/api/icu/locations` | No | Get available locations |
| GET | `/api/icu/hospital/:hospitalId` | No | Get ICU details for specific hospital |
| POST | `/api/icu/book` | Yes | Book an ICU bed |
| POST | `/api/icu/waitlist` | Yes | Join ICU waitlist |
| GET | `/api/icu/my-bookings` | Yes | Get user's ICU bookings |
| GET | `/api/icu/my-waitlist` | Yes | Get user's waitlist entries |
| DELETE | `/api/icu/booking/:bookingId` | Yes | Cancel ICU booking |

### Booking Flow
1. User browses hospitals with ICU availability
2. If beds available: Fill booking form (check-in date, patient name, phone, notes)
3. If no beds: Join waitlist with email for notification
4. Confirmation email sent on successful booking
5. When booking cancelled, next person in waitlist is notified via email

---

## 2. General Bed Booking

### Description
Allows patients to book general (non-ICU) hospital beds with the same functionality as ICU booking.

### Features
- Same features as ICU booking (filtering, search, waitlist, emails)
- Typically lower pricing than ICU beds
- Separate availability tracking from ICU

### Files

**Frontend:**
- `client/src/pages/GeneralBedBooking.js` - Main booking page
- Uses shared `client/src/styles/ICU.css` styles
- `client/src/services/api.js` - API client (`generalBedAPI`)

**Backend:**
- `routes/generalBedRoutes.js` - Express routes
- `controllers/generalBedController.js` - Business logic
- `models/GeneralBed.js` - Bed availability per hospital
- `models/GeneralBedBooking.js` - Booking records

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/general-bed` | No | Get all hospitals with beds |
| GET | `/api/general-bed/locations` | No | Get available locations |
| GET | `/api/general-bed/hospital/:hospitalId` | No | Get bed details for hospital |
| POST | `/api/general-bed/book` | Yes | Book a general bed |
| POST | `/api/general-bed/waitlist` | Yes | Join bed waitlist |
| GET | `/api/general-bed/my-bookings` | Yes | Get user's bed bookings |
| DELETE | `/api/general-bed/booking/:bookingId` | Yes | Cancel bed booking |

---

## 3. Cabin Booking

### Description
Allows patients to book private hospital cabins (rooms) with premium amenities.

### Features
- Same features as ICU/General Bed booking
- Premium pricing for private accommodation
- Private room with additional facilities

### Files

**Frontend:**
- `client/src/pages/CabinBooking.js` - Main booking page
- Uses shared `client/src/styles/ICU.css` styles
- `client/src/services/api.js` - API client (`cabinAPI`)

**Backend:**
- `routes/cabinRoutes.js` - Express routes
- `controllers/cabinController.js` - Business logic
- `models/Cabin.js` - Cabin availability per hospital
- `models/CabinBooking.js` - Booking records

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cabin` | No | Get all hospitals with cabins |
| GET | `/api/cabin/locations` | No | Get available locations |
| GET | `/api/cabin/hospital/:hospitalId` | No | Get cabin details for hospital |
| POST | `/api/cabin/book` | Yes | Book a cabin |
| POST | `/api/cabin/waitlist` | Yes | Join cabin waitlist |
| GET | `/api/cabin/my-bookings` | Yes | Get user's cabin bookings |
| DELETE | `/api/cabin/booking/:bookingId` | Yes | Cancel cabin booking |

---

## 4. Doctor Appointment Booking

### Description
Allows patients to book appointments with doctors, supporting both in-person and online appointment types.

### Features
- **Doctor search**: Search doctors by name or specialization
- **Real-time slot availability**: View available time slots for selected date
- **Appointment types**: Choose between in-person or online appointments
- **Slot capacity**: Each slot has a configurable capacity (default: 5)
- **Waitlist**: Auto-waitlist when slot capacity is full
- **Rescheduling**: Patients can reschedule to different dates
- **Cancellation**: Cancel appointments with automatic waitlist promotion
- **Status tracking**: booked, approved, cancelled, rescheduled, waitlisted, completed

### Files

**Frontend:**
- `client/src/pages/DoctorSearch.js` - Doctor search with slot booking
- `client/src/pages/PatientAppointments.js` - Patient's appointments view
- `client/src/pages/DoctorSlots.js` - Doctor's appointment management
- `client/src/pages/DoctorOnlineAppointments.js` - Doctor's online appointments view
- `client/src/services/api.js` - API client (`appointmentsAPI`, `doctorAPI`)

**Backend:**
- `routes/appointmentRoutes.js` - Express routes
- `controllers/appointmentController.js` - Business logic
- `models/Appointment.js` - Appointment records
- `models/slot.js` - Time slot records

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointments/book` | Yes | Book an appointment |
| PATCH | `/api/appointments/:id/reschedule` | Yes | Reschedule appointment |
| DELETE | `/api/appointments/:id/cancel` | Yes | Cancel appointment |
| GET | `/api/appointments/mine` | Yes | Get patient's appointments |
| GET | `/api/appointments/doctor/:doctorId` | Yes | Get doctor's appointments |
| PATCH | `/api/appointments/:id/approve` | Yes | Doctor approves appointment |
| PATCH | `/api/appointments/:id/complete` | Yes | Mark appointment as completed |
| GET | `/api/doctors/:doctorId/slots` | No | Get available slots for date |

### Appointment Status Flow
```
booked -> approved -> completed
   |          |
   v          v
waitlisted  cancelled
   |
   v
booked (when promoted)
```

### Slot Management
- Slots are created automatically when booking for a new date
- Each slot has a capacity limit (default: 5 appointments)
- When capacity is reached, new bookings are added to waitlist
- Cancelled appointments automatically promote next waitlisted patient

---

## 5. Online vs In-Person Appointments

### Appointment Types

| Type | Value | Description |
|------|-------|-------------|
| In-Person | `in-person` | Patient visits hospital/clinic |
| Online | `online` | Remote consultation (video call ready) |

### Frontend Selection
In `DoctorSearch.js`, users can select appointment type:
```javascript
<select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)}>
  <option value="in-person">In-Person Visit</option>
  <option value="online">Online Video Call</option>
</select>
```

### Backend Model
In `models/Appointment.js`:
```javascript
type: {
  type: String,
  enum: ['online', 'in-person'],
  default: 'in-person'
}
```

### Doctor Views
- `DoctorSlots.js`: Shows all appointments with type indicator
- `DoctorOnlineAppointments.js`: Filters and shows only online appointments

---

## 6. API Endpoints Summary

### Public Endpoints (No Auth Required)

| Endpoint | Description |
|----------|-------------|
| GET `/api/icu` | List hospitals with ICU |
| GET `/api/icu/locations` | List ICU locations |
| GET `/api/icu/hospital/:id` | Get hospital ICU details |
| GET `/api/general-bed` | List hospitals with beds |
| GET `/api/general-bed/locations` | List bed locations |
| GET `/api/general-bed/hospital/:id` | Get hospital bed details |
| GET `/api/cabin` | List hospitals with cabins |
| GET `/api/cabin/locations` | List cabin locations |
| GET `/api/cabin/hospital/:id` | Get hospital cabin details |
| GET `/api/doctors/:id/slots` | Get doctor's available slots |

### Protected Endpoints (Auth Required)

| Endpoint | Description |
|----------|-------------|
| POST `/api/icu/book` | Book ICU |
| POST `/api/icu/waitlist` | Join ICU waitlist |
| GET `/api/icu/my-bookings` | User's ICU bookings |
| GET `/api/icu/my-waitlist` | User's ICU waitlist |
| DELETE `/api/icu/booking/:id` | Cancel ICU booking |
| POST `/api/general-bed/book` | Book general bed |
| POST `/api/general-bed/waitlist` | Join bed waitlist |
| GET `/api/general-bed/my-bookings` | User's bed bookings |
| DELETE `/api/general-bed/booking/:id` | Cancel bed booking |
| POST `/api/cabin/book` | Book cabin |
| POST `/api/cabin/waitlist` | Join cabin waitlist |
| GET `/api/cabin/my-bookings` | User's cabin bookings |
| DELETE `/api/cabin/booking/:id` | Cancel cabin booking |
| POST `/api/appointments/book` | Book appointment |
| PATCH `/api/appointments/:id/reschedule` | Reschedule |
| DELETE `/api/appointments/:id/cancel` | Cancel appointment |
| GET `/api/appointments/mine` | User's appointments |
| GET `/api/appointments/doctor/:id` | Doctor's appointments |
| PATCH `/api/appointments/:id/approve` | Approve appointment |
| PATCH `/api/appointments/:id/complete` | Complete appointment |

---

## 7. Database Models

### ICU Model
```javascript
{
  hospital_id: ObjectId (ref: Hospital),
  total_icu: Number,
  available_icu: Number,
  booked_icu: Number,
  price_per_day: Number
}
```

### ICUBooking Model
```javascript
{
  icu_id: ObjectId (ref: ICU),
  hospital_id: ObjectId (ref: Hospital),
  patient_id: ObjectId (ref: User),
  patient_name: String,
  patient_phone: String,
  booking_date: Date,
  check_in_date: Date,
  check_out_date: Date,
  notes: String,
  status: 'booked' | 'checked_in' | 'checked_out' | 'cancelled'
}
```

### Appointment Model
```javascript
{
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: Doctor),
  slotId: ObjectId (ref: Slot),
  date: Date,
  status: 'booked' | 'approved' | 'cancelled' | 'rescheduled' | 'waitlisted' | 'completed',
  type: 'online' | 'in-person',
  notes: String,
  promotedAt: Date
}
```

### Slot Model
```javascript
{
  doctorId: ObjectId (ref: Doctor),
  date: Date,
  capacity: Number (default: 5),
  appointments: [ObjectId] (ref: Appointment),
  waitlist: [ObjectId] (ref: User)
}
```

---

## Changes from origin/main

### New Files Added

**Backend:**
- `routes/icuRoutes.js`
- `routes/generalBedRoutes.js`
- `routes/cabinRoutes.js`
- `controllers/icuController.js`
- `controllers/generalBedController.js`
- `controllers/cabinController.js`
- `models/ICU.js`
- `models/ICUBooking.js`
- `models/ICUWaitlist.js`
- `models/GeneralBed.js`
- `models/GeneralBedBooking.js`
- `models/Cabin.js`
- `models/CabinBooking.js`

**Frontend:**
- `client/src/pages/ICUBooking.js`
- `client/src/pages/GeneralBedBooking.js`
- `client/src/pages/CabinBooking.js`
- `client/src/pages/DoctorOnlineAppointments.js`
- `client/src/styles/ICU.css`

### Modified Files

**Backend:**
- `server.js` - Added new route registrations
- `routes/appointmentRoutes.js` - Added approve/complete endpoints
- `controllers/appointmentController.js` - Added status management

**Frontend:**
- `client/src/services/api.js` - Added icuAPI, generalBedAPI, cabinAPI
- `client/src/pages/DoctorSearch.js` - Added slot availability and appointment type selection
- `client/src/pages/PatientAppointments.js` - Added appointment type display
- `client/src/pages/DoctorSlots.js` - Added approve/complete functionality

### Removed/Disabled Features
- Video Call (WebRTC) - Commented out, to be implemented later
  - `videoCallRoutes.js` - Disabled in server.js
  - `VideoCallModal.js` - Deleted
  - `videoCallAPI` - Removed from api.js

---

## Navigation Structure

The booking system is accessible via navigation dropdown:
```
Booking ▼
  ├── ICU (/booking/icu)
  ├── General Bed (/booking/general-bed)
  └── Cabin (/booking/cabin)
```

Doctor appointments are booked via:
- `/doctors` - Doctor search with slot booking
- `/appointments` - View/manage patient appointments

---

## Email Notifications

The system sends emails for:
1. **Booking Confirmation** - When ICU/bed/cabin is booked
2. **Waitlist Notification** - When a bed becomes available
3. **Appointment Reminders** - (To be implemented)

Email service is configured via `utils/emailService.js` using environment variables.

---

*Documentation generated for CSE471 Healthcare System Project*
