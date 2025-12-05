# HealthConnect 🏥

A full-stack healthcare management system built with the MERN stack (MySQL, Express.js, React.js, Node.js) featuring user authentication, role-based access control, and a modern UI.

## ✨ Features

### Authentication & User Management
- 🔐 Secure user registration and login with JWT
- 👥 Three user roles: Patient, Doctor, Hospital Admin
- 🔑 Password hashing with bcrypt (10 salt rounds)
- 📱 Profile management with gender and date of birth
- 🛡️ Protected routes with automatic session persistence

### Modern User Interface
- 🎨 Clean, responsive design matching mockups
- 🌈 Mint/teal color scheme with professional aesthetics
- 📱 Mobile-friendly layout
- ⚡ Fast, single-page application experience

### Backend API
- 🏥 Hospital directory with search and filtering
- 👨‍⚕️ Doctor directory with specialization lookup
- 🔍 Advanced search and pagination
- 🔒 Role-based access control for admin operations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL Server
- npm or yarn

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 2. Setup MySQL Database

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE healthcare_system;
USE healthcare_system;

CREATE TABLE users (
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

CREATE USER IF NOT EXISTS 'healthcare_user'@'localhost' IDENTIFIED BY 'Healthcare@123';
GRANT ALL PRIVILEGES ON healthcare_system.* TO 'healthcare_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment

Backend `.env` (already configured):
```env
PORT=9358
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DB_HOST=localhost
DB_USER=healthcare_user
DB_PASSWORD=Healthcare@123
DB_NAME=healthcare_system
DB_PORT=3306
```

Frontend `client/.env` (already configured):
```env
REACT_APP_API_URL=http://localhost:9358/api
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

**Access:** Open http://localhost:3000

## 📁 Project Structure

```
471_project/
├── models/                    # MVC - Database Models
│   └── User.js               # User data access layer
│
├── controllers/               # MVC - Business Logic
│   └── authController.js     # Authentication logic
│
├── routes/                    # MVC - API Routes
│   ├── auth.js               # Auth endpoints
│   ├── hospitals.js          # Hospital endpoints
│   └── doctors.js            # Doctor endpoints
│
├── middleware/                # Custom Middleware
│   └── auth.js               # JWT & RBAC middleware
│
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/            # Login, Register, Dashboard
│   │   ├── services/         # API client (axios)
│   │   ├── context/          # Auth state management
│   │   └── styles/           # CSS files
│   └── public/
│
├── server.js                  # Express server
├── package.json               # Backend dependencies
└── setup_database.sql         # DB setup script
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Axios |
| **Backend** | Node.js, Express.js 4.18 |
| **Database** | MySQL with mysql2 driver |
| **Authentication** | JWT (24-hour expiry) |
| **Security** | bcrypt password hashing |
| **State** | React Context API |
| **Architecture** | MVC Pattern |

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/signup      Register new user
POST   /api/auth/login       Login and get JWT token
GET    /api/auth/profile     Get user profile (protected)
```

### Hospitals (Legacy API - not in frontend yet)
```
GET    /api/hospitals              List all hospitals
GET    /api/hospitals/:id          Get hospital details
POST   /api/hospitals              Create hospital (admin only)
PUT    /api/hospitals/:id          Update hospital (admin only)
```

### Doctors (Legacy API - not in frontend yet)
```
GET    /api/doctors                List all doctors
GET    /api/doctors/:id            Get doctor details
POST   /api/doctors                Register doctor (admin only)
PUT    /api/doctors/:id            Update doctor (admin only)
```

## 🎯 MVC Architecture

### Models (`models/`)
- Encapsulate database operations
- Provide clean data access interface
- Example: `User.findByEmail()`, `User.create()`

### Controllers (`controllers/`)
- Handle business logic
- Process and validate requests
- Return appropriate responses
- Example: `authController.signup()`, `authController.login()`

### Views (`client/`)
- React components for UI
- State management with Context API
- API calls through service layer

## 🔒 Security Features

- ✅ JWT authentication with 24-hour expiry
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Role-based access control (RBAC)
- ✅ Protected routes with automatic redirects
- ✅ CORS enabled for cross-origin requests
- ✅ Environment-based configuration

## 💻 Usage

### Register an Account
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form:
   - Name
   - Email
   - Gender (optional)
   - Date of Birth (optional)
   - Role (Patient, Doctor, or Hospital Admin)
   - Password & Confirm Password
   - Accept terms
4. Click "Create an Account"
5. You'll be automatically logged in

### Login
1. Enter your email and password
2. Click "Sign In"
3. Access your dashboard

## 🧪 Testing

### Test Registration (cURL)
```bash
curl -X POST http://localhost:9358/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "Patient",
    "gender": "Male",
    "date_of_birth": "1990-01-15"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:9358/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 🐛 Troubleshooting

### Backend Issues

**MySQL Connection Error:**
```bash
# Check if MySQL is running
brew services list

# Restart MySQL
brew services restart mysql

# Test connection
mysql -u healthcare_user -p'Healthcare@123'
```

**Port Already in Use:**
```bash
# Check what's using port 9358
lsof -i :9358

# Kill the process
kill -9 <PID>
```

### Frontend Issues

**Can't connect to backend:**
- Verify backend is running on port 9358
- Check `client/.env` has correct API URL
- Open browser console for error messages

**Page won't load:**
```bash
# Clear React cache and restart
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📊 Database Schema

### users
| Field | Type | Constraints |
|-------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL (hashed) |
| role | ENUM | Patient, Doctor, Hospital_Admin |
| phone | VARCHAR(20) | Optional |
| address | TEXT | Optional |
| gender | ENUM | Male, Female, Other |
| date_of_birth | DATE | Optional |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

## 🎨 Design System

**Colors:**
- Primary: Mint Green (#A8D5BA)
- Dark: Charcoal (#2B2B2B)
- Background: White (#FFFFFF)
- Text: Dark Gray (#333333)

**Typography:**
- Headers: Bold, 24-32px
- Body: Regular, 14-16px
- Inputs: 14px

## 🚧 Roadmap

- [ ] Hospital directory page
- [ ] Doctor directory with filters
- [ ] Appointment booking system
- [ ] User profile editing
- [ ] Password reset via email
- [ ] Admin dashboard
- [ ] Real-time chat
- [ ] Email notifications

## 📝 License

Academic project for Course 471

## 🤝 Contributing

This is an educational project. Feel free to fork and experiment!

---

**Built with the MERN Stack** | **MVC Architecture** | **RESTful API**
