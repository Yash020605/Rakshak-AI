# ✅ Rakshak AI - Testing Checklist

**Use this checklist to verify all features are working correctly.**

---

## 🎯 Pre-Testing Setup

- [ ] Backend server is running (check: `curl http://localhost:5000/health`)
- [ ] Mobile app installed on device/emulator
- [ ] Location permission granted
- [ ] Camera permission granted
- [ ] SMS permission granted (Android)
- [ ] Internet connection available

---

## 📱 Mobile App Launch

- [ ] App launches without crashes
- [ ] Home screen displays correctly
- [ ] Three emergency buttons visible (Medical, Fire, Police)
- [ ] Profile button visible at bottom
- [ ] App name "Rakshak AI" displays correctly

---

## 👤 Profile Management

### Create Profile
- [ ] Navigate to Profile screen
- [ ] Enter name (required field)
- [ ] Select blood group from chips
- [ ] Enter medical conditions (optional)
- [ ] Add at least one emergency contact
  - [ ] Contact name entered
  - [ ] Contact phone number entered (format: +1234567890)
- [ ] Add second emergency contact (optional)
- [ ] Tap "Save Profile"
- [ ] Success message appears
- [ ] Navigate back to home screen
- [ ] Profile name displays at bottom ("Signed in as...")

### Edit Profile
- [ ] Navigate to Profile screen again
- [ ] Previous data is loaded correctly
- [ ] Modify any field
- [ ] Save successfully
- [ ] Changes persist after app restart

---

## 🚨 Emergency Alert Testing

### Medical Emergency (🚑)
- [ ] Tap "Medical Emergency" button
- [ ] Phone vibrates
- [ ] Loading indicator appears
- [ ] Navigation to Map screen occurs
- [ ] Map screen shows:
  - [ ] Red banner with "MEDICAL EMERGENCY"
  - [ ] Map loads correctly
  - [ ] User location marker appears (red pin)
  - [ ] Location is accurate
- [ ] SMS app opens (or check SMS sent)
- [ ] SMS contains:
  - [ ] "MEDICAL EMERGENCY" text
  - [ ] Your name
  - [ ] Blood group
  - [ ] Medical conditions (if any)
  - [ ] Location link (OpenStreetMap)
  - [ ] "Sent via Rakshak AI" footer
- [ ] SMS sent to all emergency contacts

### Fire Emergency (🔥)
- [ ] Return to home screen
- [ ] Tap "Fire Emergency" button
- [ ] Phone vibrates
- [ ] Navigation to Map screen
- [ ] Orange banner with "FIRE EMERGENCY"
- [ ] SMS contains "FIRE EMERGENCY" text
- [ ] All other SMS details correct

### Police Emergency (🚓)
- [ ] Return to home screen
- [ ] Tap "Crime / Threat" button
- [ ] Phone vibrates
- [ ] Navigation to Map screen
- [ ] Blue banner with "CRIME/THREAT EMERGENCY"
- [ ] SMS contains "CRIME/THREAT EMERGENCY" text
- [ ] All other SMS details correct

---

## 🗺️ Map Screen Features

### Map Display
- [ ] Map loads without errors
- [ ] OpenStreetMap tiles display
- [ ] User location marker visible
- [ ] Can zoom in/out
- [ ] Can pan around map
- [ ] "My Location" button works

### Live Location Tracking
- [ ] Move device/change location in emulator
- [ ] Location marker updates in real-time
- [ ] Map follows user location
- [ ] Location updates smooth (not jumpy)

### Action Buttons
- [ ] Photo button (📷) visible
- [ ] Video button (🎥) visible
- [ ] "Resolved" button visible

---

## 📸 Media Capture

### Photo Capture
- [ ] Tap photo button (📷)
- [ ] Camera permission requested (if first time)
- [ ] Camera opens
- [ ] Take photo
- [ ] Photo preview appears
- [ ] Confirm/Use photo
- [ ] Upload indicator appears
- [ ] Success message (or error if MongoDB not connected)

### Video Capture
- [ ] Tap video button (🎥)
- [ ] Camera opens in video mode
- [ ] Record video (max 30 seconds)
- [ ] Stop recording
- [ ] Video preview appears
- [ ] Confirm/Use video
- [ ] Upload indicator appears
- [ ] Success message (or error if MongoDB not connected)

---

## ✓ Resolve Alert

- [ ] On Map screen, tap "Resolved" button
- [ ] Confirmation dialog appears
- [ ] Tap "Resolve"
- [ ] Navigation back to home screen
- [ ] Can trigger new alert

---

## 🌐 Network Scenarios

### Online Mode (WiFi/Data On)
- [ ] Trigger SOS alert
- [ ] Alert sent to backend server
- [ ] Real-time location updates work
- [ ] Socket.IO connection active
- [ ] SMS sent via Twilio (if configured)

### Offline Mode (WiFi/Data Off)
- [ ] Turn off WiFi and mobile data
- [ ] Trigger SOS alert
- [ ] App detects offline status
- [ ] SMS app opens automatically
- [ ] Pre-filled message contains all details
- [ ] Can send SMS via device's native SMS

### Poor Connection
- [ ] Enable slow/unstable connection
- [ ] Trigger SOS alert
- [ ] App handles timeout gracefully
- [ ] Falls back to offline SMS mode
- [ ] User notified of connection issue

---

## 🔄 Real-Time Features

### Socket.IO Connection
- [ ] Backend logs show "Client connected"
- [ ] Location updates broadcast in real-time
- [ ] Alert events received
- [ ] Connection persists during app usage
- [ ] Reconnects after network interruption

---

## 🔐 Permissions

### Location Permission
- [ ] Requested on first launch
- [ ] "Allow all the time" or "While using app" granted
- [ ] Location updates work correctly
- [ ] Accurate location obtained (within 10-50 meters)

### Camera Permission
- [ ] Requested when tapping photo/video button
- [ ] Camera access granted
- [ ] Can capture photos and videos

### SMS Permission (Android)
- [ ] Requested when sending SMS
- [ ] SMS sending works correctly

---

## 🔄 App Lifecycle

### Background/Foreground
- [ ] Send app to background
- [ ] Bring app to foreground
- [ ] App resumes correctly
- [ ] Location tracking continues
- [ ] Socket connection maintained

### App Restart
- [ ] Close app completely
- [ ] Reopen app
- [ ] Profile data persists
- [ ] Can trigger new alerts
- [ ] All features work

---

## 🐛 Error Handling

### No Profile
- [ ] Delete profile (or fresh install)
- [ ] Tap emergency button
- [ ] Alert prompts to create profile
- [ ] "Set Up" button navigates to Profile screen

### Location Denied
- [ ] Deny location permission
- [ ] Tap emergency button
- [ ] App handles gracefully
- [ ] User prompted to enable location

### Camera Denied
- [ ] Deny camera permission
- [ ] Tap photo/video button
- [ ] App handles gracefully
- [ ] User prompted to enable camera

### Network Error
- [ ] Simulate network error
- [ ] App doesn't crash
- [ ] Error message displayed
- [ ] Falls back to offline mode

---

## 🎨 UI/UX

### Visual Design
- [ ] Dark theme consistent throughout
- [ ] Colors match emergency types (red, orange, blue)
- [ ] Text readable on all backgrounds
- [ ] Icons display correctly
- [ ] Buttons have proper touch feedback

### Navigation
- [ ] Can navigate between screens
- [ ] Back button works correctly
- [ ] Navigation stack maintained
- [ ] No navigation loops

### Responsiveness
- [ ] UI adapts to screen size
- [ ] Keyboard doesn't cover inputs
- [ ] Scrolling works where needed
- [ ] Touch targets are adequate size

---

## 🔧 Backend API

### Health Check
```bash
curl http://localhost:5000/health
```
- [ ] Returns: `{"status":"ok","service":"Rakshak AI"}`

### Location Update
```bash
curl -X POST http://localhost:5000/api/location/update \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","latitude":19.0760,"longitude":72.8777}'
```
- [ ] Returns: `{"success":true}`

### Get Live Location
```bash
curl http://localhost:5000/api/location/live/test
```
- [ ] Returns location data with latitude, longitude, updatedAt

---

## 📊 Performance

### App Performance
- [ ] App launches in < 3 seconds
- [ ] Emergency button responds immediately
- [ ] Map loads in < 5 seconds
- [ ] Location updates in < 2 seconds
- [ ] No lag or stuttering

### Backend Performance
- [ ] API responds in < 500ms
- [ ] Location updates process quickly
- [ ] Socket.IO events instant
- [ ] No memory leaks

---

## 🔒 Security

### Data Privacy
- [ ] Profile data stored securely (AsyncStorage)
- [ ] No sensitive data in logs
- [ ] Location data encrypted in transit
- [ ] SMS messages secure

### Permissions
- [ ] Only necessary permissions requested
- [ ] Permissions requested at appropriate time
- [ ] Can deny permissions without crash

---

## 📝 Edge Cases

### Empty Profile
- [ ] Create profile with minimal data (name + 1 contact)
- [ ] Trigger alert
- [ ] SMS contains available data only

### Multiple Contacts
- [ ] Add 5 emergency contacts
- [ ] Trigger alert
- [ ] SMS sent to all contacts

### Special Characters
- [ ] Enter name with special characters
- [ ] Enter medical conditions with emojis
- [ ] Save and trigger alert
- [ ] Data displays correctly in SMS

### Long Text
- [ ] Enter very long medical conditions
- [ ] Save profile
- [ ] Trigger alert
- [ ] SMS truncates gracefully if needed

---

## ✅ Final Verification

### Critical Features
- [ ] ✅ Can trigger emergency alert
- [ ] ✅ SMS sent to emergency contacts
- [ ] ✅ Location tracked accurately
- [ ] ✅ Map displays correctly
- [ ] ✅ Profile saved and loaded
- [ ] ✅ Offline mode works
- [ ] ✅ App stable (no crashes)

### Optional Features
- [ ] ⚠️ Media upload (needs MongoDB)
- [ ] ⚠️ Alert history (needs MongoDB)
- [ ] ⚠️ Push notifications (needs Firebase)

---

## 🎯 Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Device:** _______________  
**OS Version:** _______________

**Tests Passed:** _____ / _____  
**Tests Failed:** _____ / _____  
**Tests Skipped:** _____ / _____

**Critical Issues Found:**
- 
- 
- 

**Minor Issues Found:**
- 
- 
- 

**Overall Status:** ⬜ PASS  ⬜ FAIL  ⬜ NEEDS WORK

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## 📞 If Tests Fail

1. Check `DEBUG_REPORT.md` for known issues
2. Verify backend is running
3. Check network configuration
4. Review app logs: `npx react-native log-android`
5. Check backend logs in terminal
6. Verify all permissions granted

---

**Happy Testing! 🚀**
