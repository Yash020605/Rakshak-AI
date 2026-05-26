# 🚀 Rakshak AI - Live Testing Guide

**Date:** May 19, 2026  
**Status:** ✅ BOTH SYSTEMS RUNNING

---

## ✅ WHAT'S RUNNING NOW

### 1. Backend Server ✅
- **URL:** http://localhost:5000
- **Status:** Running
- **Terminal:** Background process (Terminal ID: 2)
- **MongoDB:** Connected

### 2. Emergency Services Dashboard ✅
- **URL:** http://localhost:5000/dashboard
- **Status:** Open in your browser
- **Features:**
  - Live map view
  - Real-time alerts
  - One-click dispatch

### 3. Mobile App ✅
- **Device:** Nothing Phone 3A (00161352H004576)
- **Status:** Building and deploying
- **Network:** Configured to connect to 10.5.69.205:5000
- **Terminal:** Background process (Terminal ID: 3)

---

## 📱 TESTING STEPS

### Step 1: Wait for App Installation (2-3 minutes)
The app is currently building and will automatically install on your Nothing Phone 3A.

**You'll know it's ready when:**
- App icon appears on your phone
- Build process shows "BUILD SUCCESSFUL"
- App launches automatically

### Step 2: Set Up Your Profile
1. Open the Rakshak AI app on your phone
2. Tap "👤 My Profile"
3. Fill in your details:
   - Name: Your name
   - Age: Your age
   - Blood Group: Select from dropdown
   - Medical Conditions: Any allergies or conditions
   - Emergency Contacts: Add 5 phone numbers (format: +919876543210)
4. Tap "Save Profile"

### Step 3: Position Your Dashboard
1. On your computer, you should see the dashboard in your browser
2. You'll see:
   - A map (centered on India)
   - "No active alerts" message
   - Connection status: "Connected"
   - Active alerts count: 0

### Step 4: Trigger Your First SOS
1. On your phone, go back to home screen
2. Choose an emergency type:
   - 🚑 **Medical Emergency** (Red button)
   - 🔥 **Fire Emergency** (Orange button)
   - 🚓 **Crime/Threat** (Blue button)
3. Tap the button ONCE
4. Your phone will vibrate

### Step 5: Watch the Magic Happen ✨

**On Your Phone:**
- Loading indicator appears
- Navigates to map screen
- Shows "SOS Active" banner
- Displays your location

**On Your Dashboard (Computer):**
- Within 1-2 seconds:
  - ✅ Colored pin appears on map
  - ✅ Alert card appears in right panel
  - ✅ Alert count updates to "1"
  - ✅ Sound notification plays

**SMS Sent to Family:**
- All 5 emergency contacts receive SMS with:
  - Your name and blood group
  - Medical conditions
  - Live location link

### Step 6: Accept the Alert (Dashboard)
1. On your computer dashboard, click the alert pin or card
2. Modal opens showing:
   - Your name, age, blood group
   - Medical conditions
   - Exact GPS coordinates
   - Google Maps link
   - Time triggered
3. Click "Accept & Dispatch"
4. Enter responder name (e.g., "City Hospital Unit 5")
5. Click OK

### Step 7: Verify Status Sync

**On Your Phone:**
- Banner updates: "✅ City Hospital Unit 5 dispatched"
- Alert dialog appears: "Help is on the way!"

**On Your Dashboard:**
- Alert status changes to "Dispatched"
- Modal shows "Help Dispatched"

**Family SMS:**
- Tracking link updates with dispatch status

---

## 🎯 WHAT TO TEST

### Basic Functionality:
- [ ] Profile creation and saving
- [ ] All 3 emergency button types
- [ ] Location permission granted
- [ ] Map displays your location
- [ ] SOS triggers successfully

### Dual-Routing:
- [ ] SMS sent to emergency contacts
- [ ] Dashboard receives alert
- [ ] Both happen simultaneously
- [ ] Alert appears on map
- [ ] Alert appears in panel

### Dashboard Features:
- [ ] Can click alert pin
- [ ] Modal shows full details
- [ ] Can accept and dispatch
- [ ] Status updates in real-time

### Status Synchronization:
- [ ] Phone shows dispatch notification
- [ ] Dashboard shows "Dispatched" status
- [ ] Multiple dashboards stay in sync (if you open multiple browser tabs)

### Edge Cases:
- [ ] Trigger SOS without profile (should prompt to create)
- [ ] Trigger SOS without location permission (should request)
- [ ] Multiple alerts at once
- [ ] Resolve alert from dashboard

---

## 🔍 MONITORING

### Check Backend Logs:
The backend is running in the background. To see logs, you can check the terminal output.

### Check Mobile App Logs:
If the app crashes or has issues, check the React Native Metro bundler output.

### Check Dashboard Console:
Open browser DevTools (F12) to see WebSocket connection status and any errors.

---

## 🐛 TROUBLESHOOTING

### Mobile App Issues:

**"Network request failed"**
- Make sure your phone and computer are on the same WiFi network
- Check if backend is running: http://10.5.69.205:5000/health
- Verify IP address is correct (10.5.69.205)

**"Location permission denied"**
- Go to Settings → Apps → Rakshak AI → Permissions
- Enable Location permission

**"Profile not found"**
- Create profile first before triggering SOS

