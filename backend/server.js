require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

// ── Basic auth for dashboard (set DASHBOARD_USER / DASHBOARD_PASS in .env) ──
function dashboardAuth(req, res, next) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASS;
  // If no credentials configured, skip auth (dev mode)
  if (!user || !pass) return next();

  const authHeader = req.headers.authorization || '';
  const b64 = authHeader.replace(/^Basic\s+/i, '');
  const [u, p] = Buffer.from(b64, 'base64').toString().split(':');
  if (u === user && p === pass) return next();

  res.set('WWW-Authenticate', 'Basic realm="Rakshak AI Dashboard"');
  res.status(401).send('Authentication required');
}

const alertRoutes = require('./routes/alert');
const profileRoutes = require('./routes/profile');
const locationRoutes = require('./routes/location');
const mediaRoutes = require('./routes/media');
const responderRoutes = require('./routes/responder');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/dashboard', dashboardAuth, express.static('dashboard'));

app.use('/api/alert', alertRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/responder', responderRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'Rakshak AI' }));
app.get('/', (_req, res) => res.redirect('/dashboard'));

// Enhanced Socket.IO with responder support
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Responder dashboard joins special room
  socket.on('join-responder-dashboard', (data) => {
    socket.join('responder-dashboard');
    console.log('🚨 Responder dashboard joined:', data?.responderId || socket.id);
    
    // Update responder's socket ID if provided
    if (data?.responderId) {
      const Responder = require('./models/Responder');
      Responder.findByIdAndUpdate(data.responderId, {
        socketId: socket.id,
        status: 'active',
        lastActive: new Date(),
      }).catch(err => console.error('Error updating responder socket:', err));
    }
  });

  // User joins their personal alert channel
  socket.on('join-user-channel', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined personal channel`);
  });

  // Dashboard responder streams their live location after dispatch
  // Relays to the victim's personal channel so the mobile app can show the moving marker
  socket.on('responder-location', ({ alertId, userId, latitude, longitude, eta }) => {
    // Forward to the victim's room
    io.to(`user:${userId}`).emit(`responder-location:${alertId}`, {
      latitude,
      longitude,
      eta,
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('⚠️  MongoDB connection failed:', err.message);
    console.error('   Set a valid MONGODB_URI in .env — get a free one at https://cloud.mongodb.com');
    console.error('   Server will start but DB-dependent routes will error until connected.\n');
  }
  server.listen(PORT, '0.0.0.0', () => console.log(`✅ Rakshak AI backend running on http://0.0.0.0:${PORT}`));
})();
