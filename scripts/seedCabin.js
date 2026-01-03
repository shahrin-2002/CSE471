/**
 * Cabin Data Seeder
 * Seeds Cabin data for hospitals in MongoDB
 * Run: node scripts/seedCabin.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('../models/Hospital');
const Cabin = require('../models/Cabin');

// Dhaka sub-locations with sample hospitals (at least 5 per location)
const SEED_DATA = [
  {
    location: 'Dhanmondi',
    hospitals: [
      { name: 'Square Hospital', total_cabins: 25, available_cabins: 8, price_per_day: 12000 },
      { name: 'Lab Aid Hospital', total_cabins: 18, available_cabins: 5, price_per_day: 10000 },
      { name: 'Ibn Sina Hospital Dhanmondi', total_cabins: 15, available_cabins: 4, price_per_day: 8500 },
      { name: 'Popular Diagnostic Dhanmondi', total_cabins: 12, available_cabins: 2, price_per_day: 8000 },
      { name: 'Medinova Medical Services', total_cabins: 10, available_cabins: 0, price_per_day: 7500 },
      { name: 'City Hospital Dhanmondi', total_cabins: 8, available_cabins: 2, price_per_day: 6500 },
    ]
  },
  {
    location: 'Mohammadpur',
    hospitals: [
      { name: 'Japan Bangladesh Friendship Hospital', total_cabins: 15, available_cabins: 5, price_per_day: 8000 },
      { name: 'Mohammadpur Fertility Center', total_cabins: 10, available_cabins: 3, price_per_day: 7000 },
      { name: 'Central Hospital Mohammadpur', total_cabins: 12, available_cabins: 0, price_per_day: 6500 },
      { name: 'Al-Raji Hospital', total_cabins: 8, available_cabins: 2, price_per_day: 5500 },
      { name: 'Trauma Center Mohammadpur', total_cabins: 10, available_cabins: 4, price_per_day: 6000 },
      { name: 'Life Care Hospital Mohammadpur', total_cabins: 6, available_cabins: 2, price_per_day: 5000 },
    ]
  },
  {
    location: 'Gulshan',
    hospitals: [
      { name: 'United Hospital', total_cabins: 40, available_cabins: 15, price_per_day: 18000 },
      { name: 'Evercare Hospital Dhaka', total_cabins: 50, available_cabins: 20, price_per_day: 22000 },
      { name: 'Gulshan Clinic', total_cabins: 12, available_cabins: 4, price_per_day: 12000 },
      { name: 'Asgar Ali Hospital Gulshan', total_cabins: 15, available_cabins: 5, price_per_day: 14000 },
      { name: 'LabAid Specialized Hospital Gulshan', total_cabins: 18, available_cabins: 6, price_per_day: 15000 },
      { name: 'Square Gulshan Branch', total_cabins: 10, available_cabins: 0, price_per_day: 16000 },
    ]
  },
  {
    location: 'Uttara',
    hospitals: [
      { name: 'Popular Hospital Uttara', total_cabins: 22, available_cabins: 8, price_per_day: 9000 },
      { name: 'Crescent Gastroliver Hospital', total_cabins: 12, available_cabins: 3, price_per_day: 7500 },
      { name: 'Uttara Adhunik Medical College', total_cabins: 18, available_cabins: 6, price_per_day: 7000 },
      { name: 'Radical Hospital Uttara', total_cabins: 10, available_cabins: 0, price_per_day: 6500 },
      { name: 'Sahera Clinic Uttara', total_cabins: 8, available_cabins: 2, price_per_day: 6000 },
      { name: 'North South Hospital', total_cabins: 15, available_cabins: 5, price_per_day: 8000 },
    ]
  },
  {
    location: 'Mirpur',
    hospitals: [
      { name: 'Mirpur General Hospital', total_cabins: 16, available_cabins: 6, price_per_day: 6000 },
      { name: 'Ibn Sina Hospital Mirpur', total_cabins: 12, available_cabins: 0, price_per_day: 7000 },
      { name: 'Shaheed Suhrawardy Hospital Mirpur', total_cabins: 25, available_cabins: 4, price_per_day: 4000 },
      { name: 'Mirpur Diagnostic Center', total_cabins: 10, available_cabins: 3, price_per_day: 5500 },
      { name: 'Al-Helal Hospital Mirpur', total_cabins: 8, available_cabins: 2, price_per_day: 5000 },
      { name: 'Care Hospital Mirpur', total_cabins: 10, available_cabins: 4, price_per_day: 5500 },
    ]
  },
  {
    location: 'Banani',
    hospitals: [
      { name: 'Apollo Hospital Banani', total_cabins: 22, available_cabins: 8, price_per_day: 14000 },
      { name: 'Banani Clinic', total_cabins: 10, available_cabins: 3, price_per_day: 9000 },
      { name: 'Medicare Hospital Banani', total_cabins: 14, available_cabins: 4, price_per_day: 10500 },
      { name: 'Trust Hospital Banani', total_cabins: 8, available_cabins: 0, price_per_day: 8500 },
      { name: 'Banani General Hospital', total_cabins: 15, available_cabins: 5, price_per_day: 10000 },
    ]
  },
  {
    location: 'Motijheel',
    hospitals: [
      { name: 'BIRDEM Hospital', total_cabins: 30, available_cabins: 10, price_per_day: 10000 },
      { name: 'Dhaka Medical College Hospital', total_cabins: 50, available_cabins: 8, price_per_day: 3500 },
      { name: 'Sir Salimullah Medical College', total_cabins: 40, available_cabins: 6, price_per_day: 4000 },
      { name: 'Holy Family Hospital', total_cabins: 18, available_cabins: 5, price_per_day: 7000 },
      { name: 'Central Hospital Motijheel', total_cabins: 12, available_cabins: 3, price_per_day: 6500 },
      { name: 'Motijheel Specialized Hospital', total_cabins: 10, available_cabins: 0, price_per_day: 6000 },
    ]
  },
  {
    location: 'Badda',
    hospitals: [
      { name: 'Badda General Hospital', total_cabins: 10, available_cabins: 4, price_per_day: 5500 },
      { name: 'Popular Diagnostic Badda', total_cabins: 8, available_cabins: 2, price_per_day: 6000 },
      { name: 'Comfort Hospital Badda', total_cabins: 6, available_cabins: 2, price_per_day: 5000 },
      { name: 'Meena Bazar Medical Center', total_cabins: 5, available_cabins: 0, price_per_day: 4500 },
      { name: 'Badda Clinic & Diagnostic', total_cabins: 8, available_cabins: 3, price_per_day: 5500 },
    ]
  },
  {
    location: 'Farmgate',
    hospitals: [
      { name: 'Green Life Hospital', total_cabins: 22, available_cabins: 8, price_per_day: 11000 },
      { name: 'Farmgate General Hospital', total_cabins: 12, available_cabins: 4, price_per_day: 8000 },
      { name: 'Universal Medical College', total_cabins: 16, available_cabins: 5, price_per_day: 7000 },
      { name: 'Monowara Hospital Farmgate', total_cabins: 10, available_cabins: 0, price_per_day: 7000 },
      { name: 'Farmgate Clinic & Hospital', total_cabins: 8, available_cabins: 3, price_per_day: 6500 },
    ]
  },
  {
    location: 'Shahbag',
    hospitals: [
      { name: 'Bangabandhu Sheikh Mujib Medical University', total_cabins: 45, available_cabins: 8, price_per_day: 4500 },
      { name: 'National Institute of Cardiovascular Diseases', total_cabins: 30, available_cabins: 5, price_per_day: 5000 },
      { name: 'Dhaka Shishu Hospital', total_cabins: 25, available_cabins: 6, price_per_day: 4000 },
      { name: 'National Eye Care Hospital', total_cabins: 10, available_cabins: 3, price_per_day: 5500 },
      { name: 'Shahbag Medical Center', total_cabins: 12, available_cabins: 0, price_per_day: 6500 },
    ]
  },
  {
    location: 'Tejgaon',
    hospitals: [
      { name: 'Anwer Khan Modern Medical College', total_cabins: 14, available_cabins: 5, price_per_day: 8000 },
      { name: 'Tejgaon General Hospital', total_cabins: 10, available_cabins: 3, price_per_day: 6500 },
      { name: 'Central Police Hospital', total_cabins: 12, available_cabins: 4, price_per_day: 5000 },
      { name: 'Combined Military Hospital Tejgaon', total_cabins: 18, available_cabins: 6, price_per_day: 4500 },
      { name: 'Tejgaon Specialized Hospital', total_cabins: 8, available_cabins: 0, price_per_day: 7000 },
    ]
  },
  {
    location: 'Bashundhara',
    hospitals: [
      { name: 'Bashundhara Ad-din Hospital', total_cabins: 18, available_cabins: 6, price_per_day: 10000 },
      { name: 'North South University Medical Center', total_cabins: 12, available_cabins: 4, price_per_day: 8500 },
      { name: 'Bashundhara Eye Hospital', total_cabins: 8, available_cabins: 3, price_per_day: 6500 },
      { name: 'Independent University Medical', total_cabins: 10, available_cabins: 0, price_per_day: 8000 },
      { name: 'Bashundhara City Hospital', total_cabins: 14, available_cabins: 5, price_per_day: 9500 },
    ]
  }
];

async function seedCabinData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing Cabin data
    console.log('Clearing existing Cabin data...');
    await Cabin.deleteMany({});

    let hospitalsCreated = 0;
    let cabinsCreated = 0;

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
            description: `${hospitalData.name} is a leading healthcare facility in ${locationData.location}, Dhaka.`,
            beds_total: hospitalData.total_cabins * 3
          });
          await hospital.save();
          hospitalsCreated++;
          console.log(`  + Created hospital: ${hospitalData.name}`);
        } else {
          console.log(`  - Hospital exists: ${hospitalData.name}`);
        }

        // Create Cabin record
        const cabin = new Cabin({
          hospital_id: hospital._id,
          total_cabins: hospitalData.total_cabins,
          available_cabins: hospitalData.available_cabins,
          booked_cabins: hospitalData.total_cabins - hospitalData.available_cabins,
          price_per_day: hospitalData.price_per_day,
          cabin_type: 'standard'
        });
        await cabin.save();
        cabinsCreated++;
      }
    }

    // Summary
    const totalHospitals = SEED_DATA.reduce((sum, loc) => sum + loc.hospitals.length, 0);
    const totalLocations = SEED_DATA.length;

    console.log('\n========================================');
    console.log('      CABIN SEEDING COMPLETED!');
    console.log('========================================');
    console.log(`  Locations:         ${totalLocations}`);
    console.log(`  Total Hospitals:   ${totalHospitals}`);
    console.log(`  New Hospitals:     ${hospitalsCreated}`);
    console.log(`  Cabin Records:     ${cabinsCreated}`);
    console.log('========================================');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seeder
seedCabinData();
