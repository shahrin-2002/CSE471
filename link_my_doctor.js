const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital'); // We need a dummy hospital
require('dotenv').config();

// 👇 REPLACE THIS WITH YOUR EMAIL
const MY_EMAIL = 'mhdfarukislam1965@gmail.com'; 

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('🔗 Connected to DB');

    // 1. Find the User
    const user = await User.findOne({ email: MY_EMAIL });
    if (!user) {
      console.log('❌ User not found! Check the email.');
      process.exit();
    }
    console.log(`✅ Found User: ${user.name}`);

    // 2. Check if Doctor profile already exists
    const existingDoctor = await Doctor.findOne({ user_id: user._id });
    if (existingDoctor) {
      console.log('⚠️ Doctor profile already exists.');
      process.exit();
    }

    // 3. Find or Create a Dummy Hospital (Required for Doctor)
    let hospital = await Hospital.findOne();
    if (!hospital) {
      hospital = await Hospital.create({
        name: "General City Hospital",
        city: "Dhaka",
        address: "123 Main St",
        phone: "555-0199",
        email: "hospital@test.com"
      });
      console.log('🏥 Created dummy hospital');
    }

    // 4. Create the Doctor Profile
    const newDoctor = await Doctor.create({
      user_id: user._id,
      hospital_id: hospital._id,
      name: user.name,
      specialization: "General Physician", // Default
      consultation_fee: 500,
      availability_status: "Available",
      phone: user.phone || "N/A",
      email: user.email,
      slotDuration: 30,
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Saturday', startTime: '00:00', endTime: '00:00', isAvailable: false },
        { day: 'Sunday', startTime: '00:00', endTime: '00:00', isAvailable: false },
      ]
    });

    console.log(`🎉 Successfully linked Doctor Profile to ${user.name}`);
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });