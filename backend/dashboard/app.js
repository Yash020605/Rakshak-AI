// ─── Configuration ───────────────────────────────────────────────────────────
// Auto-detect: use current page origin so the dashboard works both locally
// and when deployed to any cloud host (Render, Railway, Fly.io, etc.)
const ORIGIN       = window.location.origin;
const API_BASE_URL = `${ORIGIN}/api`;
const SOCKET_URL   = ORIGIN;

// ─── State ────────────────────────────────────────────────────────────────────
let map;
let markers        = {};   // alertId → Leaflet marker
let alerts         = [];
let socket;
let selectedAlert  = null;

// Live-dispatch state (one active dispatch at a time per dashboard tab)
let activeDispatch = null; // { alertId, userId, responderName, locationWatchId, routeLayer, responderMarker, etaInterval }

// ─── Emergency config ─────────────────────────────────────────────────────────
const EMERGENCY_CONFIG = {
  medical: { emoji: '🚑', label: 'Medical Emergency', color: '#e53935' },
  fire:    { emoji: '🔥', label: 'Fire Emergency',    color: '#f57c00' },
  police:  { emoji: '🚓', label: 'Crime/Threat',      color: '#1565c0' },
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSocket();
  loadActiveAlerts();
  setupEventListeners();
});

// ─── Map ──────────────────────────────────────────────────────────────────────
function initMap() {
  map = L.map('map').setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);
}

// ─── Socket ───────────────────────────────────────────────────────────────────
function initSocket() {
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    updateConnectionStatus(true);
    socket.emit('join-responder-dashboard', { timestamp: Date.now() });
    loadActiveAlerts();
  });

  socket.on('disconnect', (reason) => {
    console.warn('Disconnected:', reason);
    updateConnectionStatus(false);
  });

  socket.on('connect_error', () => updateConnectionStatus(false));

  socket.on('new-alert', (data) => handleNewAlert(data));

  socket.on('alert-accepted', (data) => {
    updateAlertStatus(data.alertId, 'dispatched', data.responderName);
  });
}

// ─── Load alerts ──────────────────────────────────────────────────────────────
async function loadActiveAlerts() {
  try {
    const res  = await fetch(`${API_BASE_URL}/responder/alerts/active`);
    const data = await res.json();
    alerts = data;
    renderAlerts();
    updateAlertCount();
    data.forEach(a => addMarkerToMap(a));
  } catch (err) {
    console.error('Error loading alerts:', err);
  }
}

// ─── New alert ────────────────────────────────────────────────────────────────
function handleNewAlert(alertData) {
  if (alerts.findIndex(a => a._id === alertData.alertId) !== -1) {
    renderAlerts();
    updateAlertCount();
    return;
  }
  const a = {
    _id: alertData.alertId, type: alertData.type,
    latitude: alertData.latitude, longitude: alertData.longitude,
    userName: alertData.userName, bloodGroup: alertData.bloodGroup,
    medicalConditions: alertData.medicalConditions,
    photoUrl: alertData.photoUrl || null,
    prescriptions: alertData.prescriptions || [],
    status: 'active', createdAt: alertData.timestamp,
  };
  alerts.unshift(a);
  addMarkerToMap(a);
  playAlertSound();
  showNotification(`New ${EMERGENCY_CONFIG[a.type]?.label}`, a.userName);
  renderAlerts();
  updateAlertCount();
}

// ─── Map markers ──────────────────────────────────────────────────────────────
function addMarkerToMap(alert) {
  if (markers[alert._id]) return;
  const cfg  = EMERGENCY_CONFIG[alert.type];
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${cfg.color};width:40px;height:40px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-size:20px;
      border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3);
      ${alert.status === 'dispatched' ? 'opacity:.6;' : ''}">${cfg.emoji}</div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
  const m = L.marker([alert.latitude, alert.longitude], { icon })
    .addTo(map)
    .on('click', () => showAlertDetail(alert._id));
  markers[alert._id] = m;
  if (Object.keys(markers).length === 1) map.setView([alert.latitude, alert.longitude], 13);
}

// ─── Render list ──────────────────────────────────────────────────────────────
function renderAlerts() {
  const el = document.getElementById('alertsList');
  if (!alerts.length) {
    el.innerHTML = `<div class="no-alerts"><div class="no-alerts-icon">✓</div>
      <p>No active alerts</p><small>Waiting for emergency signals...</small></div>`;
    return;
  }
  el.innerHTML = alerts.map(a => {
    const cfg = EMERGENCY_CONFIG[a.type];
    return `<div class="alert-card ${a.type} ${a.status}" onclick="showAlertDetail('${a._id}')">
      <div class="alert-header">
        <div class="alert-type"><span class="emoji">${cfg.emoji}</span><span>${cfg.label}</span></div>
        <div class="alert-time">${getTimeAgo(new Date(a.createdAt))}</div>
      </div>
      <div class="alert-info">
        <div class="alert-info-row"><span class="label">Name:</span><span class="value">${a.userName || 'Unknown'}</span></div>
        <div class="alert-info-row"><span class="label">Blood Group:</span><span class="value">${a.bloodGroup || 'N/A'}</span></div>
      </div>
      <span class="alert-status ${a.status}">${a.status}</span>
    </div>`;
  }).join('');
}

