const axios = require('axios');
const AmbulanceBooking = require('../models/AmbulanceBooking');

// ---------------------------------------------------------
// REAL ROUTING API (OSRM)
// documentation: http://project-osrm.org/docs/v5.5.1/api/
// ---------------------------------------------------------
const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';

// Mock Ambulance Station (e.g., Dhaka Medical College)
const STATION_COORDS = { lat: 23.7258, lng: 90.3976 };

exports.bookAmbulance = async (req, res) => {
  try {
    const { type, location } = req.body; // location includes { lat, lng } from frontend
    
    // 1. Create Initial Booking (Pending)
    const booking = await AmbulanceBooking.create({
      userId: req.user.id,
      type,
      pickupLocation: location,
      status: 'pending'
    });

    res.status(201).json({ 
      success: true, 
      bookingId: booking._id, 
      message: "Request received. Calculating route..." 
    });

    // 2. Calculate Real ETA using OSRM API
    try {
      console.log("[Ambulance] Calculating route via OSRM...");
      
      // OSRM requires format: /lng,lat;lng,lat (Note: Longitude first!)
      const stationStr = `${STATION_COORDS.lng},${STATION_COORDS.lat}`;
      const patientStr = `${location.lng},${location.lat}`;
      const url = `${OSRM_BASE_URL}/${stationStr};${patientStr}?overview=false`;

      const routeResponse = await axios.get(url);

      if (routeResponse.data.code !== 'Ok') {
        throw new Error('Route calculation failed');
      }

      // Extract duration (OSRM returns seconds)
      const durationSeconds = routeResponse.data.routes[0].duration;
      const durationMinutes = Math.ceil(durationSeconds / 60);

      console.log(`[Ambulance] Route found! Drive time: ${durationMinutes} mins`);

      // 3. Update Booking with Real Data
      booking.status = 'assigned';
      booking.ambulanceId = 'AMB-' + Math.floor(Math.random() * 1000); // We still mock the ID
      booking.eta = `${durationMinutes} mins`; // This is now REAL
      
      await booking.save();

      // 4. Notify Frontend
      const io = req.app.get('io');
      io.emit(`ambulance_update_${req.user.id}`, booking);

      // 5. Optional: Simulate Movement Updates
      setTimeout(async () => {
        booking.status = 'arrived';
        booking.eta = '0 mins';
        await booking.save();
        io.emit(`ambulance_update_${req.user.id}`, booking);
      }, durationSeconds * 1000 / 100); // Speed up time for demo (1% of real time)

    } catch (externalError) {
      console.error("[Ambulance] Routing API Failed:", externalError.message);
      // Fallback
      booking.status = 'assigned';
      booking.eta = '15 mins (Est)';
      await booking.save();
      const io = req.app.get('io');
      io.emit(`ambulance_update_${req.user.id}`, booking);
    }

  } catch (error) {
    console.error("[Ambulance] Internal Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findById(req.params.id);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};