**App won't install:**
- Enable USB debugging on your phone
- Check ADB connection: Run `adb devices` in terminal
- Try: `adb uninstall com.rakshak` then rebuild

### Dashboard Issues:

**"Disconnected" status**
- Refresh the page
- Check if backend is running
- Check browser console for errors

**Alerts not appearing:**
- Check WebSocket connection in browser console
- Verify backend is running
- Try refreshing dashboard

**Can't accept alert:**
- Check if alert is already dispatched
- Verify backend API is responding
- Check browser console for errors

### Backend Issues:

**Server not responding:**
- Check if process is running
- Restart backend: Stop and run `npm start` again
- Check port 5000 is not in use

---

## 📊 EXPECTED BEHAVIOR

### Timing:
- **SOS Trigger:** < 1 second
- **SMS Delivery:** 2-5 seconds
- **Dashboard Alert:** < 2 seconds
- **Status Sync:** < 1 second

### Network Traffic:
- **Profile Save:** Local storage (no network)
- **SOS Trigger:** POST to /api/alert/sos
- **Location Update:** POST to /api/location/update
- **WebSocket:** Real-time bidirectional
- **SMS:** Via Twilio API

---

## 🎉 SUCCESS CRITERIA

You'll know everything is working when:

✅ **Mobile App:**
- Profile saved successfully
- SOS button triggers alert
- Map shows your location
- Dispatch notification appears

✅ **Dashboard:**
- Alert appears on map
- Alert details are complete
- Can accept and dispatch
- Status updates in real-time

✅ **SMS:**
- Family receives message
- Contains location link
- Shows medical info

✅ **Synchronization:**
- All systems update together
- No delays or lag
- Status consistent everywhere

---

## 📞 QUICK COMMANDS

### Stop Backend:
```powershell
# Find the process and stop it
Get-Process -Name node | Where-Object {$_.Path -like "*backend*"} | Stop-Process
```

### Restart Mobile App:
```powershell
cd mobile
npx react-native run-android
```

### View Backend Logs:
Check the terminal where backend is running

### Clear App Data:
```powershell
adb shell pm clear com.rakshak
```

### Reinstall App:
```powershell
adb uninstall com.rakshak
cd mobile
npx react-native run-android
```

---

## 🌐 URLS

- **Backend API:** http://10.5.69.205:5000/api
- **Dashboard:** http://localhost:5000/dashboard
- **Health Check:** http://localhost:5000/health
- **Socket.IO:** ws://10.5.69.205:5000

---

## 📱 DEVICE INFO

- **Device:** Nothing Phone 3A
- **Device ID:** 00161352H004576
- **Connection:** USB (ADB)
- **Network:** WiFi (same as computer)
- **Backend IP:** 10.5.69.205

---

## 🎬 DEMO SCENARIO

### Realistic Emergency Test:

1. **Setup:**
   - Create profile with real-looking data
   - Add 5 test phone numbers (can be your own)
   - Grant all permissions

2. **Trigger:**
   - Choose Medical Emergency (🚑)
   - Tap button
   - Watch phone vibrate

3. **Observe:**
   - Phone: Map screen with SOS banner
   - Dashboard: Alert appears with your details
   - SMS: Check if messages sent

4. **Respond:**
   - Dashboard: Click alert
   - Review patient info
   - Accept & Dispatch as "Ambulance 5"

5. **Verify:**
   - Phone: Shows "Ambulance 5 dispatched"
   - Dashboard: Status = "Dispatched"
   - SMS: Family can track location

---

## 🚀 NEXT STEPS AFTER TESTING

### If Everything Works:
1. Test all 3 emergency types
2. Test with multiple alerts
3. Test with multiple dashboard instances
4. Test offline scenarios
5. Test with real phone numbers

### If Issues Found:
1. Document the issue
2. Check logs (backend, mobile, dashboard)
3. Try troubleshooting steps above
4. Report specific error messages

---

## 📝 TESTING CHECKLIST

Copy this checklist and mark items as you test:

```
MOBILE APP:
[ ] App installed successfully
[ ] Profile creation works
[ ] Medical emergency button works
[ ] Fire emergency button works
[ ] Crime emergency button works
[ ] Location permission granted
[ ] Map displays correctly
[ ] SOS triggers successfully
[ ] Dispatch notification appears

DASHBOARD:
[ ] Dashboard loads
[ ] Map displays
[ ] Connection status: Connected
[ ] Alert appears on map
[ ] Alert appears in panel
[ ] Can click alert
[ ] Modal shows details
[ ] Can accept & dispatch
[ ] Status updates

DUAL-ROUTING:
[ ] SMS sent to contacts
[ ] Dashboard receives alert
[ ] Both happen simultaneously
[ ] Timing < 2 seconds

SYNCHRONIZATION:
[ ] Phone shows dispatch
[ ] Dashboard shows dispatch
[ ] Status consistent
[ ] Real-time updates work

EDGE CASES:
[ ] No profile warning works
[ ] No permission warning works
[ ] Multiple alerts work
[ ] Resolve alert works
```

---

**🚨 READY TO TEST! 🚨**

**Your mobile app is building now. Wait for it to install, then follow the steps above!**

**Dashboard is already open in your browser. Watch it come alive when you trigger SOS!**

---

**Built with ❤️ for saving lives through technology**  
**Rakshak AI - Your Guardian in Emergencies**
