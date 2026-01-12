# PILLION - Bike Pooling Platform

A comprehensive bike pooling application designed for Indian students and daily commuting professionals, focusing on safety and compliance.

## 🎯 Project Overview

PILLION is a mobile-first bike pooling platform that connects riders with bike hosts for safe, efficient commuting. The platform emphasizes safety through mandatory helmet verification and real-time tracking.

## 🏗️ Architecture

### Backend (FastAPI + PostgreSQL)
- **Location**: `./backend/`
- **Tech Stack**: FastAPI, SQLAlchemy, PostgreSQL/SQLite, Supabase Auth
- **Features**: REST APIs, JWT authentication, PostGIS proximity queries, file uploads

### Mobile App (React Native + Expo)
- **Location**: `./mobile/`
- **Tech Stack**: React Native, Expo, React Navigation, Supabase
- **Features**: OTP authentication, GPS location, camera integration, maps

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```
Server runs on: `http://localhost:8000`

### 2. Mobile App Setup
```bash
cd mobile
npm install
npm start
```

## 📱 Core Features

### ✅ Implemented
- **OTP Authentication** - Email and phone-based login via Supabase
- **User Roles** - Rider, Bike Host, Admin with role-based permissions
- **Ride Management** - Create, search, and join rides with GPS proximity
- **Helmet Verification** - Camera-based safety compliance with image upload
- **Location Services** - GPS-based ride matching and current location
- **Safety Features** - SOS alerts, live location sharing, emergency contacts

### 🔄 MVP Ride Lifecycle
1. **CREATED** → Host creates ride with location and time
2. **REQUESTED** → Riders request to join available rides
3. **CONFIRMED** → Host confirms ride participants
4. **ONGOING** → Ride starts with helmet verification
5. **COMPLETED** → Ride ends with rating and feedback

## 🛡️ Safety Features

- **Mandatory Helmet Verification** - Photo-based compliance before ride start
- **Live Location Sharing** - Real-time tracking during rides
- **Emergency SOS** - One-tap emergency alerts with location broadcast
- **Host Communication** - Direct calling and messaging
- **Safety Guidelines** - Built-in tips and best practices

## 🗄️ Database Schema

### Users Table
- User authentication and profile data
- Role-based access control (rider/bike_host/admin)
- Supabase integration for auth

### Rides Table
- Ride details with start/end locations
- GPS coordinates for proximity matching
- Status tracking through lifecycle

### Ride Participants Table
- Many-to-many relationship between users and rides
- Request and confirmation status

### Helmet Checks Table
- Safety verification records
- Image storage and verification status
- Linked to specific rides and users

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Supabase JWT token

### Users
- `POST /api/users/register` - Register new user
- `GET /api/users/profile` - Get user profile

### Rides
- `POST /api/rides/create` - Create new ride (bike hosts only)
- `POST /api/rides/nearby` - Find rides within radius

### Helmet Verification
- `POST /api/helmet/upload` - Upload helmet image
- `POST /api/helmet/verify` - Create verification record
- `GET /api/helmet/check/{ride_id}` - Get verification status

## 📁 Project Structure

```
pillion-bike-pooling/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT authentication
│   │   ├── database.py     # Database connection
│   │   ├── services.py     # Business logic
│   │   └── routes/         # API endpoints
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── rides.py
│   │       └── helmet.py
│   ├── main.py            # FastAPI app
│   ├── run.py             # Server runner
│   └── requirements.txt   # Python dependencies
├── mobile/                # React Native app
│   ├── src/
│   │   ├── context/       # React Context providers
│   │   ├── screens/       # App screens
│   │   └── services/      # API integration
│   ├── App.js            # Main app component
│   └── package.json      # Node dependencies
└── README.md             # This file
```

## 🔐 Environment Setup

### Backend (.env)
```
DATABASE_URL=sqlite:///./pillion.db
JWT_SECRET=your-jwt-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Mobile (AuthContext.js)
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## 🎯 Next Development Steps

### Phase 1: Core Enhancements
- [ ] Real-time ride updates with WebSockets
- [ ] Push notifications for ride status changes
- [ ] Enhanced map integration with route planning
- [ ] Ride rating and feedback system

### Phase 2: Advanced Features
- [ ] Payment integration for ride sharing costs
- [ ] Advanced helmet detection using ML
- [ ] Route optimization algorithms
- [ ] Admin dashboard for platform management

### Phase 3: Scale & Deploy
- [ ] PostgreSQL + PostGIS for production
- [ ] Cloud storage for images (AWS S3/Supabase Storage)
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring and analytics

## 🛠️ Development Guidelines

### Code Standards
- Clean, readable code with minimal abstractions
- Proper error handling and validation
- Security-first approach for all endpoints
- Mobile-first responsive design

### Safety Compliance
- Mandatory helmet verification before rides
- Location permissions only when needed
- Emergency features prominently accessible
- Clear safety guidelines and tips

### Performance
- Efficient proximity queries using spatial indexing
- Optimized image upload and processing
- Minimal battery usage for location services
- Fast app startup and navigation

## 📊 Current Status

✅ **Backend**: Fully functional API with authentication, ride management, and helmet verification  
✅ **Mobile**: Complete UI with all core screens and navigation  
✅ **Database**: SQLite for development, ready for PostgreSQL migration  
✅ **Authentication**: Supabase integration with OTP support  
✅ **Safety**: Helmet verification workflow implemented  

## 🤝 Contributing

1. Follow the established code structure
2. Maintain security best practices
3. Test all features thoroughly
4. Update documentation for new features
5. Ensure mobile-first design principles

## 📄 License

This project is developed as an MVP for bike pooling services with focus on safety and compliance for Indian markets.
