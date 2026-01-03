/**
 * ICU Data Seeder
 * Seeds ICU data for hospitals in MongoDB
 * Run: node scripts/seedICU.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('../models/Hospital');
const ICU = require('../models/ICU');

// Dhaka sub-locations with sample hospitals (at least 5 per location)
const SEED_DATA = [
  {
    location: 'Dhanmondi',
    hospitals: [
      { name: 'Square Hospital', total_icu: 20, available_icu: 7, price_per_day: 18000 },
      { name: 'Lab Aid Hospital', total_icu: 15, available_icu: 4, price_per_day: 14000 },
      { name: 'Ibn Sina Hospital Dhanmondi', total_icu: 12, available_icu: 3, price_per_day: 12000 },
      { name: 'Popular Diagnostic Dhanmondi', total_icu: 10, available_icu: 2, price_per_day: 11000 },
      { name: 'Medinova Medical Services', total_icu: 8, available_icu: 0, price_per_day: 10000 },
      { name: 'City Hospital Dhanmondi', total_icu: 6, available_icu: 1, price_per_day: 9000 },
    ]
  },
  {
    location: 'Mohammadpur',
    hospitals: [
      { name: 'Japan Bangladesh Friendship Hospital', total_icu: 12, available_icu: 4, price_per_day: 12000 },
      { name: 'Mohammadpur Fertility Center', total_icu: 8, available_icu: 2, price_per_day: 10000 },
      { name: 'Central Hospital Mohammadpur', total_icu: 10, available_icu: 0, price_per_day: 9500 },
      { name: 'Al-Raji Hospital', total_icu: 6, available_icu: 1, price_per_day: 8500 },
      { name: 'Trauma Center Mohammadpur', total_icu: 8, available_icu: 3, price_per_day: 9000 },
      { name: 'Life Care Hospital Mohammadpur', total_icu: 5, available_icu: 2, price_per_day: 7500 },
    ]
  },
  {
    location: 'Gulshan',
    hospitals: [
      { name: 'United Hospital', total_icu: 30, available_icu: 12, price_per_day: 22000 },
      { name: 'Evercare Hospital Dhaka', total_icu: 35, available_icu: 15, price_per_day: 25000 },
      { name: 'Gulshan Clinic', total_icu: 10, available_icu: 3, price_per_day: 15000 },
      { name: 'Asgar Ali Hospital Gulshan', total_icu: 12, available_icu: 4, price_per_day: 16000 },
      { name: 'LabAid Specialized Hospital Gulshan', total_icu: 14, available_icu: 5, price_per_day: 17000 },
      { name: 'Square Gulshan Branch', total_icu: 8, available_icu: 0, price_per_day: 18000 },
    ]
  },
  {
    location: 'Uttara',
    hospitals: [
      { name: 'Popular Hospital Uttara', total_icu: 18, available_icu: 6, price_per_day: 13000 },
      { name: 'Crescent Gastroliver Hospital', total_icu: 10, available_icu: 2, price_per_day: 11000 },
      { name: 'Uttara Adhunik Medical College', total_icu: 15, available_icu: 5, price_per_day: 10000 },
      { name: 'Radical Hospital Uttara', total_icu: 8, available_icu: 0, price_per_day: 9000 },
      { name: 'Sahera Clinic Uttara', total_icu: 6, available_icu: 2, price_per_day: 8500 },
      { name: 'North South Hospital', total_icu: 12, available_icu: 4, price_per_day: 11500 },
    ]
  },
  {
    location: 'Mirpur',
    hospitals: [
      { name: 'Mirpur General Hospital', total_icu: 14, available_icu: 5, price_per_day: 9000 },
      { name: 'Ibn Sina Hospital Mirpur', total_icu: 10, available_icu: 0, price_per_day: 10000 },
      { name: 'Shaheed Suhrawardy Hospital Mirpur', total_icu: 20, available_icu: 3, price_per_day: 6000 },
      { name: 'Mirpur Diagnostic Center', total_icu: 8, available_icu: 2, price_per_day: 8500 },
      { name: 'Al-Helal Hospital Mirpur', total_icu: 6, available_icu: 1, price_per_day: 7500 },
      { name: 'Care Hospital Mirpur', total_icu: 7, available_icu: 3, price_per_day: 8000 },
    ]
  },
  {
    location: 'Banani',
    hospitals: [
      { name: 'Apollo Hospital Banani', total_icu: 18, available_icu: 7, price_per_day: 18000 },
      { name: 'Banani Clinic', total_icu: 8, available_icu: 2, price_per_day: 12000 },
      { name: 'Medicare Hospital Banani', total_icu: 10, available_icu: 3, price_per_day: 14000 },
      { name: 'Trust Hospital Banani', total_icu: 6, available_icu: 0, price_per_day: 11000 },
      { name: 'Banani General Hospital', total_icu: 12, available_icu: 4, price_per_day: 13000 },
    ]
  },
  {
    location: 'Motijheel',
    hospitals: [
      { name: 'BIRDEM Hospital', total_icu: 25, available_icu: 8, price_per_day: 14000 },
      { name: 'Dhaka Medical College Hospital', total_icu: 40, available_icu: 5, price_per_day: 5000 },
      { name: 'Sir Salimullah Medical College', total_icu: 30, available_icu: 4, price_per_day: 5500 },
      { name: 'Holy Family Hospital', total_icu: 15, available_icu: 3, price_per_day: 10000 },
      { name: 'Central Hospital Motijheel', total_icu: 10, available_icu: 2, price_per_day: 9000 },
      { name: 'Motijheel Specialized Hospital', total_icu: 8, available_icu: 0, price_per_day: 8500 },
    ]
  },
  {
    location: 'Badda',
    hospitals: [
      { name: 'Badda General Hospital', total_icu: 8, available_icu: 3, price_per_day: 8000 },
      { name: 'Popular Diagnostic Badda', total_icu: 6, available_icu: 2, price_per_day: 9000 },
      { name: 'Comfort Hospital Badda', total_icu: 5, available_icu: 1, price_per_day: 7500 },
      { name: 'Meena Bazar Medical Center', total_icu: 4, available_icu: 0, price_per_day: 7000 },
      { name: 'Badda Clinic & Diagnostic', total_icu: 6, available_icu: 2, price_per_day: 8500 },
    ]
  },
  {
    location: 'Farmgate',
    hospitals: [
      { name: 'Green Life Hospital', total_icu: 18, available_icu: 6, price_per_day: 15000 },
      { name: 'Farmgate General Hospital', total_icu: 10, available_icu: 3, price_per_day: 11000 },
      { name: 'Universal Medical College', total_icu: 14, available_icu: 4, price_per_day: 10000 },
      { name: 'Monowara Hospital Farmgate', total_icu: 8, available_icu: 0, price_per_day: 9500 },
      { name: 'Farmgate Clinic & Hospital', total_icu: 6, available_icu: 2, price_per_day: 9000 },
    ]
  },
  {
    location: 'Shahbag',
    hospitals: [
      { name: 'Bangabandhu Sheikh Mujib Medical University', total_icu: 35, available_icu: 6, price_per_day: 6000 },
      { name: 'National Institute of Cardiovascular Diseases', total_icu: 25, available_icu: 3, price_per_day: 7000 },
      { name: 'Dhaka Shishu Hospital', total_icu: 20, available_icu: 4, price_per_day: 5500 },
      { name: 'National Eye Care Hospital', total_icu: 8, available_icu: 2, price_per_day: 8000 },
      { name: 'Shahbag Medical Center', total_icu: 10, available_icu: 0, price_per_day: 9000 },
    ]
  },
  {
    location: 'Tejgaon',
    hospitals: [
      { name: 'Anwer Khan Modern Medical College', total_icu: 12, available_icu: 4, price_per_day: 11000 },
      { name: 'Tejgaon General Hospital', total_icu: 8, available_icu: 2, price_per_day: 9000 },
      { name: 'Central Police Hospital', total_icu: 10, available_icu: 3, price_per_day: 7000 },
      { name: 'Combined Military Hospital Tejgaon', total_icu: 15, available_icu: 5, price_per_day: 6000 },
      { name: 'Tejgaon Specialized Hospital', total_icu: 6, available_icu: 0, price_per_day: 10000 },
    ]
  },
  {
    location: 'Bashundhara',
    hospitals: [
      { name: 'Bashundhara Ad-din Hospital', total_icu: 15, available_icu: 5, price_per_day: 14000 },
      { name: 'North South University Medical Center', total_icu: 10, available_icu: 3, price_per_day: 12000 },
      { name: 'Bashundhara Eye Hospital', total_icu: 6, available_icu: 2, price_per_day: 9000 },
      { name: 'Independent University Medical', total_icu: 8, available_icu: 0, price_per_day: 11000 },
      { name: 'Bashundhara City Hospital', total_icu: 10, available_icu: 4, price_per_day: 13000 },
    ]
  }
];

async function seedICUData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing ICU data
    console.log('Clearing existing ICU data...');
    await ICU.deleteMany({});

    let hospitalsCreated = 0;
    let icuCreated = 0;

    for (const locationData of SEED_DATA) {
      console.log(`\nProcessing location: ${locationData.location} (${locationData.hospitals.length} hospitals)`);

      for (const hospitalData of locationData.hospitals) {
        // Check if hospital already exists
        let hospital = await Hospital.findOne({
          name: hospitalData.name,
          location: locationData.location
        });

        // Create hospital if it doesn't exist
        if (!hospital) {
          hospital = new Hospital({
            name: hospitalData.name,
            location: locationData.location,
            city: 'Dhaka',
            phone: '+880-2-' + Math.floor(10000000 + Math.random() * 90000000),
            email: hospitalData.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '@hospital.com',
            description: `${hospitalData.name} is a leading healthcare facility in ${locationData.location}, Dhaka. We provide comprehensive medical services with state-of-the-art ICU facilities.`,
            beds_total: hospitalData.total_icu * 8
          });
          await hospital.save();
          hospitalsCreated++;
          console.log(`  + Created hospital: ${hospitalData.name}`);
        } else {
          console.log(`  - Hospital exists: ${hospitalData.name}`);
        }

        // Create ICU record
        const icu = new ICU({
          hospital_id: hospital._id,
          total_icu: hospitalData.total_icu,
          available_icu: hospitalData.available_icu,
          booked_icu: hospitalData.total_icu - hospitalData.available_icu,
          price_per_day: hospitalData.price_per_day
        });
        await icu.save();
        icuCreated++;
      }
    }

    // Summary
    const totalHospitals = SEED_DATA.reduce((sum, loc) => sum + loc.hospitals.length, 0);
    const totalLocations = SEED_DATA.length;

    console.log('\n========================================');
    console.log('        SEEDING COMPLETED!');
    console.log('========================================');
    console.log(`  Locations:         ${totalLocations}`);
    console.log(`  Total Hospitals:   ${totalHospitals}`);
    console.log(`  New Hospitals:     ${hospitalsCreated}`);
    console.log(`  ICU Records:       ${icuCreated}`);
    console.log('========================================');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seeder
seedICUData();
