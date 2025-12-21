const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

exports.createPrescription = async (req, res) => {
  console.log('--- STARTING PRESCRIPTION GENERATION ---');
  console.log('Request Body:', req.body);
  console.log('User ID from Token:', req.user.id);

  try {
    const { appointmentId, medications, diagnosis, notes } = req.body;
    let { patientId } = req.body;

    // 1. Find the Doctor profile
    const doctor = await Doctor.findOne({ user_id: req.user.id }).populate('hospital_id');
    
    if (!doctor) {
      console.error('❌ Error: Doctor profile not found for user', req.user.id);
      return res.status(404).json({ error: 'Doctor profile not found. Are you registered as a doctor?' });
    }
    console.log('✅ Doctor Found:', doctor.name);

    // 2. Handle Missing Patient ID (For Testing)
    if (!patientId) {
      console.log('⚠️ No Patient ID provided. Using a dummy/random patient for testing.');
      // Try to find ANY patient to use as a placeholder
      const dummyPatient = await User.findOne({ role: 'patient' });
      if (dummyPatient) {
        patientId = dummyPatient._id;
        console.log('✅ Using Dummy Patient:', dummyPatient.name);
      } else {
        // If no patients exist, use the doctor's user ID temporarily
        patientId = req.user.id;
        console.log('⚠️ No patients found in DB. Using Doctor user ID as Patient.');
      }
    }

    // 3. Generate unique verification code
    const verificationCode = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 4. Create DB Entry
    const prescription = await Prescription.create({
      doctorId: doctor._id,
      patientId,
      appointmentId,
      medications,
      diagnosis,
      notes,
      verificationCode
    });
    console.log('✅ Database Entry Created:', prescription._id);

    // 5. Fetch patient details for PDF
    const patient = await User.findById(patientId);
    const patientName = patient ? patient.name : 'Valued Patient';

    // 6. Generate QR Code
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${verificationCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    // 7. Generate PDF
    const doc = new PDFDocument();
    const filename = `prescription-${prescription._id}.pdf`;
    
    // FIX: Ensure path is correct relative to this controller file
    // CSE471/controllers/ -> ../client/public/prescriptions
    const pdfFolder = path.join(__dirname, '../client/public/prescriptions'); 
    
    if (!fs.existsSync(pdfFolder)) {
      console.log('📂 Creating folder:', pdfFolder);
      fs.mkdirSync(pdfFolder, { recursive: true });
    }

    const pdfPath = path.join(pdfFolder, filename);
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // --- PDF DESIGN ---
    doc.fontSize(20).text(doctor.hospital_id?.name || 'HealthConnect Hospital', { align: 'center' });
    doc.fontSize(10).text(doctor.hospital_id?.location || 'Dhaka, Bangladesh', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Dr. ${doctor.name}`, { align: 'left' });
    doc.fontSize(10).text(`${doctor.specialization}`, { align: 'left' });
    doc.moveDown();

    doc.text(`Patient: ${patientName}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    doc.fontSize(16).font('Helvetica-Bold').text('Rx', { underline: true });
    doc.font('Helvetica');
    
    if (medications && Array.isArray(medications)) {
      medications.forEach((med, i) => {
        doc.fontSize(12).text(`${i+1}. ${med.drug || ''} ${med.dosage || ''}`);
        doc.fontSize(10).text(`    ${med.frequency || ''} - ${med.duration || ''}`, { color: 'gray' });
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);
    doc.fontSize(12).text(`Diagnosis: ${diagnosis || 'N/A'}`);
    doc.fontSize(12).text(`Notes: ${notes || 'N/A'}`);

    // QR Code
    doc.image(qrCodeDataUrl, 450, 650, { width: 80 });
    doc.fontSize(8).text('Scan to Verify', 455, 735);
    
    doc.end();

    writeStream.on('finish', async () => {
      console.log('✅ PDF Generated Successfully:', filename);
      // Update DB with the public URL path
      prescription.pdfPath = `/prescriptions/${filename}`;
      await prescription.save();
      res.status(201).json({ success: true, prescription });
    });

    writeStream.on('error', (err) => {
      console.error('❌ PDF Write Error:', err);
      res.status(500).json({ error: 'Failed to write PDF file' });
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id).populate('doctorId patientId');
    if (!prescription) return res.status(404).json({ error: 'Not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};