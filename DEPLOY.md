# Deploying Rakshak AI — Step-by-Step

## 1. Push to GitHub

```bash
cd rakshak-ai
git add .
git commit -m "chore: add deployment config and fix hardcoded URLs"
git push
```

---

## 2. Deploy Backend to Render (free tier)

Render gives you a public HTTPS URL you can share immediately.

### Steps

1. Go to **https://render.com** → Sign up / Log in
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Set these fields:
   | Field | Value |
   |-------|-------|
   | Root Directory | `backend` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Instance Type | **Free** |

5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `TWILIO_ACCOUNT_SID` | From Twilio console |
   | `TWILIO_AUTH_TOKEN` | From Twilio console |
   | `TWILIO_PHONE_NUMBER` | Your Twilio number |
   | `DASHBOARD_USER` | `admin` (or any username) |
   | `DASHBOARD_PASS` | A strong password |

6. Click **Deploy** — Render will build and give you a URL like:
   `https://rakshak-ai-backend.onrender.com`

7. Your dashboard will be live at:
   `https://rakshak-ai-backend.onrender.com/dashboard`

---

## 3. Set Up MongoDB Atlas (free)

1. Go to **https://cloud.mongodb.com** → Create free account
2. Create a **free M0 cluster** (any region)
3. Under **Database Access** → Add a database user with a password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — needed for Render)
5. Click **Connect → Drivers** → Copy the connection string
6. Replace `<password>` with your DB user's password
7. Paste into Render's `MONGODB_URI` env var

---

## 4. Update Mobile App URL

After deploying, open `mobile/src/config/network.js` and update:

```js
const PRODUCTION_URL = 'https://rakshak-ai-backend.onrender.com'; // ← your Render URL
const USE_LOCAL_IP = false; // ← set to false for production
```

---

## 5. Share the Dashboard Link

Send your teammates:
```
https://rakshak-ai-backend.onrender.com/dashboard
Username: admin
Password: (whatever you set as DASHBOARD_PASS)
```

---

## Notes

- **Free Render tier spins down after 15 min of inactivity** — first request after idle takes ~30s to wake up. Upgrade to Starter ($7/mo) to avoid this.
- **Uploaded files** (photos, prescriptions) are stored on the container's local disk. They will be lost on redeploy. For production, switch to Cloudinary or AWS S3.
- **Twilio free trial** only sends SMS to verified numbers. Upgrade to a paid account to send to any number.
