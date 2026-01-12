# PILLION Deployment Guide

## 🚀 Production Deployment

This guide covers deploying PILLION to production with real-time features, push notifications, and scalable infrastructure.

## 📋 Prerequisites

- Supabase account and project
- Cloud hosting account (Render, Railway, or AWS)
- Domain name (optional but recommended)
- Firebase account for push notifications (optional)

## 🔧 Backend Deployment

### Option 1: Deploy to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure:
     - **Name**: `pillion-api`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Instance Type**: `Starter` (free tier)

3. **Environment Variables**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   UPLOAD_DIR=/opt/render/project/src/uploads
   MAX_FILE_SIZE=5242880
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your API will be available at: `https://pillion-api.onrender.com`

### Option 2: Deploy to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository

2. **Deploy Service**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Python and deploys

3. **Configure Environment**
   - Go to Variables tab
   - Add all environment variables from above

4. **Custom Domain** (optional)
   - Go to Settings → Domains
   - Add custom domain or use Railway subdomain

## 🗄️ Database Setup

### PostgreSQL with PostGIS

1. **Create Database**
   ```bash
   # On your hosting platform or separate database service
   createdb pillion_production
   ```

2. **Enable PostGIS**
   ```sql
   CREATE EXTENSION postgis;
   CREATE EXTENSION postgis_topology;
   ```

3. **Update Connection String**
   ```env
   DATABASE_URL=postgresql://username:password@host:port/pillion_production
   ```

4. **Run Migrations**
   ```bash
   # Your FastAPI app will create tables automatically
   # Or run manual migrations if needed
   ```

## 📱 Mobile App Deployment

### Expo Build Service

1. **Configure app.json**
   ```json
   {
     "expo": {
       "name": "PILLION",
       "slug": "pillion-bike-pooling",
       "version": "1.0.0",
       "android": {
         "package": "com.pillion.bikepool",
         "versionCode": 1
       },
       "ios": {
         "bundleIdentifier": "com.pillion.bikepool",
         "buildNumber": "1.0.0"
       }
     }
   }
   ```

