import React, { createContext, useContext, useEffect, useState } from 'react';

// Simple translation dictionary (can be expanded)
const translations = {
  en: {
    appName: 'HealthConnect',
    hospitals: 'Hospitals',
    doctors: 'Doctors',
    appointments: 'Appointments',
    ambulance: 'Ambulance',
    locations: 'Locations',
    booking: 'Booking',
    contact: 'Contact',
    link: 'Link',
    dashboard: 'Dashboard',
    signIn: 'Sign in',
    register: 'Register',
    findHospitals: 'Find Hospitals',
    findDoctor: 'Find a Doctor',
    latestReviews: 'Latest reviews',
    newsletterTitle: 'Follow the latest trends',
    newsletterSubtitle: 'With our daily newsletter',
    newsletterPlaceholder: 'you@example.com',
    submit: 'Submit',
    logout: 'Logout',
    loading: 'Loading...',
    accessDenied: 'Access denied',
    // Auth / common
    email: 'Email',
    password: 'Password',
    login: 'Log In',
    verification: 'Verification',
    dontHaveAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    createAccount: 'Create an Account',
    forgotPassword: 'Forgot password?',
    backToLogin: 'Back to Login',
    otpSentTo: 'We sent a code to',
    enterCode: 'Enter 6-digit Code',
    processing: 'Processing...',
    verifyCode: 'Verify Code',
    registration: 'Registration',
    name: 'Name',
    gender: 'Gender',
    dateOfBirth: 'Date of Birth',
    registerAs: 'Register as',
    patient: 'Patient',
    doctor: 'Doctor',
    admin: 'Admin',
    acceptTerms: 'I accept the terms',
    myProfile: 'My Profile',
    myDocuments: 'My Documents',
    myAppointments: 'My Appointments',
    adminDashboard: 'Admin Dashboard',
    manageAvailability: 'Manage My Availability',
    saveChanges: 'Save Changes',
    save: 'Save',
    upload: 'Upload',
    book: 'Book',
    reschedule: 'Reschedule',
    cancel: 'Cancel',
    noRecordsFound: 'No medical records found',
    myMedicalRecords: 'My Medical Records',
    // Search / details
    loadingHospitals: 'Loading hospitals...',
    loadingDoctors: 'Loading doctors...',
    noHospitals: 'No hospitals found',
    noDoctors: 'No doctors found',
    consultationLabel: 'Consultation',
    visitingFeeLabel: 'Visiting Fee',
    taka: 'taka',
    instructionHospital:
      'Please make sure to select a consultant and your available time slot before booking for an appointment with our hospital.',
    instructionDoctor: 'Please select a date and time to see availability.',
    consultantList: 'Consultant List',
    selectDoctor: 'Select Doctor',
    dateLabel: 'Date',
    bookAppointment: 'Book Appointment',
    about: 'About',
    totalBeds: 'Total Beds:',
    phoneLabel: 'Phone:',
    emailLabel: 'Email:',
    // Doctor schedule
    selectDate: 'Select Date',
    availableTimeSlots: 'Available Time Slots',
    checkingSchedule: "Checking doctor's schedule...",
    noSlots: 'No slots available for this date.',
    selectDateFirst: 'Select Date First',
    // Reviews (static samples)
    reviewTitleHospital: 'Great Service',
    reviewBodyHospital: 'Excellent healthcare facility with caring staff.',
    reviewTitleDoctor: 'Excellent Doctor',
    reviewBodyDoctor: 'Very professional and caring physician.',
    patientLabel: 'Patient',
    reviewDateSample: 'Dec 2024',
    // Profile placeholders / messages
    phone: 'Phone',
    address: 'Address',
    profileLocked: 'Your profile is locked. You cannot edit.',
    profileUpdated: 'Profile updated successfully',
    profileLoadFailed: 'Failed to load profile',
    // Documents
    verified: 'Verified',
    delete: 'Delete',
    docsLoadFailed: 'Failed to load documents',
    docUploaded: 'Document uploaded',
    uploadFailed: 'Upload failed',
    deleteFailed: 'Delete failed',
    // Doctor / availability labels
    available: 'Available',
    busy: 'Busy',
    onLeave: 'On Leave',
    licenseLabel: 'License:',
    hospitalLabel: 'Hospital:',
  },
  bn: {
    appName: 'হেলথকনেক্ট',
    hospitals: 'হাসপাতাল',
    doctors: 'ডাক্তার',
    appointments: 'অ্যাপয়েন্টমেন্ট',
    ambulance: 'অ্যাম্বুলেন্স',
    locations: 'লোকেশন',
    booking: 'বুকিং',
    contact: 'যোগাযোগ',
    link: 'লিংক',
    dashboard: 'ড্যাশবোর্ড',
    signIn: 'সাইন ইন',
    register: 'রেজিস্টার',
    findHospitals: 'হাসপাতাল খুঁজুন',
    findDoctor: 'ডাক্তার খুঁজুন',
    latestReviews: 'সর্বশেষ রিভিউ',
    newsletterTitle: 'সর্বশেষ আপডেট পেতে',
    newsletterSubtitle: 'আমাদের দৈনিক নিউজলেটারে যোগ দিন',
    newsletterPlaceholder: 'আপনি@example.com',
    submit: 'সাবমিট',
    logout: 'লগআউট',
    loading: 'লোড হচ্ছে...',
    accessDenied: 'অ্যাক্সেস অনুমোদিত নয়',
    // Auth / common
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    login: 'লগ ইন',
    verification: 'যাচাইকরণ',
    dontHaveAccount: 'একটি অ্যাকাউন্ট নেই?',
    haveAccount: 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?',
    createAccount: 'অ্যাকাউন্ট তৈরি করুন',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    backToLogin: 'লগইনে ফিরে যান',
    otpSentTo: 'আমরা কোড পাঠিয়েছি',
    enterCode: '৬-সংখ্যার কোড লিখুন',
    processing: 'প্রসেসিং হচ্ছে...',
    verifyCode: 'কোড যাচাই করুন',
    registration: 'রেজিস্ট্রেশন',
    name: 'নাম',
    gender: 'লিঙ্গ',
    dateOfBirth: 'জন্ম তারিখ',
    registerAs: 'রেজিস্টার করুন',
    patient: 'রোগী',
    doctor: 'ডাক্তার',
    admin: 'অ্যাডমিন',
    acceptTerms: 'আমি শর্তাবলীতে সম্মত',
    myProfile: 'আমার প্রোফাইল',
    myDocuments: 'আমার ডকুমেন্ট',
    myAppointments: 'আমার অ্যাপয়েন্টমেন্ট',
    adminDashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    manageAvailability: 'আমার অ্যাভেইলেবিলিটি ম্যানেজ করুন',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    save: 'সেভ',
    upload: 'আপলোড',
    book: 'বুক করুন',
    reschedule: 'রিশিডিউল',
    cancel: 'বাতিল',
    noRecordsFound: 'কোনো মেডিকেল রেকর্ড পাওয়া যায়নি',
    myMedicalRecords: 'আমার মেডিকেল রেকর্ড',
    // Search / details
    loadingHospitals: 'হাসপাতাল লোড হচ্ছে...',
    loadingDoctors: 'ডাক্তার লোড হচ্ছে...',
    noHospitals: 'কোনো হাসপাতাল পাওয়া যায়নি',
    noDoctors: 'কোনো ডাক্তার পাওয়া যায়নি',
    consultationLabel: 'পরামর্শ ফি',
    visitingFeeLabel: 'ভিজিটিং ফি',
    taka: 'টাকা',
    instructionHospital:
      'দয়া করে আমাদের হাসপাতালে অ্যাপয়েন্টমেন্ট বুক করার আগে একজন কনসালট্যান্ট এবং আপনার সুবিধাজনক সময় স্লট নির্বাচন করুন।',
    instructionDoctor: 'অনুগ্রহ করে তারিখ ও সময় নির্বাচন করে অ্যাভেইলেবিলিটি দেখুন।',
    consultantList: 'কনসালট্যান্ট তালিকা',
    selectDoctor: 'ডাক্তার নির্বাচন করুন',
    dateLabel: 'তারিখ',
    bookAppointment: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    about: 'সম্বন্ধে',
    totalBeds: 'মোট বেড:',
    phoneLabel: 'ফোন:',
    emailLabel: 'ইমেইল:',
    // Doctor schedule
    selectDate: 'তারিখ নির্বাচন করুন',
    availableTimeSlots: 'উপলব্ধ সময় স্লট',
    checkingSchedule: 'ডাক্তারের সময়সূচি যাচাই করা হচ্ছে...',
    noSlots: 'এই তারিখে কোনো স্লট খালি নেই।',
    selectDateFirst: 'আগে তারিখ নির্বাচন করুন',
    // Reviews (static samples)
    reviewTitleHospital: 'চমৎকার সেবা',
    reviewBodyHospital: 'দারুণ চিকিৎসা সেবা এবং যত্নশীল স্টাফ।',
    reviewTitleDoctor: 'দক্ষ ডাক্তার',
    reviewBodyDoctor: 'খুবই পেশাদার এবং যত্নশীল চিকিৎসা দেন।',
    patientLabel: 'রোগী',
    reviewDateSample: 'ডিসে ২০২৪',
    // Profile placeholders / messages
    phone: 'ফোন',
    address: 'ঠিকানা',
    profileLocked: 'আপনার প্রোফাইল লক করা হয়েছে। আপনি পরিবর্তন করতে পারবেন না।',
    profileUpdated: 'প্রোফাইল সফলভাবে আপডেট হয়েছে',
    profileLoadFailed: 'প্রোফাইল লোড করতে ব্যর্থ হয়েছে',
    // Documents
    verified: 'ভেরিফাইড',
    delete: 'ডিলিট',
    docsLoadFailed: 'ডকুমেন্ট লোড করতে ব্যর্থ হয়েছে',
    docUploaded: 'ডকুমেন্ট আপলোড হয়েছে',
    uploadFailed: 'আপলোড ব্যর্থ হয়েছে',
    deleteFailed: 'ডিলিট ব্যর্থ হয়েছে',
    // Doctor / availability labels
    available: 'উপলব্ধ',
    busy: 'ব্যস্ত',
    onLeave: 'ছুটিতে',
    licenseLabel: 'লাইসেন্স:',
    hospitalLabel: 'হাসপাতাল:',
  },
};

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  useEffect(() => {
    localStorage.setItem('language', language);
    // Basic accessibility: set document language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};


