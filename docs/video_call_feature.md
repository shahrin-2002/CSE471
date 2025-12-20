# Healthcare System - Video Call Feature Documentation

## Overview

This document describes the WebRTC video call feature implemented in the HealthConnect healthcare system, enabling real-time video consultations between doctors and patients for online appointments.

---

## Table of Contents

1. [Feature Description](#1-feature-description)
2. [User Flow](#2-user-flow)
3. [Technical Architecture](#3-technical-architecture)
4. [Files Structure](#4-files-structure)
5. [Socket Events](#5-socket-events)
6. [WebRTC Flow](#6-webrtc-flow)
7. [Setup & Configuration](#7-setup--configuration)
8. [API & Services](#8-api--services)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Feature Description

The video call feature allows doctors to conduct live video consultations with patients who have booked **online appointments**.

### Key Features
- **Real-time video/audio** using WebRTC peer-to-peer connection
- **Socket.io signaling** for call initiation and WebRTC handshake
- **Call notifications** - Patient receives incoming call alert
- **Call controls** - Mute audio, hide video, end call
- **Global socket connection** - Works from any page when logged in
- **Real-time status sync** - Appointment completion updates instantly

---

## 2. User Flow

### Doctor's Flow
1. Login as doctor
2. Navigate to **Online Appointments** page (`/doctor/online-appointments`)
3. View list of online appointments
4. Click **"Start Call"** on an appointment
5. Wait for patient to accept (shows "Waiting for patient...")
6. When patient clicks "Ready", button changes to **"Patient Ready - Join Call"**
7. Click to join → Video call modal opens
8. Conduct consultation
9. Click **"End Call"** when done
10. Click **"Mark as Completed"** to complete the appointment

### Patient's Flow
1. Login as patient
2. Can be on **any page** (socket connects globally on login)
3. When doctor initiates call → **Incoming call notification** appears
4. Click **"Ready"** to accept or **"Decline"** to reject
5. If accepted → Video call modal opens
6. Participate in consultation
7. Either party can end the call

---

## 3. Technical Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Doctor's      │         │    Backend      │         │   Patient's     │
│   Browser       │         │    Server       │         │   Browser       │
│                 │         │                 │         │                 │
│  React App      │◄───────►│  Express.js     │◄───────►│  React App      │
│  + Socket.io    │   WS    │  + Socket.io    │   WS    │  + Socket.io    │
│  + WebRTC       │         │  (Signaling)    │         │  + WebRTC       │
│                 │         │                 │         │                 │
└────────┬────────┘         └─────────────────┘         └────────┬────────┘
         │                                                       │
         │                  WebRTC Peer Connection               │
         └───────────────────────────────────────────────────────┘
                            (Direct Video/Audio)
```

### Components
- **Socket.io**: Real-time signaling for call events and WebRTC handshake
- **WebRTC**: Peer-to-peer video/audio streaming
- **STUN Servers**: Google's public STUN servers for NAT traversal

---

## 4. Files Structure

### Backend

| File | Purpose |
|------|---------|
| `server.js` | Socket.io server integration, JWT auth middleware, call event handlers |

**Key additions to server.js:**
- HTTP server wrapping Express for Socket.io
- Socket.io with CORS configuration
- JWT authentication middleware for sockets
- In-memory storage: `userSockets` (userId → socketId), `activeCalls` (appointmentId → call state)
- Event handlers for call signaling and WebRTC

### Frontend

| File | Purpose |
|------|---------|
| `client/src/services/socket.js` | Socket.io client service (singleton) |
| `client/src/services/webrtc.js` | WebRTC peer connection helper |
| `client/src/components/VideoCallModal.js` | Video call UI component |
| `client/src/components/VideoCallModal.css` | Video call styles |
| `client/src/context/AuthContext.js` | Global socket connection on login |
| `client/src/pages/DoctorOnlineAppointments.js` | Doctor's call initiation UI |
| `client/src/pages/PatientAppointments.js` | Patient's incoming call handling |
| `client/src/PatientAppointment.css` | Incoming call notification styles |
| `client/src/pages/DoctorOnlineAppointments.css` | Call button styles |

---

## 5. Socket Events

### Call Signaling Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `call:initiate` | Client → Server | `{appointmentId, patientId}` | Doctor initiates call |
| `call:incoming` | Server → Client | `{appointmentId, doctorId, doctorName}` | Patient receives call notification |
| `call:ready` | Client → Server | `{appointmentId, doctorId}` | Patient confirms ready |
| `call:patient-ready` | Server → Client | `{appointmentId}` | Doctor notified patient is ready |
| `call:decline` | Client → Server | `{appointmentId, doctorId}` | Patient declines call |
| `call:declined` | Server → Client | `{appointmentId}` | Doctor notified of decline |
| `call:end` | Client → Server | `{appointmentId}` | Either party ends call |
| `call:ended` | Server → Client | `{appointmentId, endedBy}` | Notify other party call ended |
| `call:error` | Server → Client | `{message}` | Error notification |

### WebRTC Signaling Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `webrtc:offer` | Client → Server → Client | `{targetUserId, offer}` | SDP offer from doctor |
| `webrtc:answer` | Client → Server → Client | `{targetUserId, answer}` | SDP answer from patient |
| `webrtc:ice-candidate` | Client → Server → Client | `{targetUserId, candidate}` | ICE candidate exchange |

### Appointment Sync Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `appointment:status-update` | Client → Server | `{appointmentId, patientId, status}` | Doctor marks appointment complete |
| `appointment:updated` | Server → Client | `{appointmentId, status}` | Patient notified of status change |

---

## 6. WebRTC Flow

```
DOCTOR                         SERVER                         PATIENT
   |                              |                              |
   |== CALL INITIATION ===========|==============================|
   |-- call:initiate ------------>|                              |
   |                              |-- call:incoming ------------>|
   |                              |                              |
   |                              |<--------- call:ready --------|
   |<-- call:patient-ready -------|                              |
   |                              |                              |
   |== WEBRTC HANDSHAKE ==========|==============================|
   |                              |                              |
   | [Initialize WebRTC]          |          [Initialize WebRTC] |
   | [Get local media stream]     |        [Get local media stream]
   |                              |                              |
   |-- webrtc:offer ------------->|-- webrtc:offer ------------->|
   |   (SDP offer)                |                              |
   |                              |                              |
   |                              |<-------- webrtc:answer ------|
   |<-- webrtc:answer ------------|   (SDP answer)               |
   |                              |                              |
   |<-- webrtc:ice-candidate ---->|<-- webrtc:ice-candidate ---->|
   |   (ICE candidates)           |   (ICE candidates)           |
   |                              |                              |
   |== PEER CONNECTION ESTABLISHED ==============================|
   |                              |                              |
   |<=============== Direct Video/Audio Stream =================>|
   |                              |                              |
   |== CALL END ==================|==============================|
   |-- call:end ----------------->|                              |
   |                              |-- call:ended --------------->|
```

### WebRTC Configuration

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

---

## 7. Setup & Configuration

### Dependencies

**Backend (package.json):**
```json
{
  "socket.io": "^4.x"
}
```

**Frontend (client/package.json):**
```json
{
  "socket.io-client": "^4.x"
}
```

### Environment Variables

**Backend (.env):**
```
PORT=9358
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
```

**Frontend (client/.env) - For cross-device testing:**
```
REACT_APP_API_URL=http://<SERVER_IP>:9358/api
REACT_APP_SOCKET_URL=http://<SERVER_IP>:9358
```

### Cross-Device Setup

1. Run backend on one machine only
2. Find the server's IP address:
   - Windows: `ipconfig` → IPv4 Address
   - Mac/Linux: `ifconfig` → inet
3. Create `client/.env` on all devices with server IP
4. Ensure devices are on the same WiFi network
5. Allow port 9358 through firewall (Windows):
   ```cmd
   netsh advfirewall firewall add rule name="Node Server" dir=in action=allow protocol=TCP localport=9358
   ```

---

## 8. API & Services

### Socket Service (socket.js)

```javascript
import socketService from '../services/socket';

// Connection (handled automatically in AuthContext)
socketService.connect(token);
socketService.disconnect();

// Call methods
socketService.initiateCall(appointmentId, patientId);
socketService.confirmReady(appointmentId, doctorId);
socketService.declineCall(appointmentId, doctorId);
socketService.endCall(appointmentId);

// WebRTC signaling
socketService.sendOffer(targetUserId, offer);
socketService.sendAnswer(targetUserId, answer);
socketService.sendIceCandidate(targetUserId, candidate);

// Event listeners
socketService.onIncomingCall(callback);
socketService.onPatientReady(callback);
socketService.onCallDeclined(callback);
socketService.onWebRTCOffer(callback);
socketService.onWebRTCAnswer(callback);
socketService.onIceCandidate(callback);
socketService.onCallEnded(callback);
```

### WebRTC Service (webrtc.js)

```javascript
import webrtcService from '../services/webrtc';

// Initialize and get streams
const { localStream, remoteStream } = await webrtcService.initialize();

// Doctor creates offer
const offer = await webrtcService.createOffer();

// Patient handles offer and creates answer
const answer = await webrtcService.handleOffer(offer);

// Doctor handles answer
await webrtcService.handleAnswer(answer);

// ICE candidates
await webrtcService.addIceCandidate(candidate);
webrtcService.onIceCandidate((candidate) => { ... });

// Controls
webrtcService.toggleAudio(enabled);
webrtcService.toggleVideo(enabled);

// Cleanup
webrtcService.cleanup();
```

---

## 9. Troubleshooting

### "Patient is not online" Error

**Cause:** Patient's socket is not connected or IDs don't match.

**Solutions:**
1. Ensure patient is logged in (socket connects on login)
2. Check server logs for connected users
3. Verify both connecting to the same server (not separate localhost instances)

### WebSocket Connection Failed

**Cause:** Firewall blocking or wrong server address.

**Solutions:**
1. Check `client/.env` has correct server IP
2. Allow port 9358 through firewall
3. Ensure same WiFi network for local testing
4. Try ngrok for cross-network testing

### Video Not Showing

**Cause:** Camera permissions denied or WebRTC issue.

**Solutions:**
1. Allow camera/microphone permissions in browser
2. Use HTTPS in production (WebRTC requires secure context)
3. Check browser console for WebRTC errors

### Call Not Connecting

**Cause:** ICE candidate exchange failed.

**Solutions:**
1. Check if both peers receive ICE candidates
2. Verify STUN servers are accessible
3. For restrictive networks, may need TURN server

---

## Navigation Structure

```
Doctor Routes:
  /doctor/online-appointments → DoctorOnlineAppointments (Video call initiation)

Patient Routes:
  /appointments → PatientAppointments (Incoming call notifications)
  (Calls can be received from any page due to global socket connection)
```

---

## Security Considerations

1. **JWT Authentication**: Socket connections require valid JWT token
2. **Appointment Verification**: Server verifies appointment exists and is online type
3. **User Matching**: Only the specific patient for an appointment receives call
4. **Peer-to-Peer**: Video/audio streams go directly between browsers (not through server)

---

## Future Enhancements

- [ ] Add TURN server for restricted network support
- [ ] Screen sharing capability
- [ ] Chat during video call
- [ ] Call recording (with consent)
- [ ] Call quality indicators
- [ ] Reconnection handling for dropped connections
- [ ] Push notifications for incoming calls (mobile)

---

*Documentation generated for CSE471 Healthcare System Project*
