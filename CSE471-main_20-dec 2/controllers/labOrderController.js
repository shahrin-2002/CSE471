const LabOrder = require('../models/LabOrder');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendLabResultNotification } = require('../utils/notificationService');

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

    // Populate patient and doctor names for response
    await order.populate('patientId', 'name email');
    await order.populate('doctorId', 'name');

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

    // Populate patient and doctor names for response
    await order.populate('patientId', 'name email');
    await order.populate('doctorId', 'name');

    // Notify patient if status changed (EMAIL DISABLED)
    // if (status && status !== oldStatus) {
    //   try {
    //     const patient = await User.findById(order.patientId);
    //     if (patient) {
    //       await sendLabResultNotification(patient, order);
    //     }
    //   } catch (e) {
    //     console.log('Notification failed (lab update):', e.message);
    //   }
    // }

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
      .populate('patientId', 'name email')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load lab orders' });
  }
};

// POST /api/lab-orders/submit  (patient submits lab report - creates new order)
exports.submitLabReport = async (req, res) => {
  try {
    const patientId = req.user.id;
    // When using multer, form fields are in req.body
    const { testName, status, doctorId, notes } = req.body;

    console.log('Submit lab report request:', {
      patientId,
      testName,
      status,
      doctorId,
      notes,
      hasFile: !!req.file,
      file: req.file ? req.file.filename : null
    });

    if (!testName || !doctorId) {
      return res.status(400).json({ error: 'testName and doctorId are required' });
    }

    // Validate status
    const validStatuses = ['ordered', 'in-progress', 'completed'];
    const orderStatus = status && validStatuses.includes(status) ? status : 'ordered';

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(400).json({ error: 'Doctor not found' });
    }

    // Create lab order
    const orderData = {
      patientId,
      doctorId,
      testName,
      status: orderStatus,
      notes: notes || '',
    };

    // If file is uploaded, set resultUrl
    if (req.file) {
      orderData.resultUrl = `/uploads/${req.file.filename}`;
      if (orderStatus === 'ordered') {
        orderData.status = 'completed';
      }
    }

    const order = await LabOrder.create(orderData);

    // Populate for response
    await order.populate('doctorId', 'name');
    await order.populate('patientId', 'name email');

    // Notify doctor (EMAIL DISABLED)
    // try {
    //   const doctorUser = await Doctor.findById(doctorId).populate('user_id');
    //   if (doctorUser?.user_id) {
    //     await sendLabResultNotification(doctorUser.user_id, order);
    //   }
    // } catch (e) {
    //   console.log('Notification failed (lab report submission):', e.message);
    // }

    res.status(201).json({ message: 'Lab report submitted successfully', order });
  } catch (err) {
    console.error('Submit lab report error:', err);
    res.status(400).json({ error: err.message || 'Failed to submit lab report' });
  }
};

// GET /api/labs/doctor/mine  (doctor views own lab orders with search and filter)
exports.listForDoctor = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctorId = await getDoctorIdForUser(doctorUserId);
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor profile not found for this user' });
    }

    const { search, status } = req.query;
    let query = { doctorId };

    // Filter by status if provided
    if (status && ['ordered', 'in-progress', 'completed'].includes(status)) {
      query.status = status;
    }

    // Search by patient name
    let orders = await LabOrder.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by patient name if search query provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      orders = orders.filter(order => {
        const patientName = order.patientId?.name || '';
        return patientName.toLowerCase().includes(searchLower);
      });
    }

    res.json({ orders, count: orders.length });
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
    }

    // Populate patient and doctor names for response
    await order.populate('patientId', 'name email');
    await order.populate('doctorId', 'name');

    // Notify doctor that result is uploaded (EMAIL DISABLED)
    // try {
    //   const doctor = await Doctor.findById(order.doctorId).populate('user_id');
    //   if (doctor?.user_id) {
    //     await sendLabResultNotification(doctor.user_id, order);
    //   }
    // } catch (e) {
    //   console.log('Notification failed (result upload):', e.message);
    // }

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

    // Populate patient and doctor names for response
    await order.populate('patientId', 'name email');
    await order.populate('doctorId', 'name');

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
    }

    // Populate patient and doctor names for response
    await order.populate('patientId', 'name email');
    await order.populate('doctorId', 'name');

    // Notify patient and doctor (EMAIL DISABLED)
    // try {
    //   const patient = await User.findById(order.patientId);
    //   const doctor = await Doctor.findById(order.doctorId).populate('user_id');
    //   
    //   if (patient) {
    //     await sendLabResultNotification(patient, order);
    //   }
    //   
    //   if (doctor?.user_id) {
    //     await sendLabResultNotification(doctor.user_id, order);
    //   }
    // } catch (e) {
    //   console.log('Notification failed (lab upload):', e.message);
    // }

    res.json({ message: 'Result uploaded by lab', order });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to upload result' });
  }
};


