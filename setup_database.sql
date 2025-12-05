-- HealthConnect Database Setup Script
-- Run this with: mysql -u root -p < setup_database.sql

-- Create database
CREATE DATABASE IF NOT EXISTS healthcare_system;
USE healthcare_system;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'healthcare_user'@'localhost' IDENTIFIED BY 'Healthcare@123';
GRANT ALL PRIVILEGES ON healthcare_system.* TO 'healthcare_user'@'localhost';
FLUSH PRIVILEGES;

-- Create users table with new fields
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Patient', 'Doctor', 'Hospital_Admin') NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) DEFAULT NULL,
  pincode VARCHAR(10) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  specializations TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  beds_total INT DEFAULT NULL,
  admin_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  hospital_id INT NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE DEFAULT NULL,
  experience_years INT DEFAULT 0,
  qualifications TEXT DEFAULT NULL,
  consultation_fee DECIMAL(10,2) DEFAULT 0.00,
  availability_status ENUM('Available', 'Busy', 'On_Leave') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_name ON hospitals(name);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_hospital_id ON doctors(hospital_id);

SELECT 'Database setup completed successfully!' AS Status;
SELECT 'Tables created: users, hospitals, doctors' AS Info;
