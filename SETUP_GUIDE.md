# Rakshak AI - Setup & Debugging Guide

## 🚨 CRITICAL ISSUES FIXED

### ✅ Issues Resolved:
1. **Missing Media Model** - Created `backend/models/Media.js`
2. **Missing Firebase Config** - Created `backend/config/firebase.js` with graceful fallback
3. **Network Configuration** - Created smart network config for mobile app
4. **API URL Detection** - Auto-detects emulator vs physical device

### ⚠️ CRITICAL ISSUE REMAINING:

## **MongoDB Connection Failure**

**Problem:** The MongoDB connection string in `.env` is invalid or the cluster doesn't exist.

**Error:** `querySrv ENOTFOUND _mongodb._tcp.m0.xtfqp6k.mongodb.net`

**Solution:**

### Option 1: Create New MongoDB Atlas Cluster (Recommended)
1. Go to https://cloud.mongodb.com
2. Sign up/Login
3. Create a FREE cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `backend/.env` with the new `MONGODB_URI`
7. Replace `<password>` with your database user password

### Option 2: Use Local MongoDB (For Testing)
```bash
# Install MongoDB locally
# Then update .env:
MONGODB_URI=mongodb://localhost:27017/rakshak
```

### Option 3: Continue Without Database (Limited Functionality)
The app will work but:
- ❌ Profile data won't persist on server
- ❌ Alert history won't be saved
- ✅ SMS alerts will still work
- ✅ Location tracking will work (in-memory cache)
- ✅ Real-time features will work

---

## 📱 MOBILE APP SETUP

### Network Configuration

The app now auto-detects the correct backend URL:

- **Android Emulator**: Uses `http://10.0.2.2:5000`
- **iOS Simulator**: Uses `http://localhost:5000`
- **Physical Device**: Edit `mobile/src/config/network.js`

### For Physical Device Testing:

1. Find your computer's local IP:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

2. Edit `mobile/src/config/network.js`:
   ```javascript
   const USE_LOCAL_IP = true;
   const LOCAL_IP = '192.168.1.100'; // Your computer's IP
   ```

3. Ensure phone and computer are on the same WiFi network

4. Update Windows Firewall to allow port 5000:
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "Rakshak Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   ```

---

## 🔧 BACKEND STATUS

### ✅ Working:
- Express server running on port 5000
- CORS enabled
- Socket.IO configured
- Health endpoint: http://localhost:5000/health
- Twilio SMS configured
- File upload configured
- Location services (Overpass API)
- In-memory caching

### ⚠️ Needs Configuration:
- MongoDB connection (see above)
- Firebase push notifications (optional)

---

## 🧪 TESTING CHECKLIST

### Backend Tests:
```bash
cd backend

# Test health endpoint
curl http://localhost:5000/health

# Test profile creation (will fail without MongoDB)
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","name":"Test User","emergencyContacts":[{"name":"Contact","phone":"+1234567890"}]}'
```

### Mobile App Tests:

1. **Profile Setup**
   - ✅ Open app
   - ✅ Navigate to Profile
   - ✅ Fill in name, blood group, medical conditions
   - ✅ Add at least one emergency contact
   - ✅ Save profile

2. **Location Permissions**
   - ✅ Grant location permission when prompted
   - ✅ Verify location is being tracked

3. **SOS Alert**
   - ✅ Tap Medical/Fire/Police emergency button
   - ✅ Verify navigation to Map screen
   - ✅ Check if SMS was sent (check phone's SMS app)
   - ✅ Verify location marker appears on map

4. **Media Capture**
   - ✅ On Map screen, tap Photo/Video button
   - ✅ Grant camera permission
   - ✅ Capture photo/video
   - ✅ Verify upload (will fail without MongoDB)

5. **Offline Mode**
   - ✅ Turn off WiFi/Data
   - ✅ Trigger SOS
   - ✅ Verify SMS app opens with pre-filled message

---

## 🐛 KNOWN ISSUES & FIXES

### Issue: "Network request failed"
**Cause:** Mobile app can't reach backend
**Fix:** 
- Check backend is running: `curl http://localhost:5000/health`
- For physical device: Update `network.js` with your local IP
- Check firewall settings

### Issue: "Profile not found"
**Cause:** MongoDB not connected
**Fix:** Update MongoDB connection string in `.env`

### Issue: SMS not sending
**Cause:** Invalid Twilio credentials
**Fix:** 
1. Verify credentials at https://console.twilio.com
2. Update `.env` with correct values
3. Ensure phone numbers are in E.164 format (+1234567890)

### Issue: Map not loading
**Cause:** OpenStreetMap tiles blocked or slow
**Fix:** 
- Check internet connection
- OSM tiles are free but can be slow
- Consider using Google Maps (requires API key)

### Issue: Camera not working
**Cause:** Permissions not granted
**Fix:**
- Android: Check Settings → Apps → Rakshak AI → Permissions
- iOS: Settings → Rakshak AI → Camera/Photos

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend:
- [ ] Update MongoDB URI to production cluster
- [ ] Set up Firebase for push notifications (optional)
- [ ] Configure environment variables on hosting platform
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure CORS for production domain
- [ ] Set up monitoring/logging

### Mobile:
- [ ] Update `network.js` with production backend URL
- [ ] Test on physical devices (Android & iOS)
- [ ] Configure app signing certificates
- [ ] Update app icons and splash screens
- [ ] Test all permissions on both platforms
- [ ] Build release APK/IPA

---

## 📊 CURRENT STATUS

**Backend:** ✅ Running (MongoDB connection needed for full functionality)
**Mobile:** ⚠️ Ready to test (update network config for physical device)
**SMS:** ✅ Configured (Twilio credentials present)
**Location:** ✅ Working (OpenStreetMap/Overpass API)
**Real-time:** ✅ Working (Socket.IO configured)
**Media Upload:** ⚠️ Needs MongoDB connection
**Push Notifications:** ⚠️ Needs Firebase configuration

---

## 🆘 EMERGENCY FALLBACKS

The app is designed with multiple fallback mechanisms:

1. **No Internet:** Opens SMS app with pre-filled emergency message
2. **No MongoDB:** Uses local storage for profile, in-memory cache for locations
3. **No Firebase:** SMS still works, just no push notifications
4. **API Timeout:** Falls back to offline SMS mode

---

## 📞 NEXT STEPS

1. **IMMEDIATE:** Fix MongoDB connection
   - Create new Atlas cluster OR
   - Use local MongoDB OR
   - Accept limited functionality

2. **TEST:** Run mobile app on emulator/device
   - Follow testing checklist above
   - Report any errors

3. **OPTIONAL:** Configure Firebase for push notifications
   - Get service account JSON from Firebase Console
   - Place in `backend/config/firebase-service-account.json`

---

## 🔍 DEBUGGING COMMANDS

```bash
# Check backend logs
cd backend
npm start

# Check if port 5000 is in use
netstat -ano | findstr :5000

# Test MongoDB connection
# (Install MongoDB Compass and test connection string)

# Check mobile app logs
# Android:
npx react-native log-android

# iOS:
npx react-native log-ios
```

---

**Last Updated:** May 19, 2026
**Status:** Backend running, MongoDB connection needed, Mobile app ready for testing