2. **Update API URLs**
   ```javascript
   // src/services/api.js
   const API_BASE_URL = 'https://pillion-api.onrender.com/api';
   
   // src/services/websocket.js
   const wsUrl = `wss://pillion-api.onrender.com/api/ws/${token}`;
   ```

3. **Build for Android**
   ```bash
   cd mobile
   expo build:android
   ```

4. **Build for iOS** (requires Apple Developer account)
   ```bash
   expo build:ios
   ```

## 🔔 Push Notifications Setup

### Firebase Cloud Messaging (FCM)

1. **Create Firebase Project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Create new project: "PILLION"

2. **Add Android App**
   - Package name: `com.pillion.bikepool`
   - Download `google-services.json`
   - Place in `mobile/` directory

3. **Configure Expo**
   ```json
   // app.json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       },
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#2563eb"
           }
         ]
       ]
     }
   }
   ```

4. **Backend Integration**
   ```python
   # Install firebase-admin
   pip install firebase-admin
   
   # Add to notifications.py
   import firebase_admin
   from firebase_admin import credentials, messaging
   
   # Initialize Firebase
   cred = credentials.Certificate("path/to/serviceAccountKey.json")
   firebase_admin.initialize_app(cred)
   ```

## 🌐 Domain & SSL

### Custom Domain Setup

1. **Purchase Domain**
   - Recommended: Namecheap, GoDaddy, or Cloudflare

2. **Configure DNS**
   ```
   Type: CNAME
   Name: api
   Value: pillion-api.onrender.com
   ```

3. **SSL Certificate**
   - Render/Railway provides automatic SSL
   - Or use Cloudflare for additional security

## 📊 Monitoring & Analytics

### Application Monitoring

1. **Sentry for Error Tracking**
   ```bash
   pip install sentry-sdk[fastapi]
   ```

   ```python
   # main.py
   import sentry_sdk
   from sentry_sdk.integrations.fastapi import FastApiIntegration
   
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       integrations=[FastApiIntegration()]
   )
   ```

2. **Logging Setup**
   ```python
   import logging
   
   logging.basicConfig(
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   )
   ```

### Database Monitoring

1. **Connection Pooling**
   ```python
   # database.py
   engine = create_engine(
       DATABASE_URL,
       pool_size=20,
       max_overflow=0,
       pool_pre_ping=True
   )
   ```

2. **Query Optimization**
   ```sql
   -- Add indexes for performance
   CREATE INDEX idx_rides_location ON rides USING GIST (ST_Point(start_lng, start_lat));
   CREATE INDEX idx_rides_status ON rides (status);
   CREATE INDEX idx_rides_departure ON rides (departure_time);
   ```

## 🔒 Security Hardening

### Production Security

1. **Environment Variables**
   ```env
   # Never commit these to version control
   JWT_SECRET=super-secure-random-string-256-bits
   SUPABASE_SERVICE_ROLE_KEY=keep-this-secret
   DATABASE_URL=postgresql://secure-connection
   ```

2. **CORS Configuration**
   ```python
   # main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourdomain.com"],  # Specific domains only
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE"],
       allow_headers=["*"],
   )
   ```

3. **Rate Limiting**
   ```bash
   pip install slowapi
   ```

   ```python
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
   ```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**
   - Use Render/Railway built-in load balancing
   - Or configure Nginx for custom setups

2. **Database Scaling**
   - Read replicas for heavy read workloads
   - Connection pooling with PgBouncer
   - Database sharding for extreme scale

3. **File Storage**
   - Move from local storage to AWS S3 or Supabase Storage
   - CDN for faster image delivery

### Performance Optimization

1. **Caching**
   ```bash
   pip install redis
   ```

   ```python
   # Add Redis caching for frequent queries
   import redis
   
   redis_client = redis.Redis(host='localhost', port=6379, db=0)
   ```

2. **Background Tasks**
   ```bash
   pip install celery
   ```

   ```python
   # For heavy operations like image processing
   from celery import Celery
   
   celery_app = Celery('pillion')
   ```

## 🧪 Testing in Production

### Health Checks

1. **API Health Endpoint**
   ```bash
   curl https://your-api.com/health
   ```

2. **WebSocket Connection**
   ```bash
   # Test WebSocket connectivity
   wscat -c wss://your-api.com/api/ws/test-token
   ```

3. **Database Connection**
   ```bash
   # Test database queries
   curl https://your-api.com/api/status
   ```

### Load Testing

1. **API Load Test**
   ```bash
   # Install artillery
   npm install -g artillery
   
   # Create test config
   artillery quick --count 100 --num 10 https://your-api.com/health
   ```

2. **WebSocket Load Test**
   ```bash
   # Test concurrent WebSocket connections
   artillery run websocket-test.yml
   ```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Monitoring tools setup

### Post-Deployment
- [ ] API endpoints responding correctly
- [ ] WebSocket connections working
- [ ] Push notifications sending
- [ ] Database queries optimized
- [ ] Error tracking active
- [ ] Performance monitoring enabled

### Mobile App
- [ ] API URLs updated to production
- [ ] Push notification tokens configured
- [ ] App store metadata prepared
- [ ] Testing on real devices completed
- [ ] App store submission ready

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check firewall settings
   - Verify SSL certificate for WSS
   - Test with different clients

2. **Database Connection Timeout**
   - Check connection string
   - Verify network connectivity
   - Review connection pool settings

3. **Push Notifications Not Sending**
   - Verify Firebase configuration
   - Check device token registration
   - Review notification permissions

### Debug Commands

```bash
# Check API status
curl -v https://your-api.com/health

# Test database connection
curl -H "Authorization: Bearer TOKEN" https://your-api.com/api/users/profile

# WebSocket test
wscat -c wss://your-api.com/api/ws/TOKEN
```

## 🎯 Success Metrics

### Key Performance Indicators

- **API Response Time**: < 200ms average
- **WebSocket Connection Success**: > 95%
- **Database Query Time**: < 100ms average
- **Push Notification Delivery**: > 90%
- **App Crash Rate**: < 1%
- **User Retention**: Track weekly/monthly active users

Your PILLION platform is now ready for production deployment with real-time features, push notifications, and scalable infrastructure!