const LabOrder = require('../models/LabOrder');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { notifyUser } = require('../utils/notificationService');

// Helper to resolve doctorId from logged-in doctor user
async function getDoctorIdForUser(userId) {
  const doctor = await Doctor.findOne({ user_id: userId }).select('_id');
  return doctor?._id;
}

// POST /api/labs  (doctor creates lab order)
exports.createOrder = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctorId = await getDoctorIdForUser(doctorUserId);
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor profile not found for this user' });
    }

    const { patientId, testName, notes } = req.body;
    if (!patientId || !testName) {
      return res.status(400).json({ error: 'patientId and testName are required' });
    }

    const order = await LabOrder.create({
      patientId,
      doctorId,
      testName,
      notes,
    });

    res.status(201).json({ message: 'Lab order created', order });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create lab order' });
  }
};

// PATCH /api/labs/:id  (doctor updates status / results)
exports.updateOrder = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctorId = await getDoctorIdForUser(doctorUserId);
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor profile not found for this user' });
    }

    const { id } = req.params;
    const { status, resultUrl, notes } = req.body;

    const order = await LabOrder.findOne({ _id: id, doctorId });
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found for this doctor' });
    }

    const oldStatus = order.status;
    if (status) order.status = status;
    if (typeof resultUrl === 'string') order.resultUrl = resultUrl;
    if (typeof notes === 'string') order.notes = notes;

    await order.save();

    // Notify patient if status changed
    if (status && status !== oldStatus) {
      try {
        const patient = await User.findById(order.patientId);
        const subject = 'Lab Order Status Update';
        const text = `Your lab order for ${order.testName} status changed to ${status}.`;
        await notifyUser({
          email: patient?.email,
          phone: patient?.phone,
          subject,
          text,
        });
      } catch (e) {
        console.log('Notification failed (lab update):', e.message);
      }
    }

    res.json({ message: 'Lab order updated', order });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update lab order' });
  }
};

// GET /api/labs/mine  (patient views own lab orders)
exports.listForPatient = async (req, res) => {
  try {
    const patientId = req.user.id;
    const orders = await LabOrder.find({ patientId })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load lab orders' });
  }
};

// GET /api/labs/doctor/mine  (doctor views own lab orders)
exports.listForDoctor = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctorId = await getDoctorIdForUser(doctorUserId);
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor profile not found for this user' });
    }

    const orders = await LabOrder.find({ doctorId })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load lab orders' });
  }
};

// PATCH /api/labs/:id/upload-result  (patient uploads result)
exports.uploadResult = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    const order = await LabOrder.findOne({ _id: id, patientId });
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found for this patient' });
    }

    if (req.file) {
      order.resultUrl = `/uploads/${req.file.filename}`;
      order.status = 'completed';
      await order.save();

      // Notify doctor that result is uploaded
      try {
        const doctor = await Doctor.findById(order.doctorId).populate('user_id');
        const patient = await User.findById(order.patientId);
        const subject = 'Lab Result Uploaded';
        const text = `${patient?.name} uploaded result for ${order.testName}.`;
        await notifyUser({
          email: doctor?.user_id?.email,
          phone: doctor?.user_id?.phone,
          subject,
          text,
        });
      } catch (e) {
        console.log('Notification failed (result upload):', e.message);
      }
    }

    res.json({ message: 'Result uploaded', order });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to upload result' });
  }
};

// Lab views orders
exports.listForLab = async (req, res) => {
  try {
    const orders = await LabOrder.find({ status: { $in: ['ordered', 'in-progress'] } })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load lab orders' });
  }
};

// Lab updates status
exports.labUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Status updated', order });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update status' });
  }
};

// Lab uploads result
exports.labUploadResult = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    if (req.file) {
      order.resultUrl = `/uploads/${req.file.filename}`;
      order.status = 'completed';
      await order.save();

      // Notify patient and doctor
      try {
        const patient = await User.findById(order.patientId);
        const doctor = await Doctor.findById(order.doctorId).populate('user_id');
        const subject = 'Lab Result Completed';
        const text = `Lab result for ${order.testName} is now available.`;
        await notifyUser({
          email: patient?.email,
          phone: patient?.phone,
          subject,
          text,
        });
        await notifyUser({
          email: doctor?.user_id?.email,
          phone: doctor?.user_id?.phone,
          subject,
          text,
        });
      } catch (e) {
        console.log('Notification failed (lab upload):', e.message);
      }
    }

    res.json({ message: 'Result uploaded by lab', order });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to upload result' });
  }
};