// ─── Alert detail modal ───────────────────────────────────────────────────────
function showAlertDetail(alertId) {
  const a = alerts.find(x => x._id === alertId);
  if (!a) return;
  selectedAlert = a;
  const cfg = EMERGENCY_CONFIG[a.type];
  document.getElementById('modalTitle').innerHTML = `${cfg.emoji} ${cfg.label}`;
  const mapsLink = `https://www.google.com/maps?q=${a.latitude},${a.longitude}`;

  document.getElementById('modalBody').innerHTML = `
    <div class="detail-section">
      <h3>Patient Information</h3>
      <div class="detail-grid">
        ${a.photoUrl ? `
        <div class="detail-item full-width" style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
          <img src="${a.photoUrl}" alt="Patient" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #444;">
          <div>
            <div class="value" style="font-size:18px;font-weight:700;">${a.userName || 'Unknown'}</div>
            <div style="color:#888;font-size:12px;">Blood Group: ${a.bloodGroup || 'N/A'}</div>
          </div>
        </div>` : `
        <div class="detail-item"><div class="label">Name</div><div class="value">${a.userName || 'Unknown'}</div></div>
        <div class="detail-item"><div class="label">Blood Group</div><div class="value">${a.bloodGroup || 'N/A'}</div></div>`}
        <div class="detail-item full-width"><div class="label">Medical Conditions</div>
          <div class="value">${a.medicalConditions || 'None reported'}</div></div>
      </div>
    </div>
    ${a.prescriptions && a.prescriptions.length > 0 ? `
    <div class="detail-section">
      <h3>📋 Medical Prescriptions</h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;">
        ${a.prescriptions.map(rx => `
          <a href="${rx.url}" target="_blank" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;">
            <img src="${rx.url}" alt="${rx.name}"
              style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1px solid #333;"
              onerror="this.style.display='none';this.nextSibling.style.display='flex'">
            <div style="display:none;width:80px;height:80px;border-radius:10px;border:1px solid #333;
              background:#1a1a2e;align-items:center;justify-content:center;font-size:28px;">📄</div>
            <span style="color:#aaa;font-size:11px;max-width:80px;text-align:center;overflow:hidden;
              text-overflow:ellipsis;white-space:nowrap;">${rx.name}</span>
          </a>`).join('')}
      </div>
    </div>` : ''}
    
    <div class="detail-section">
      <h3>Location</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="label">Latitude</div><div class="value">${a.latitude.toFixed(6)}</div></div>
        <div class="detail-item"><div class="label">Longitude</div><div class="value">${a.longitude.toFixed(6)}</div></div>
        <div class="detail-item full-width">
          <a href="${mapsLink}" target="_blank" class="location-link">📍 Open in Google Maps</a>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <h3>Alert Details</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="label">Time</div><div class="value">${new Date(a.createdAt).toLocaleString()}</div></div>
        <div class="detail-item"><div class="label">Status</div><div class="value">${a.status.toUpperCase()}</div></div>
        ${a.responderName ? `<div class="detail-item full-width"><div class="label">Responder</div>
          <div class="value">🚑 ${a.responderName}</div></div>` : ''}
      </div>
    </div>
    ${a.status === 'active'
      ? `<button class="dispatch-btn" onclick="dispatchResponder()">🚨 Accept & Dispatch</button>`
      : `<div class="dispatched-info">
          <div class="icon">✅</div>
          <div class="text">Help Dispatched</div>
          <small>${a.responderName || 'Responder'} is on the way</small>
          <div id="etaDisplay" style="margin-top:8px;color:#4fc3f7;font-weight:700;font-size:15px;"></div>
        </div>`
    }`;

  document.getElementById('alertModal').classList.add('active');
  map.setView([a.latitude, a.longitude], 15);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
async function dispatchResponder() {
  if (!selectedAlert) return;
  const responderName = prompt('Enter your name/unit (e.g. Ambulance Unit 3):');
  if (!responderName) return;

  try {
    const res  = await fetch(`${API_BASE_URL}/alert/${selectedAlert._id}/dispatch`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responderName, responderId: 'dashboard-' + Date.now() }),
    });
    const data = await res.json();
    if (!res.ok) { alert(`❌ Dispatch failed: ${data.error || res.statusText}`); return; }

    alert(`✅ Dispatched! ${responderName} is on the way.`);
    updateAlertStatus(selectedAlert._id, 'dispatched', responderName);

    // Start streaming responder location to the victim
    startResponderTracking(selectedAlert, responderName);
    closeModal();
  } catch (err) {
    alert('❌ Network error. Is the backend running?');
  }
}

