const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function resetAppointments() {
  await mongoose.connect(process.env.MONGODB_URI);

  const User = require('../models/User');
  const Doctor = require('../models/Doctor');
  const Appointment = require('../models/Appointment');
  const Slot = require('../models/Slot');

  // Delete all appointments
  const deletedAppts = await Appointment.deleteMany({});
  console.log('Deleted', deletedAppts.deletedCount, 'appointments');

  // Find patient and doctor
  const patient = await User.findOne({ email: 'shahriar.sourav@turing.com' });
  const doctorUser = await User.findOne({ email: 'shahrin.abdullah@g.bracu.ac.bd' });
  const doctor = await Doctor.findOne({ user_id: doctorUser._id });

  console.log('Patient:', patient?.name, patient?._id);
  console.log('Doctor User:', doctorUser?.name, doctorUser?._id);
  console.log('Doctor Profile:', doctor?.name, doctor?._id);

  if (!patient || !doctor) {
    console.log('Missing patient or doctor!');
    process.exit(1);
  }

  // Create a slot for the appointment
  const appointmentDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const slot = new Slot({
    doctorId: doctor._id,
    date: appointmentDate,
    capacity: 1
  });
  await slot.save();
  console.log('Created slot:', slot._id);

  // Create new online appointment
  const appointment = new Appointment({
    patientId: patient._id,
    doctorId: doctor._id,
    slotId: slot._id,
    date: appointmentDate,
    type: 'online',
    status: 'approved'
  });

  await appointment.save();
  console.log('Created appointment:', appointment._id);
  console.log('Type:', appointment.type);
  console.log('Status:', appointment.status);

  await mongoose.disconnect();
}

resetAppointments().catch(console.error);
