# Supabase Setup Guide for PILLION

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `pillion-bike-pooling`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
4. Wait for project to be created (2-3 minutes)

## 2. Configure Authentication

### Enable Email & Phone Auth
1. Go to **Authentication > Settings**
2. Enable **Email** authentication
3. Enable **Phone** authentication
4. Configure email templates (optional)
5. Set up SMS provider (Twilio recommended for India)

### Configure Auth Settings
```sql
-- In SQL Editor, run these commands:

-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create custom user profiles table (optional)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'rider',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read/update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 3. Get Project Credentials

1. Go to **Settings > API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

## 4. Configure JWT Secret

1. Go to **Settings > API**
2. Copy **JWT Secret** for backend verification
3. This is used to verify tokens in your FastAPI backend

## 5. Update Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:///./pillion.db

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-jwt-secret-from-supabase

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB
```

### Mobile (src/config/supabase.js)
```javascript
export const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

## 6. Test Authentication

### Test Email OTP
```javascript
// In your mobile app
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'test@example.com'
});
```

### Test Phone OTP (India)
```javascript
// Format: +91XXXXXXXXXX
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+919876543210'
});
```

## 7. Configure Storage (for Helmet Images)

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket: `helmet-images`
3. Set bucket to **Public** for easy access
4. Configure RLS policies:

```sql
-- Allow authenticated users to upload helmet images
CREATE POLICY "Authenticated users can upload helmet images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'helmet-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to helmet images
CREATE POLICY "Public read access for helmet images" ON storage.objects
  FOR SELECT USING (bucket_id = 'helmet-images');
```

## 8. Production Considerations

### Security
- Never expose Service Role Key in frontend
- Use RLS policies for data security
- Implement proper CORS settings
- Use HTTPS in production

### Performance
- Enable connection pooling
- Set up database indexes
- Configure caching headers
- Monitor usage and scaling

### Monitoring
- Set up alerts for auth failures
- Monitor database performance
- Track API usage limits
- Set up error logging

## 9. Testing Checklist

- [ ] Email OTP works
- [ ] Phone OTP works (test with Indian numbers)
- [ ] JWT tokens are properly verified in backend
- [ ] User registration creates profile
- [ ] File upload to storage works
- [ ] RLS policies are working
- [ ] Mobile app connects successfully

## 10. Troubleshooting

### Common Issues
1. **CORS errors**: Check allowed origins in Supabase settings
2. **JWT verification fails**: Ensure JWT_SECRET matches Supabase
3. **Phone OTP not received**: Check SMS provider configuration
4. **File upload fails**: Verify storage bucket permissions

### Debug Commands
```bash
# Test backend connection
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/profile

# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/
```

This setup will provide production-ready authentication and storage for your PILLION platform.