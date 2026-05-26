<div align="center">

# 🚨 Rakshak AI
### Real-Time Emergency Alert System

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Twilio](https://img.shields.io/badge/Twilio-SMS-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://twilio.com)

**One tap. Simultaneous SMS to family + live alert to emergency responders.**

[Live Dashboard →](https://rakshak-ai-backend.onrender.com/dashboard) &nbsp;·&nbsp; [View Demo](#-demo) &nbsp;·&nbsp; [Architecture](#-architecture)

</div>

---

## 🎯 What is Rakshak AI?

Rakshak AI is a full-stack emergency response platform built for real-world safety scenarios. When a user triggers an SOS, the system simultaneously:

- 📱 **Sends SMS** to all emergency contacts via Twilio (works offline too)
- 🗺️ **Alerts nearby responders** in real-time via WebSocket
- 📍 **Streams live location** to a responder dashboard with routing and ETA
- 🔄 **Syncs status back** to the user's phone when help is dispatched

No API key needed for maps — uses 100% free OpenStreetMap + OSRM routing.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🆘 **Dual-Routing SOS** | One tap triggers SMS to family AND WebSocket alert to responders — simultaneously |
| 📡 **Real-Time Dashboard** | Live map with color-coded emergency pins, patient details, dispatch controls |
| 🗺️ **Live Route Tracking** | Responder's GPS streams to victim's phone with turn-by-turn ETA |
| 📴 **Offline Fallback** | No internet? App opens native SMS with pre-filled emergency message |
| 🏥 **Patient Profile Snapshot** | Blood group, medical conditions, prescriptions attached to every alert |
| 📸 **Media Upload** | Photo/video evidence captured and linked to the alert |
| 🔒 **Dashboard Auth** | HTTP Basic Auth protects the responder dashboard |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)             │
│         Home ──► Map ──► Profile                        │
└──────────────────────┬──────────────────────────────────┘
                       │  POST /api/alert/sos
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend  (Node.js + Express)                │
│                                                         │
│   ┌─────────────────┐    ┌──────────────────────────┐  │
│   │  Route A: SMS   │    │  Route B: WebSocket      │  │
│   │  Twilio → all   │    │  Socket.IO → Dashboard   │  │
│   │  family contacts│    │  + nearby responders     │  │
│   └─────────────────┘    └──────────────────────────┘  │
│                                                         │
│   MongoDB Atlas · node-cache · Multer · OSRM routing   │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           Responder Dashboard  (Vanilla JS + Leaflet)   │
│   Live map · Alert list · Dispatch · Live route ETA     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express — REST API + static dashboard serving
- Socket.IO — bidirectional real-time communication
- MongoDB + Mongoose — alert and profile persistence
- Twilio — SMS to emergency contacts
- Multer — photo/prescription file uploads
- OpenStreetMap (Overpass API) — nearest hospital/fire/police lookup
- OSRM — free turn-by-turn routing with ETA

**Mobile**
- React Native 0.74 (bare, no Expo)
- React Navigation — stack navigation
- react-native-maps — live OSM map tiles
- react-native-geolocation-service — high-accuracy GPS
- Socket.IO client — real-time responder location updates
- AsyncStorage — offline profile persistence

**Dashboard**
- Vanilla JS + Leaflet.js — zero-dependency, fast load
- Socket.IO client — live alert feed
- Browser Geolocation API — streams responder GPS to victim

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas free cluster ([get one here](https://cloud.mongodb.com))
- Twilio account ([free trial](https://twilio.com))

### 1. Clone & install

```bash
git clone https://github.com/Yash020605/Rakshak-AI.git
cd Rakshak-AI/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in MONGODB_URI, TWILIO_*, DASHBOARD_USER, DASHBOARD_PASS
```

### 3. Run the backend

```bash
node server.js
# ✅ MongoDB connected successfully
# ✅ Rakshak AI backend running on http://0.0.0.0:5000
```

### 4. Open the dashboard

```
http://localhost:5000/dashboard
```

### 5. Run the mobile app

```bash
cd ../mobile-native
npm install
npx react-native run-android   # Android device/emulator
```

---

## 📱 Demo

### SOS Flow
1. User opens app → taps **🚑 Medical Emergency**
2. App sends GPS + profile to backend
3. Backend simultaneously:
   - Fires Twilio SMS to all emergency contacts
   - Emits `new-alert` via Socket.IO to dashboard
4. Responder sees alert on map, clicks **Accept & Dispatch**
5. User's phone shows **"Help is on the way — Ambulance Unit 3"**
6. Dashboard streams responder's live GPS → user's map shows moving marker + ETA

### Test with curl

```bash
# Trigger a test SOS (requires a profile to exist first)
curl -X POST http://localhost:5000/api/alert/sos \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo","type":"medical","latitude":19.0760,"longitude":72.8777}'

# Health check
curl http://localhost:5000/health
```

---

## 📁 Project Structure

```
Rakshak-AI/
├── backend/
│   ├── config/          # DB, cache, Firebase
│   ├── models/          # Alert, Profile, Responder, Media
│   ├── routes/          # alert, profile, location, media, responder
│   ├── services/        # SMS, location, responder, notification
│   ├── dashboard/       # Responder web dashboard (HTML/CSS/JS)
│   ├── uploads/         # Uploaded photos & prescriptions
│   ├── Dockerfile
│   └── server.js
│
├── mobile-native/       # Bare React Native (Android + iOS)
│   ├── android/
│   ├── ios/
│   └── src/
│       ├── screens/     # Home, Map, Profile
│       └── services/    # alert, location, socket, storage, SMS
│
├── render.yaml          # One-click Render.com deployment
└── DEPLOY.md            # Step-by-step deployment guide
```

---

## ☁️ Deployment

The backend is ready to deploy on [Render](https://render.com) (free tier) using the included `render.yaml`.

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step guide.

**Environment variables needed on the server:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Your Twilio number (E.164 format) |
| `DASHBOARD_USER` | Dashboard login username |
| `DASHBOARD_PASS` | Dashboard login password |

---

## 🔒 Security Notes

- Dashboard is protected by HTTP Basic Auth (configurable via env vars)
- All SOS inputs are validated with `express-validator`
- File uploads restricted to images and PDFs, 20MB max
- CORS enabled for mobile app access
- Secrets managed via environment variables — never committed

---

## 🗺️ Roadmap

- [ ] Firebase Cloud Messaging push notifications
- [ ] Cloudinary/S3 for persistent file storage
- [ ] Rate limiting on SOS endpoint
- [ ] Responder mobile app
- [ ] Analytics dashboard
- [ ] iOS build

---

## 👤 Author

**Yash Limbhore**  
Built during TechGeek Agentic AI Internship · May 2026

[![GitHub](https://img.shields.io/badge/GitHub-Yash020605-181717?style=flat&logo=github)](https://github.com/Yash020605)

---

<div align="center">
<strong>🚨 Built to save lives through technology 🚨</strong>
</div>
