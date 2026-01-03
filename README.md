# pillion-bike-pooling
# PILLION 🏍️  
## A GPS-Enabled Bike Pooling Platform with Safety Compliance

PILLION is a mobile-first bike pooling application designed to enable safe, affordable, and efficient daily commute sharing.  
The platform uses GPS-based route matching to connect riders with nearby bike hosts and enforces mandatory helmet compliance to promote road safety.

This project focuses on real-world feasibility, privacy-aware location tracking, and scalable system design.

---

## 🚀 Key Features

- GPS-based ride matching using proximity and time-window logic  
- Bike pooling for daily and recurring commutes  
- Mandatory helmet selfie verification before starting a ride  
- Role-based access control (Rider, Bike Host, Admin)  
- Mobile application for riders and hosts  
- Web-based admin dashboard  
- Privacy-first design with no background tracking  

---

## 🛠 Technology Stack

### 📱 Mobile Application
- React Native  
- Expo  
- OpenStreetMap  

### 🌐 Web Application
- Next.js  
- Leaflet.js  

### ⚙️ Backend
- FastAPI / Django REST Framework  
- RESTful APIs  
- JWT-based Authentication  

### 🗄 Database
- PostgreSQL  
- PostGIS (for geospatial queries)  

### ☁️ Deployment
- Backend: Render  
- Web Frontend: Vercel  
- Mobile Build: Expo (Android APK)  

---

## 🧠 System Architecture
Mobile App / Web App
↓
Backend APIs
↓
PostgreSQL + PostGIS




The system follows a stateless API architecture, allowing seamless communication between mobile, web, and backend services.

---

## 📍 GPS & Ride Matching

- GPS coordinates are captured only during active ride flows  
- Matching is performed using radius-based spatial proximity  
- Time-window overlap ensures feasible ride pooling  
- Manual pickup pin selection is supported to handle GPS inaccuracies  

---

## 🪖 Safety & Helmet Verification

- Helmet usage is enforced in accordance with road safety regulations  
- A helmet selfie is required before starting a ride  
- Images are timestamped and stored temporarily  
- No facial recognition or biometric analysis is performed  

---

## 🔐 Privacy & Security

- No background GPS tracking  
- Camera and GPS permissions are requested only when required  
- Helmet images are automatically deleted after verification  
- Secure token-based authentication is used  

---

## 📦 Project Status

🚧 In active development  
⏳ Estimated timeline: 8–9 weeks  

---

## 👨‍💻 Author

**Ramu**

---

## 📜 License

This project is licensed under the MIT License.