// ─── Responder live-location tracking ────────────────────────────────────────
function startResponderTracking(alert, responderName) {
  // Stop any previous tracking session
  stopResponderTracking();

  if (!navigator.geolocation) {
    console.warn('Geolocation not available in this browser');
    return;
  }

  // Responder marker icon
  const responderIcon = L.divIcon({
    className: 'responder-marker',
    html: `<div style="background:#4caf50;width:36px;height:36px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-size:18px;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);">🚑</div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });

  const responderMarker = L.marker([alert.latitude, alert.longitude], { icon: responderIcon })
    .addTo(map)
    .bindPopup(`<b>${responderName}</b><br>En route to victim`);

  activeDispatch = {
    alertId: alert._id,
    userId: alert.userId,
    responderName,
    responderMarker,
    routeLayer: null,
    locationWatchId: null,
  };

  // Watch browser geolocation and stream to backend every ~3 s
  activeDispatch.locationWatchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      // Move marker
      responderMarker.setLatLng([latitude, longitude]);

      // Fetch route from responder → victim
      await updateRoute(latitude, longitude, alert.latitude, alert.longitude, alert._id);

      // Emit live location to backend so mobile app receives it
      socket.emit('responder-location', {
        alertId: alert._id,
        userId: alert.userId,
        latitude,
        longitude,
        eta: activeDispatch.etaMinutes ?? null,
      });
    },
    (err) => console.warn('Responder geolocation error:', err.message),
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
  );
}

function stopResponderTracking() {
  if (!activeDispatch) return;
  if (activeDispatch.locationWatchId != null)
    navigator.geolocation.clearWatch(activeDispatch.locationWatchId);
  if (activeDispatch.routeLayer) map.removeLayer(activeDispatch.routeLayer);
  if (activeDispatch.responderMarker) map.removeLayer(activeDispatch.responderMarker);
  activeDispatch = null;
}

// ─── Route drawing ────────────────────────────────────────────────────────────
async function updateRoute(fromLat, fromLng, toLat, toLng, alertId) {
  try {
    const res  = await fetch(
      `${API_BASE_URL}/location/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`
    );
    if (!res.ok) return;
    const data = await res.json();

    // Remove old route layer
    if (activeDispatch?.routeLayer) map.removeLayer(activeDispatch.routeLayer);

    // OSRM returns [lng, lat] — Leaflet needs [lat, lng]
    const latlngs = data.coordinates.map(([lng, lat]) => [lat, lng]);
    const routeLayer = L.polyline(latlngs, {
      color: '#4fc3f7',
      weight: 5,
      opacity: 0.85,
      dashArray: '10, 6',
    }).addTo(map);

    if (activeDispatch) {
      activeDispatch.routeLayer  = routeLayer;
      activeDispatch.etaMinutes  = data.etaMinutes;
    }

    // Update ETA display in modal if open
    const etaEl = document.getElementById('etaDisplay');
    if (etaEl) {
      const dist = (data.distanceMeters / 1000).toFixed(1);
      etaEl.textContent = `🕐 ETA: ${data.etaMinutes} min  ·  ${dist} km`;
    }

    // Fit map to show both responder and victim
    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
  } catch (err) {
    console.warn('Route fetch error:', err.message);
  }
}

// ─── Alert status update ──────────────────────────────────────────────────────
function updateAlertStatus(alertId, status, responderName) {
  const a = alerts.find(x => x._id === alertId);
  if (!a) return;
  a.status = status;
  a.responderName = responderName;
  renderAlerts();
  if (markers[alertId]) {
    map.removeLayer(markers[alertId]);
    delete markers[alertId];
    addMarkerToMap(a);
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function closeModal() {
  document.getElementById('alertModal').classList.remove('active');
  selectedAlert = null;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function updateConnectionStatus(connected) {
  const dot  = document.getElementById('connectionStatus');
  const text = document.getElementById('connectionText');
  dot.classList.toggle('connected', connected);
  dot.classList.toggle('disconnected', !connected);
  text.textContent = connected ? 'Connected' : 'Disconnected';
}

function updateAlertCount() {
  document.getElementById('alertCount').textContent =
    alerts.filter(a => a.status === 'active').length;
}

function getTimeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function playAlertSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch (_) {}
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted')
    new Notification(title, { body });
}

// ─── Event listeners ──────────────────────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('refreshBtn').addEventListener('click', loadActiveAlerts);
  document.getElementById('alertModal').addEventListener('click', (e) => {
    if (e.target.id === 'alertModal') closeModal();
  });
  if ('Notification' in window && Notification.permission === 'default')
    Notification.requestPermission();
}

// Auto-refresh every 30 s
setInterval(loadActiveAlerts, 30000);
