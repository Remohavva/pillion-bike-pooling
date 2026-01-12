# PILLION Mobile App

React Native mobile application for the PILLION bike pooling platform.

## Features

- 🔐 **OTP Authentication** - Email and phone-based login via Supabase
- 📍 **Location Services** - GPS-based ride matching and navigation
- 🚴 **Ride Management** - Create, search, and join bike rides
- 🪖 **Helmet Verification** - Camera-based safety compliance
- 🛡️ **Safety Features** - SOS alerts and live location sharing
- 👥 **User Roles** - Rider, Bike Host, and Admin permissions

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **Authentication**: Supabase Auth
- **Location**: Expo Location
- **Camera**: Expo Camera & Image Picker
- **Maps**: React Native Maps (OpenStreetMap)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Supabase**
   - Update `src/context/AuthContext.js` with your Supabase credentials
   - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`

3. **Configure Backend API**
   - Update `src/services/api.js` with your backend URL
   - Default: `http://localhost:8000/api`

4. **Run the App**
   ```bash
   # Start Expo development server
   npm start
   
   # Run on Android
   npm run android
   
   # Run on iOS
   npm run ios
   ```

## Project Structure

```
mobile/
├── src/
│   ├── context/           # React Context providers
│   │   ├── AuthContext.js # Authentication state
│   │   └── LocationContext.js # Location services
│   ├── screens/           # App screens
│   │   ├── AuthScreen.js  # Login/OTP verification
│   │   ├── HomeScreen.js  # Dashboard
│   │   ├── RideSearchScreen.js # Find rides
│   │   ├── CreateRideScreen.js # Create new ride
│   │   ├── HelmetCheckScreen.js # Safety verification
│   │   └── RideStatusScreen.js # Ride management
│   └── services/
│       └── api.js         # Backend API integration
├── App.js                 # Main app component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Key Screens

### 1. Authentication (`AuthScreen.js`)
- Email/Phone OTP login
- User registration flow
- Supabase integration

### 2. Home Dashboard (`HomeScreen.js`)
- User profile display
- Quick action buttons
- Nearby rides overview
- Role-based UI

### 3. Ride Search (`RideSearchScreen.js`)
- GPS-based proximity search
- Configurable search radius
- Ride details and joining

### 4. Create Ride (`CreateRideScreen.js`)
- Ride creation form
- Location selection
- Date/time picker
- Safety requirements

### 5. Helmet Check (`HelmetCheckScreen.js`)
- Camera integration
- Photo capture/gallery
- Safety verification
- Upload to backend

### 6. Ride Status (`RideStatusScreen.js`)
- Ride lifecycle management
- Live location sharing
- Emergency SOS
- Host communication

## Permissions Required

- **Location**: For GPS-based ride matching
- **Camera**: For helmet verification photos
- **Gallery**: For selecting existing photos

## Environment Setup

1. **Development**
   - Backend: `http://localhost:8000`
   - Supabase: Development project

2. **Production**
   - Backend: Your deployed API URL
   - Supabase: Production project
   - Update `api.js` and `AuthContext.js`

## Safety Features

- Mandatory helmet verification
- Live location sharing during rides
- Emergency SOS with location broadcast
- Host contact integration
- Safety tips and guidelines

## Next Steps

1. Set up Supabase project
2. Configure push notifications
3. Add real-time ride updates
4. Implement payment integration
5. Add ride rating system
6. Enhanced map integration