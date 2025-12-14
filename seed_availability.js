// seed_availability.js
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();

const defaultSchedule = [
  { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Saturday', startTime: '00:00', endTime: '00:00', isAvailable: false },
  { day: 'Sunday', startTime: '00:00', endTime: '00:00', isAvailable: false },
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB...');
    const res = await Doctor.updateMany(
      {}, 
      { $set: { availability: defaultSchedule, slotDuration: 30 } }
    );
    console.log(`✅ Updated ${res.modifiedCount} doctors with default schedule.`);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });