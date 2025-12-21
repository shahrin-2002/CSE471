const AmbulanceBooking = require('../models/AmbulanceBooking');

// Mock Routing API function
const calculateETA = (pickup, ambulanceLocation) => {
  // In a real app, call Google Maps API here
  return Math.floor(Math.random() * 20 + 5) + " mins"; 
};

exports.bookAmbulance = async (req, res) => {
  try {
    const { type, location } = req.body; // location = { address, lat, lng }
    
    // 1. Create Booking
    const booking = await AmbulanceBooking.create({
      userId: req.user.id,
      type,
      pickupLocation: location,
      status: 'pending'
    });

    // 2. Simulate Dispatch System (Finding nearby ambulance)
    setTimeout(async () => {
      // Mock finding an ambulance
      const eta = calculateETA(location, null);
      
      booking.status = 'assigned';
      booking.eta = eta;
      booking.ambulanceId = "AMB-" + Math.floor(Math.random() * 1000);
      await booking.save();

      // Emit Socket Event to User
      const io = req.app.get('io'); // Get IO from app instance
      // Note: You need a way to map userId to socketId (e.g., from your existing userSockets map if exported, or broadcast to room)
      // For now, assuming client joins room `user_${req.user.id}`
      io.emit(`ambulance_update_${req.user.id}`, booking); 
      
    }, 5000); // Simulate 5s delay

    res.status(201).json({ success: true, bookingId: booking._id, message: "Request received. Finding ambulance..." });

  } catch (error) {
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