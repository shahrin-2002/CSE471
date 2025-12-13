/**
 * Seed Script - Populates database with demo hospitals and doctors
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Doctor = require('./models/Doctor');

const hospitals = [
  {
    name: 'Apollo Hospital',
    location: '123 Medical Complex, Banani',
    city: 'Dhaka',
    state: 'Dhaka Division',
    pincode: '1213',
    phone: '01711111111',
    email: 'info@apollo.com.bd',
    specializations: 'Cardiology, Neurology, Orthopedics, Oncology',
    description: 'Apollo Hospital is a leading multi-specialty hospital providing world-class healthcare services.',
    beds_total: 500
  },
  {
    name: 'Square Hospital',
    location: '18/F West Panthapath',
    city: 'Dhaka',
    state: 'Dhaka Division',
    pincode: '1205',
    phone: '01722222222',
    email: 'info@squarehospital.com',
    specializations: 'Cardiology, Gastroenterology, Nephrology, Pediatrics',
    description: 'Square Hospital is one of the most advanced private hospitals in Bangladesh.',
    beds_total: 400
  },
  {
    name: 'United Hospital',
    location: 'Plot 15, Road 71, Gulshan',
    city: 'Dhaka',
    state: 'Dhaka Division',
    pincode: '1212',
    phone: '01733333333',
    email: 'info@uhlbd.com',
    specializations: 'Cardiology, Pulmonology, Dermatology, ENT',
    description: 'United Hospital offers comprehensive healthcare with international standards.',
    beds_total: 450
  },
  {
    name: 'Evercare Hospital',
    location: 'Plot 81, Block E, Bashundhara',
    city: 'Dhaka',
    state: 'Dhaka Division',
    pincode: '1229',
    phone: '01744444444',
    email: 'info@evercarebd.com',
    specializations: 'Oncology, Neurosurgery, Cardiac Surgery, Transplant',
    description: 'Evercare Hospital is a JCI-accredited tertiary care hospital.',
    beds_total: 550
  },
  {
    name: 'Labaid Hospital',
    location: 'House 1, Road 4, Dhanmondi',
    city: 'Dhaka',
    state: 'Dhaka Division',
    pincode: '1205',
    phone: '01755555555',
    email: 'info@labaidgroup.com',
    specializations: 'General Medicine, Surgery, Gynecology, Pediatrics',
    description: 'Labaid Hospital provides quality healthcare at affordable prices.',
    beds_total: 300
  },
  {
    name: 'Ibn Sina Hospital',
    location: 'House 48, Road 9/A, Dhanmondi',
    city: 'Dhaka',
    state: 'Dhaka Division',
    pincode: '1209',
    phone: '01766666666',
    email: 'info@ibnsinatrust.com',
    specializations: 'Cardiology, Orthopedics, Urology, Ophthalmology',
    description: 'Ibn Sina Hospital is a trusted name in healthcare for over 30 years.',
    beds_total: 350
  },
  {
    name: 'Chittagong Medical College Hospital',
    location: 'K.B Fazlul Kader Road',
    city: 'Chittagong',
    state: 'Chittagong Division',
    pincode: '4203',
    phone: '01877777777',
    email: 'info@cmch.gov.bd',
    specializations: 'General Medicine, Surgery, Emergency, Trauma',
    description: 'The largest government hospital in Chittagong division.',
    beds_total: 1000
  },
  {
    name: 'Imperial Hospital',
    location: 'CDA Avenue, Nasirabad',
    city: 'Chittagong',
    state: 'Chittagong Division',
    pincode: '4000',
    phone: '01888888888',
    email: 'info@imperialhospitalctg.com',
    specializations: 'Cardiology, Neurology, Gastroenterology, Oncology',
    description: 'Imperial Hospital is a leading private hospital in Chittagong.',
    beds_total: 250
  }
];

const doctorNames = [
  { name: 'Dr. Md. Rafiqul Islam', specialization: 'Cardiology' },
  { name: 'Dr. Fatima Begum', specialization: 'Neurology' },
  { name: 'Dr. Abdul Karim', specialization: 'Orthopedics' },
  { name: 'Dr. Nasreen Akhter', specialization: 'Oncology' },
  { name: 'Dr. Mohammad Hasan', specialization: 'Gastroenterology' },
  { name: 'Dr. Sultana Rahman', specialization: 'Nephrology' },
  { name: 'Dr. Kamal Uddin', specialization: 'Pediatrics' },
  { name: 'Dr. Rehana Parvin', specialization: 'Gynecology' },
  { name: 'Dr. Shamsul Alam', specialization: 'Pulmonology' },
  { name: 'Dr. Tahmina Khatun', specialization: 'Dermatology' },
  { name: 'Dr. Mizanur Rahman', specialization: 'ENT' },
  { name: 'Dr. Ayesha Siddiqua', specialization: 'Ophthalmology' },
  { name: 'Dr. Jahangir Kabir', specialization: 'Urology' },
  { name: 'Dr. Mahmuda Islam', specialization: 'Psychiatry' },
  { name: 'Dr. Nurul Haque', specialization: 'General Surgery' },
  { name: 'Dr. Farida Yasmin', specialization: 'Internal Medicine' }
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    console.log('Cleared existing data');

    // Insert hospitals
    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`Created ${createdHospitals.length} hospitals`);

    // Create doctors for each hospital
    const doctors = [];
    createdHospitals.forEach((hospital, hIndex) => {
      // Assign 2-3 doctors per hospital
      const numDoctors = 2 + (hIndex % 2);
      for (let i = 0; i < numDoctors; i++) {
        const doctorIndex = (hIndex * 2 + i) % doctorNames.length;
        const doc = doctorNames[doctorIndex];
        doctors.push({
          name: doc.name,
          hospital_id: hospital._id,
          specialization: doc.specialization,
          license_number: `LIC${100000 + hIndex * 10 + i}`,
          experience_years: 5 + (hIndex + i) % 20,
          qualifications: 'MBBS, MD',
          consultation_fee: 500 + (hIndex * 100),
          availability_status: ['Available', 'Available', 'Busy'][i % 3],
          phone: `0171${String(hIndex).padStart(3, '0')}${String(i).padStart(4, '0')}`,
          email: `doctor${hIndex}${i}@hospital.com`
        });
      }
    });

    const createdDoctors = await Doctor.insertMany(doctors);
    console.log(`Created ${createdDoctors.length} doctors`);

    console.log('\nSeed completed successfully!');
    console.log(`- ${createdHospitals.length} hospitals`);
    console.log(`- ${createdDoctors.length} doctors`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
