# 🚀 Rakshak AI - Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Current Status:
- ✅ Backend: RUNNING on http://localhost:5000
- ⚠️ MongoDB: NOT CONNECTED (optional for basic testing)
- ✅ Mobile: READY TO TEST

---

## 📱 Option 1: Test on Android Emulator (Recommended)

### Step 1: Start Android Emulator
```bash
# Open Android Studio → AVD Manager → Start any emulator
# OR use command line:
emulator -avd Pixel_5_API_30
```

### Step 2: Run Mobile App
```bash
cd mobile
npx react-native run-android
```

### Step 3: Test the App
1. Grant location permission when prompted
2. Tap "👤 My Profile"
3. Fill in your details:
   - Name: Your Name
   - Blood Group: Select one
   - Emergency Contact: Add at least one
4. Tap "Save Profile"
5. Go back to home screen
6. Tap any emergency button (Medical/Fire/Police)
7. Verify:
   - Map screen appears
   - Your location marker shows
   - Check your phone's SMS app for sent message

---

## 📱 Option 2: Test on Physical Device

### Step 1: Find Your Computer's IP
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)

### Step 2: Update Mobile App Configuration
Edit `mobile/src/config/network.js`:
```javascript
const USE_LOCAL_IP = true;
const LOCAL_IP = '192.168.1.100'; // Replace with YOUR IP
```

### Step 3: Allow Firewall (Run as Administrator)
```powershell
New-NetFirewallRule -DisplayName "Rakshak Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Step 4: Connect Phone
- Enable USB Debugging on your phone
- Connect via USB
- Verify: `adb devices` shows your device

### Step 5: Run App
```bash
cd mobile
npx react-native run-android
```

---

## 🧪 Quick Backend Test

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"ok","service":"Rakshak AI"}`

### Test 2: Location Update
```bash
curl -X POST http://localhost:5000/api/location/update ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test123\",\"latitude\":19.0760,\"longitude\":72.8777}"
```
Expected: `{"success":true}`

### Test 3: Get Location
```bash
curl http://localhost:5000/api/location/live/test123
```
Expected: `{"latitude":19.076,"longitude":72.8777,"updatedAt":...}`

---

## 🔧 Troubleshooting

### "Metro bundler not running"
```bash
cd mobile
npx react-native start
# In another terminal:
npx react-native run-android
```

### "Network request failed" on mobile
1. Check backend is running: `curl http://localhost:5000/health`
2. For physical device: Verify IP address in `network.js`
3. Check firewall allows port 5000
4. Ensure phone and computer on same WiFi

### "Profile not found" error
- This is expected without MongoDB
- Profile is saved locally on device
- SMS alerts still work!

### "Location permission denied"
- Go to Settings → Apps → Rakshak AI → Permissions
- Enable Location permission
- Restart app

---

## 📊 What Works Without MongoDB

✅ **Working Features:**
- Profile creation (saved locally)
- Location tracking
- SOS button triggers
- Map display
- SMS alerts (opens SMS app)
- Real-time location updates
- Offline mode

❌ **Not Working Without MongoDB:**
- Profile sync to server
- Alert history
- Media upload metadata
- Cross-device profile access

---

## 🎯 Expected Behavior

### When You Tap SOS Button:
1. App vibrates
2. Gets your current location
3. Navigates to Map screen
4. Shows your location marker
5. Opens SMS app with pre-filled emergency message
6. Message includes:
   - Emergency type
   - Your name and blood group
   - Medical conditions
   - Your location link
   - Sent to all emergency contacts

### On Map Screen:
- See your live location
- Location updates in real-time
- Can capture photo/video (camera button)
- Can mark alert as resolved

---

## 🚨 Emergency Testing

### Test Medical Emergency:
1. Tap 🚑 Medical Emergency
2. Verify SMS contains "MEDICAL EMERGENCY"
3. Check location link works in SMS

### Test Fire Emergency:
1. Tap 🔥 Fire Emergency
2. Verify SMS contains "FIRE EMERGENCY"

### Test Police Emergency:
1. Tap 🚓 Crime/Threat
2. Verify SMS contains "CRIME/THREAT EMERGENCY"

---

## 📞 Next Steps After Testing

### If Everything Works:
1. ✅ Read `DEBUG_REPORT.md` for detailed status
2. ✅ Fix MongoDB connection for full functionality
3. ✅ Configure Firebase for push notifications (optional)
4. ✅ Deploy to production

### If Something Doesn't Work:
1. Check `DEBUG_REPORT.md` for solutions
2. Check backend logs in terminal
3. Check mobile app logs: `npx react-native log-android`
4. Verify all permissions granted

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ App launches without crashes
- ✅ Can create and save profile
- ✅ Location permission granted
- ✅ SOS button opens map screen
- ✅ SMS app opens with emergency message
- ✅ Location marker appears on map
- ✅ Can navigate back to home screen

---

## 📚 Additional Resources

- **Full Debug Report:** `DEBUG_REPORT.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Backend API Test:** `backend/test-api.js`

---

**Ready to test? Start with Option 1 (Android Emulator) for fastest results!**
