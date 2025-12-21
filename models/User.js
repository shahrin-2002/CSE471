/**
 * User Model - MongoDB Schema with Mongoose
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Add small sub-schemas for prescriptions and ambulance bookings
const prescriptionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medications: [{
    name: { type: String, required: true, trim: true },
    dose: { type: String, default: null, trim: true },
    frequency: { type: String, default: null, trim: true },
    duration: { type: String, default: null, trim: true }
  }],
  notes: { type: String, default: null, trim: true }
}, { timestamps: true });

const ambulanceBookingSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { type: String, required: true, trim: true },
  dropLocation: { type: String, default: null, trim: true },
  phone: { type: String, default: null, trim: true },
  scheduledAt: { type: Date, default: null },
  status: { type: String, enum: ['requested', 'dispatched', 'completed', 'cancelled'], default: 'requested' }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'lab'],
    default: 'patient'
  },
  
  phone: {
    type: String,
    default: null,
    trim: true
  },
  address: {
    type: String,
    default: null,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null
  },
  date_of_birth: {
    type: Date,
    default: null
  },
  otp: { 
    type: String, 
    default: null 
  },
  otpExpires: { 
    type: Date, 
    default: null 
  },

  // New fields: embed prescriptions and ambulance bookings to avoid schema-related errors
  prescriptions: {
    type: [prescriptionSchema],
    default: []
  },
  ambulanceBookings: {
    type: [ambulanceBookingSchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // keep both _id and id for backward compatibility with frontend / other code
      ret.id = ret._id;
      // do not remove _id here to avoid breaking code that expects _id
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

/**
 * Static method to find user by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method to check if email exists
 * @param {string} email
 * @returns {Promise<boolean>}
 */
userSchema.statics.emailExists = async function(email) {
  const user = await this.findOne({ email: email.toLowerCase() });
  return !!user;
};

/**
 * Instance: add a prescription (called by doctor)
 * @param {ObjectId} doctorId
 * @param {Array} medications
 * @param {String} notes
 */
userSchema.methods.addPrescription = async function(doctorId, medications = [], notes = null) {
  this.prescriptions.push({
    doctor: doctorId,
    patient: this._id,
    medications,
    notes
  });
  return await this.save();
};

/**
 * Instance: book an ambulance (called by patient)
 * details: { pickupLocation, dropLocation, phone, scheduledAt }
 */
userSchema.methods.bookAmbulance = async function(details = {}) {
  const booking = {
    requestedBy: this._id,
    pickupLocation: details.pickupLocation || details.pickup || '',
    dropLocation: details.dropLocation || details.drop || null,
    phone: details.phone || this.phone || null,
    scheduledAt: details.scheduledAt || null
  };

  this.ambulanceBookings.push(booking);
  return await this.save();
};

/**
 * Instance method to compare password
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  // If password is not stored or user has no password, fail
  if (!this.password) return false;

  // Detect if stored password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const looksHashed = typeof this.password === 'string' && /^\$2[aby]\$/.test(this.password);

  if (looksHashed) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Fallback for legacy/plaintext passwords: allow direct match and migrate to hashed password
  // This helps when users were inserted directly into DB without hashing during development.
  if (candidatePassword === this.password) {
    try {
      // Trigger pre-save hook to hash the password and persist the change
      this.password = candidatePassword;
      await this.save();
      console.log(`[User] Migrated plaintext password to bcrypt hash for user ${this.email}`);
    } catch (err) {
      console.error('[User] Failed to migrate plaintext password:', err);
    }
    return true;
  }

  return false;
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
