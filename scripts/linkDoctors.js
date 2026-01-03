const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const hospital = await Hospital.findOne();
  const doctorUsers = await User.find({ role: 'doctor' });

  for (const user of doctorUsers) {
    const existing = await Doctor.findOne({ user_id: user._id });
    if (!existing) {
      await Doctor.create({
        user_id: user._id,
        hospital_id: hospital._id,
        name: user.name,
        specialization: 'General Medicine',
        email: user.email,
        phone: user.phone || '01700000000'
      });
      console.log('Linked:', user.email);
    } else {
      console.log('Already linked:', user.email);
    }
  }

  console.log('Done!');
  await mongoose.connection.close();
}

run();
