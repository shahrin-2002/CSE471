/**
 * General Bed Data Seeder
 * Seeds General Bed data for hospitals in MongoDB
 * Run: node scripts/seedGeneralBed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('../models/Hospital');
const GeneralBed = require('../models/GeneralBed');

// Dhaka sub-locations with sample hospitals (at least 5 per location)
const SEED_DATA = [
  {
    location: 'Dhanmondi',
    hospitals: [
      { name: 'Square Hospital', total_beds: 80, available_beds: 25, price_per_day: 4000 },
      { name: 'Lab Aid Hospital', total_beds: 60, available_beds: 18, price_per_day: 3500 },
      { name: 'Ibn Sina Hospital Dhanmondi', total_beds: 50, available_beds: 12, price_per_day: 3000 },
      { name: 'Popular Diagnostic Dhanmondi', total_beds: 40, available_beds: 8, price_per_day: 2800 },
      { name: 'Medinova Medical Services', total_beds: 35, available_beds: 0, price_per_day: 2500 },
      { name: 'City Hospital Dhanmondi', total_beds: 30, available_beds: 5, price_per_day: 2200 },
    ]
  },
  {
    location: 'Mohammadpur',
    hospitals: [
      { name: 'Japan Bangladesh Friendship Hospital', total_beds: 50, available_beds: 15, price_per_day: 3000 },
      { name: 'Mohammadpur Fertility Center', total_beds: 35, available_beds: 8, price_per_day: 2500 },
      { name: 'Central Hospital Mohammadpur', total_beds: 45, available_beds: 0, price_per_day: 2400 },
      { name: 'Al-Raji Hospital', total_beds: 30, available_beds: 6, price_per_day: 2000 },
      { name: 'Trauma Center Mohammadpur', total_beds: 40, available_beds: 12, price_per_day: 2200 },
      { name: 'Life Care Hospital Mohammadpur', total_beds: 25, available_beds: 7, price_per_day: 1800 },
    ]
  },
  {
    location: 'Gulshan',
    hospitals: [
      { name: 'United Hospital', total_beds: 120, available_beds: 40, price_per_day: 6000 },
      { name: 'Evercare Hospital Dhaka', total_beds: 150, available_beds: 55, price_per_day: 7000 },
      { name: 'Gulshan Clinic', total_beds: 40, available_beds: 10, price_per_day: 4000 },
      { name: 'Asgar Ali Hospital Gulshan', total_beds: 50, available_beds: 15, price_per_day: 4500 },
      { name: 'LabAid Specialized Hospital Gulshan', total_beds: 60, available_beds: 20, price_per_day: 5000 },
      { name: 'Square Gulshan Branch', total_beds: 35, available_beds: 0, price_per_day: 5500 },
    ]
  },
  {
    location: 'Uttara',
    hospitals: [
      { name: 'Popular Hospital Uttara', total_beds: 70, available_beds: 22, price_per_day: 3200 },
      { name: 'Crescent Gastroliver Hospital', total_beds: 40, available_beds: 8, price_per_day: 2800 },
      { name: 'Uttara Adhunik Medical College', total_beds: 60, available_beds: 18, price_per_day: 2500 },
      { name: 'Radical Hospital Uttara', total_beds: 35, available_beds: 0, price_per_day: 2200 },
      { name: 'Sahera Clinic Uttara', total_beds: 25, available_beds: 6, price_per_day: 2000 },
      { name: 'North South Hospital', total_beds: 50, available_beds: 14, price_per_day: 2800 },
    ]
  },
  {
    location: 'Mirpur',
    hospitals: [
      { name: 'Mirpur General Hospital', total_beds: 55, available_beds: 18, price_per_day: 2200 },
      { name: 'Ibn Sina Hospital Mirpur', total_beds: 45, available_beds: 0, price_per_day: 2500 },
      { name: 'Shaheed Suhrawardy Hospital Mirpur', total_beds: 80, available_beds: 12, price_per_day: 1500 },
      { name: 'Mirpur Diagnostic Center', total_beds: 35, available_beds: 8, price_per_day: 2000 },
      { name: 'Al-Helal Hospital Mirpur', total_beds: 30, available_beds: 5, price_per_day: 1800 },
      { name: 'Care Hospital Mirpur', total_beds: 35, available_beds: 10, price_per_day: 2000 },
    ]
  },
  {
    location: 'Banani',
    hospitals: [
      { name: 'Apollo Hospital Banani', total_beds: 70, available_beds: 25, price_per_day: 5000 },
      { name: 'Banani Clinic', total_beds: 35, available_beds: 8, price_per_day: 3000 },
      { name: 'Medicare Hospital Banani', total_beds: 45, available_beds: 12, price_per_day: 3500 },
      { name: 'Trust Hospital Banani', total_beds: 30, available_beds: 0, price_per_day: 2800 },
      { name: 'Banani General Hospital', total_beds: 50, available_beds: 15, price_per_day: 3200 },
    ]
  },
  {
    location: 'Motijheel',
    hospitals: [
      { name: 'BIRDEM Hospital', total_beds: 100, available_beds: 30, price_per_day: 3500 },
      { name: 'Dhaka Medical College Hospital', total_beds: 160, available_beds: 20, price_per_day: 1200 },
      { name: 'Sir Salimullah Medical College', total_beds: 120, available_beds: 15, price_per_day: 1400 },
      { name: 'Holy Family Hospital', total_beds: 60, available_beds: 12, price_per_day: 2500 },
      { name: 'Central Hospital Motijheel', total_beds: 45, available_beds: 8, price_per_day: 2200 },
      { name: 'Motijheel Specialized Hospital', total_beds: 40, available_beds: 0, price_per_day: 2000 },
    ]
  },
  {
    location: 'Badda',
    hospitals: [
      { name: 'Badda General Hospital', total_beds: 35, available_beds: 10, price_per_day: 2000 },
      { name: 'Popular Diagnostic Badda', total_beds: 30, available_beds: 6, price_per_day: 2200 },
      { name: 'Comfort Hospital Badda', total_beds: 25, available_beds: 4, price_per_day: 1800 },
      { name: 'Meena Bazar Medical Center', total_beds: 20, available_beds: 0, price_per_day: 1700 },
      { name: 'Badda Clinic & Diagnostic', total_beds: 28, available_beds: 7, price_per_day: 2000 },
    ]
  },
  {
    location: 'Farmgate',
    hospitals: [
      { name: 'Green Life Hospital', total_beds: 70, available_beds: 22, price_per_day: 3800 },
      { name: 'Farmgate General Hospital', total_beds: 45, available_beds: 12, price_per_day: 2800 },
      { name: 'Universal Medical College', total_beds: 55, available_beds: 15, price_per_day: 2500 },
      { name: 'Monowara Hospital Farmgate', total_beds: 35, available_beds: 0, price_per_day: 2400 },
      { name: 'Farmgate Clinic & Hospital', total_beds: 30, available_beds: 8, price_per_day: 2200 },
    ]
  },
  {
    location: 'Shahbag',
    hospitals: [
      { name: 'Bangabandhu Sheikh Mujib Medical University', total_beds: 140, available_beds: 25, price_per_day: 1500 },
      { name: 'National Institute of Cardiovascular Diseases', total_beds: 100, available_beds: 12, price_per_day: 1800 },
      { name: 'Dhaka Shishu Hospital', total_beds: 80, available_beds: 15, price_per_day: 1400 },
      { name: 'National Eye Care Hospital', total_beds: 35, available_beds: 8, price_per_day: 2000 },
      { name: 'Shahbag Medical Center', total_beds: 45, available_beds: 0, price_per_day: 2200 },
    ]
  },
  {
    location: 'Tejgaon',
    hospitals: [
      { name: 'Anwer Khan Modern Medical College', total_beds: 50, available_beds: 15, price_per_day: 2800 },
      { name: 'Tejgaon General Hospital', total_beds: 35, available_beds: 8, price_per_day: 2200 },
      { name: 'Central Police Hospital', total_beds: 45, available_beds: 12, price_per_day: 1800 },
      { name: 'Combined Military Hospital Tejgaon', total_beds: 60, available_beds: 18, price_per_day: 1500 },
      { name: 'Tejgaon Specialized Hospital', total_beds: 30, available_beds: 0, price_per_day: 2500 },
    ]
  },
  {
    location: 'Bashundhara',
    hospitals: [
      { name: 'Bashundhara Ad-din Hospital', total_beds: 60, available_beds: 18, price_per_day: 3500 },
      { name: 'North South University Medical Center', total_beds: 45, available_beds: 12, price_per_day: 3000 },
      { name: 'Bashundhara Eye Hospital', total_beds: 30, available_beds: 8, price_per_day: 2200 },
      { name: 'Independent University Medical', total_beds: 35, available_beds: 0, price_per_day: 2800 },
      { name: 'Bashundhara City Hospital', total_beds: 50, available_beds: 15, price_per_day: 3200 },
    ]
  }
];

async function seedGeneralBedData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing General Bed data
    console.log('Clearing existing General Bed data...');
    await GeneralBed.deleteMany({});

    let hospitalsCreated = 0;
    let bedsCreated = 0;

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
            beds_total: hospitalData.total_beds * 2
          });
          await hospital.save();
          hospitalsCreated++;
          console.log(`  + Created hospital: ${hospitalData.name}`);
        } else {
          console.log(`  - Hospital exists: ${hospitalData.name}`);
        }

        // Create General Bed record
        const bed = new GeneralBed({
          hospital_id: hospital._id,
          total_beds: hospitalData.total_beds,
          available_beds: hospitalData.available_beds,
          booked_beds: hospitalData.total_beds - hospitalData.available_beds,
          price_per_day: hospitalData.price_per_day
        });
        await bed.save();
        bedsCreated++;
      }
    }

    // Summary
    const totalHospitals = SEED_DATA.reduce((sum, loc) => sum + loc.hospitals.length, 0);
    const totalLocations = SEED_DATA.length;

    console.log('\n========================================');
    console.log('   GENERAL BED SEEDING COMPLETED!');
    console.log('========================================');
    console.log(`  Locations:         ${totalLocations}`);
    console.log(`  Total Hospitals:   ${totalHospitals}`);
    console.log(`  New Hospitals:     ${hospitalsCreated}`);
    console.log(`  Bed Records:       ${bedsCreated}`);
    console.log('========================================');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seeder
seedGeneralBedData();
