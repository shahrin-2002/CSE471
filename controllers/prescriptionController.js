const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const sendEmail = require('../utils/emailService'); // 1. Import Email Service

exports.createPrescription = async (req, res) => {
  console.log('--- STARTING PRESCRIPTION GENERATION ---');

  try {
    const { appointmentId, medications, diagnosis, notes } = req.body;
    let { patientId } = req.body;

    // 1. Find the Doctor profile
    const doctor = await Doctor.findOne({ user_id: req.user.id }).populate('hospital_id');
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found.' });

    // 2. Validate/Find Patient
    if (!patientId) {
      // Logic for testing/dummy patient if needed
      const dummyPatient = await User.findOne({ role: 'patient' });
      patientId = dummyPatient ? dummyPatient._id : req.user.id;
    }

    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // 3. Generate Codes & DB Entry
    const verificationCode = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const prescription = await Prescription.create({
      doctorId: doctor._id,
      patientId,
      appointmentId,
      medications,
      diagnosis,
      notes,
      verificationCode
    });

    // 4. Generate PDF
    const doc = new PDFDocument();
    const filename = `prescription-${prescription._id}.pdf`;
    const pdfFolder = path.join(__dirname, '../client/public/prescriptions'); 
    
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
    }

    const pdfPath = path.join(pdfFolder, filename);
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // --- PDF Content ---
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${verificationCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    doc.fontSize(20).text(doctor.hospital_id?.name || 'HealthConnect Hospital', { align: 'center' });
    doc.fontSize(10).text(doctor.hospital_id?.location || 'Dhaka, Bangladesh', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Dr. ${doctor.name}`, { align: 'left' });
    doc.text(`Patient: ${patient.name}`, { align: 'right' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    doc.fontSize(16).font('Helvetica-Bold').text('Rx', { underline: true });
    doc.font('Helvetica');
    
    if (medications && Array.isArray(medications)) {
      medications.forEach((med, i) => {
        doc.fontSize(12).text(`${i+1}. ${med.drug} - ${med.dosage} (${med.frequency})`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.fontSize(12).text(`Diagnosis: ${diagnosis}`);
    doc.text(`Notes: ${notes}`);
    
    doc.image(qrCodeDataUrl, 450, 650, { width: 80 });
    doc.end();

    // 5. On Finish: Save Path AND Send Email
    writeStream.on('finish', async () => {
      console.log('✅ PDF Generated:', filename);
      
      prescription.pdfPath = `/prescriptions/${filename}`;
      await prescription.save();

      // --- NEW EMAIL LOGIC ---
      try {
        console.log(`📧 Sending email to ${patient.email}...`);
        
        await sendEmail({
          to: patient.email, // Send to patient's actual email
          subject: `Prescription from Dr. ${doctor.name} - HealthConnect`,
          text: `Dear ${patient.name},\n\nPlease find attached your digital prescription.\n\nDiagnosis: ${diagnosis}\n\nStay healthy,\nHealthConnect Team`,
          attachments: [
            {
              filename: filename,
              path: pdfPath // Attach the local file
            }
          ]
        });
        console.log('✅ Email sent successfully');
      } catch (emailErr) {
        console.error('❌ Failed to send email:', emailErr.message);
        // We don't fail the request if email fails, just log it
      }

      res.status(201).json({ success: true, prescription });
    });

    writeStream.on('error', (err) => {
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