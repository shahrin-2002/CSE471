const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');

// Create new record
exports.createRecord = async (req, res) => {
  try {
    // doctorId comes from the authenticated doctor
    const doctorId = req.user.id;

    const record = await MedicalRecord.create({
      ...req.body,
      patientId: req.body.patientId,
      doctorId
    });

    res.status(201).json({ message: 'Record created', record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Patient view own records
exports.listMine = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user.id })
      .populate({
        path: 'doctorId',
        select: 'name specialization hospital_id',
        populate: { path: 'hospital_id', select: 'name city' }
      })
      .lean();

    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Doctor view patient records
exports.listForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await MedicalRecord.find({ patientId })
      .populate({
        path: 'doctorId',
        select: 'name specialization hospital_id',
        populate: { path: 'hospital_id', select: 'name city' }
      })
      .lean();

    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update record
exports.updateRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ message: 'Record updated', record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add attachment (metadata only)
exports.addAttachment = async (req, res) => {
  try {
    const { filename, url } = req.body;
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    record.attachments.push({ filename, url, uploadedAt: new Date() });
    await record.save();

    res.json({ message: 'Attachment added', record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Remove attachment
exports.removeAttachment = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    record.attachments = record.attachments.filter(
      a => a._id.toString() !== req.params.attachmentId
    );
    await record.save();

    res.json({ message: 'Attachment removed', record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
