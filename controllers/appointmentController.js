const mongoose = require('mongoose');
const Slot = require('../models/slot');
const Appointment = require('../models/appointment');

// Helper: find or create a slot
async function findOrCreateSlot(doctorId, date, capacity = 5) {
  let slot = await Slot.findOne({ doctorId, date });
  if (!slot) {
    slot = await Slot.create({ doctorId, date, capacity, appointments: [], waitlist: [] });
  }
  return slot;
}

// POST /api/appointments/book
exports.book = async (req, res) => {
  const { doctorId, date } = req.body;
  const patientId = req.user.id;

  try {
    let slot = await findOrCreateSlot(doctorId, date);

    if (slot.appointments.length < slot.capacity) {
      const appt = await Appointment.create({ patientId, doctorId, slotId: slot._id, date });
      slot.appointments.push(appt._id);
      await slot.save();
      return res.json({ success: true, status: 'booked', appointment: appt });
    } else {
      if (!slot.waitlist.includes(patientId)) {
        slot.waitlist.push(patientId);
        await slot.save();
      }
      return res.json({ success: true, status: 'waitlisted' });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Booking failed' });
  }
};

// PATCH /api/appointments/:id/reschedule
exports.reschedule = async (req, res) => {
  const { id } = req.params;
  const { doctorId, newDate } = req.body;
  const patientId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appt = await Appointment.findById(id).session(session);
    if (!appt || appt.patientId.toString() !== patientId) {
      throw new Error('Appointment not found or unauthorized');
    }

    // Remove from old slot
    const oldSlot = await Slot.findById(appt.slotId).session(session);
    if (oldSlot) {
      oldSlot.appointments = oldSlot.appointments.filter(a => a.toString() !== appt._id.toString());
      // Promote waitlist if any
      if (oldSlot.waitlist.length > 0) {
        const nextPatient = oldSlot.waitlist.shift();
        const promoted = await Appointment.create([{ 
          patientId: nextPatient, 
          doctorId: appt.doctorId, 
          slotId: oldSlot._id, 
          date: appt.date, 
          status: 'booked', 
          promotedAt: new Date() 
        }], { session });
        oldSlot.appointments.push(promoted[0]._id);
      }
      await oldSlot.save({ session });
    }

    // Book in new slot
    const newSlot = await findOrCreateSlot(doctorId, newDate);
    const hasCapacity = newSlot.appointments.length < newSlot.capacity;

    if (!hasCapacity) {
      if (!newSlot.waitlist.includes(patientId)) {
        newSlot.waitlist.push(patientId);
        await newSlot.save({ session });
      }
      appt.status = 'waitlisted';
      appt.slotId = newSlot._id;
      appt.date = newDate;
      await appt.save({ session });
      await session.commitTransaction();
      return res.json({ success: true, status: 'waitlisted' });
    }

    newSlot.appointments.push(appt._id);
    appt.status = 'rescheduled';
    appt.slotId = newSlot._id;
    appt.date = newDate;
    await Promise.all([newSlot.save({ session }), appt.save({ session })]);

    await session.commitTransaction();
    return res.json({ success: true, status: 'booked', appointment: appt });
  } catch (err) {
    await session.abortTransaction();
    return res.status(400).json({ error: err.message || 'Reschedule failed' });
  } finally {
    session.endSession();
  }
};

// DELETE /api/appointments/:id/cancel
exports.cancel = async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appt = await Appointment.findById(id).session(session);
    if (!appt || appt.patientId.toString() !== patientId) throw new Error('Appointment not found or unauthorized');

    const slot = await Slot.findById(appt.slotId).session(session);
    if (!slot) throw new Error('Slot not found');

    // Remove appointment from slot
    slot.appointments = slot.appointments.filter(a => a.toString() !== appt._id.toString());
    appt.status = 'cancelled';
    await appt.save({ session });

    // Promote waitlisted patient if any
    if (slot.waitlist.length > 0) {
      const nextPatient = slot.waitlist.shift();
      const promoted = await Appointment.create([{ 
        patientId: nextPatient, 
        doctorId: appt.doctorId, 
        slotId: slot._id, 
        date: appt.date, 
        status: 'booked', 
        promotedAt: new Date() 
      }], { session });
      slot.appointments.push(promoted[0]._id);
    }

    await slot.save({ session });
    await session.commitTransaction();
    return res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    return res.status(400).json({ error: err.message || 'Cancel failed' });
  } finally {
    session.endSession();
  }
};

// GET /api/appointments/mine
exports.listMine = async (req, res) => {
  const patientId = req.user.id;
  const appts = await Appointment.find({ patientId })
    .populate('doctorId', 'name email role')
    .lean();
  res.json({ appointments: appts });
};

// GET /api/appointments/doctor/:doctorId
exports.listForDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const appts = await Appointment.find({ doctorId })
    .populate('patientId', 'name email')
    .lean();
  res.json({ appointments: appts });
};
