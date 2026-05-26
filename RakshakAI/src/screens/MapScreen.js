import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import axios from 'axios';
import { EMERGENCY_TYPES, API_BASE_URL } from '../config/constants';
import { watchLocation, clearWatch } from '../services/locationService';
import { captureMedia, uploadMedia } from '../services/mediaService';
import { getProfile } from '../services/storageService';
import { resolveAlert } from '../services/alertService';
import { getSocket } from '../services/socketService';

const EMERGENCY_NUMBERS = { medical: '108', fire: '101', police: '100' };

export default function MapScreen({ route, navigation }) {
  const params = route.params || {};
  const { type = 'medical', alertId } = params;
  const initialLat = params.latitude;
  const initialLng = params.longitude;
  const config = EMERGENCY_TYPES[type] || EMERGENCY_TYPES.medical;
  const emergencyNumber = EMERGENCY_NUMBERS[type] || '112';

  const [userLocation, setUserLocation]         = useState(
    initialLat && initialLng ? { latitude: initialLat, longitude: initialLng } : null
  );
  const [mapReady, setMapReady]                 = useState(false);
  const [uploading, setUploading]               = useState(false);
  const [service, setService]                   = useState(params.nearestService || null);
  const [fetchingService, setFetchingService]   = useState(!params.nearestService);
  // Responder live tracking
  const [responderLocation, setResponderLocation] = useState(null);
  const [responderEta, setResponderEta]           = useState(null);
  const [routeCoords, setRouteCoords]             = useState([]);   // [{latitude, longitude}]
  const [dispatchInfo, setDispatchInfo]           = useState(null); // { responderName }

  const watchIdRef          = useRef(null);
  const mapRef              = useRef(null);
  const serviceSearchedRef  = useRef(false);
  const userLocationRef     = useRef(userLocation); // keep latest value for route fetch

  // Keep ref in sync
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  // ── Location watch + nearest service ──────────────────────────────────────
  useEffect(() => {
    watchIdRef.current = watchLocation((loc) => {
      setUserLocation(loc);
      mapRef.current?.animateToRegion(
        { ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500
      );
      if (!params.nearestService && !serviceSearchedRef.current) {
        serviceSearchedRef.current = true;
        axios.get(`${API_BASE_URL}/location/nearest`, {
          params: { lat: loc.latitude, lng: loc.longitude, type },
          timeout: 10000,
        })
          .then(({ data }) => setService(data))
          .catch(() => {})
          .finally(() => setFetchingService(false));
      }
    });
    if (params.nearestService) setFetchingService(false);
    return () => clearWatch(watchIdRef.current);
  }, []);

  // ── Socket: dispatch notification + live responder location ───────────────
  useEffect(() => {
    if (!alertId) return;
    const socket = getSocket();

    // Dispatch confirmed
    const onDispatched = (data) => {
      setDispatchInfo({ responderName: data.responderName });
      Alert.alert(
        '✅ Help is on the way!',
        `${data.responderName} has been dispatched to your location.`,
        [{ text: 'OK' }]
      );
    };

    // Live responder location stream
    const onResponderLocation = async (data) => {
      const respLoc = { latitude: data.latitude, longitude: data.longitude };
      setResponderLocation(respLoc);
      setResponderEta(data.eta);

      // Fetch route from responder → user for polyline
      const userLoc = userLocationRef.current;
      if (userLoc) {
        try {
          const res = await axios.get(`${API_BASE_URL}/location/route`, {
            params: {
              fromLat: data.latitude, fromLng: data.longitude,
              toLat: userLoc.latitude, toLng: userLoc.longitude,
            },
            timeout: 8000,
          });
          // OSRM returns [lng, lat] — convert to {latitude, longitude}
          const coords = res.data.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          setRouteCoords(coords);
          if (res.data.etaMinutes != null) setResponderEta(res.data.etaMinutes);
        } catch (_) {}
      }
    };

    socket.on(`alert-dispatched:${alertId}`, onDispatched);
    socket.on(`responder-location:${alertId}`, onResponderLocation);

    return () => {
      socket.off(`alert-dispatched:${alertId}`, onDispatched);
      socket.off(`responder-location:${alertId}`, onResponderLocation);
    };
  }, [alertId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const callEmergencyService = () =>
    Linking.openURL(`tel:${emergencyNumber}`).catch(() =>
      Alert.alert('Call Failed', `Please call ${emergencyNumber} manually.`)
    );

  const callNearestService = () => {
    const url = service?.phone
      ? `tel:${service.phone}`
      : `https://maps.google.com/?q=${service?.latitude},${service?.longitude}`;
    Linking.openURL(url);
  };

  const handleCapture = async (mediaType) => {
    try {
      const asset = await captureMedia(mediaType);
      if (!asset) return;
      setUploading(true);
      const profile = await getProfile();
      await uploadMedia(asset, alertId, profile?.userId);
      Alert.alert('Uploaded', 'Evidence attached to your alert.');
    } catch (err) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResolve = () =>
    Alert.alert('Mark as Resolved?', 'This will close your active alert.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          if (alertId) await resolveAlert(alertId).catch(() => {});
          navigation.navigate('Home');
        },
      },
    ]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* LIVE badge */}
      <View style={[styles.liveBadge, { backgroundColor: config.color }]}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          userLocation
            ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 5, longitudeDelta: 5 }
        }
        showsUserLocation
        showsMyLocationButton
        onMapReady={() => setMapReady(true)}
      >
        {/* User pin */}
        {userLocation && (
          <Marker coordinate={userLocation} title="You" pinColor={config.color} />
        )}

        {/* Nearest service pin */}
        {service?.latitude && (
          <Marker
            coordinate={{ latitude: service.latitude, longitude: service.longitude }}
            title={service.name}
            description={service.address}
            pinColor="green"
          />
        )}

        {/* Responder live pin */}
        {responderLocation && (
          <Marker
            coordinate={responderLocation}
            title={dispatchInfo?.responderName || 'Responder'}
            description={responderEta != null ? `ETA: ${responderEta} min` : 'En route'}
            pinColor="#4caf50"
          />
        )}

        {/* Route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#4fc3f7"
            strokeWidth={4}
            lineDashPattern={[10, 6]}
          />
        )}
      </MapView>

      {!mapReady && (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={{ color: '#fff', marginTop: 10 }}>Loading map...</Text>
        </View>
      )}

      {/* Dispatch status banner */}
      {dispatchInfo && (
        <View style={styles.dispatchBanner}>
          <Text style={styles.dispatchIcon}>🚑</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.dispatchName}>{dispatchInfo.responderName} dispatched</Text>
            {responderEta != null && (
              <Text style={styles.dispatchEta}>ETA: {responderEta} min</Text>
            )}
          </View>
        </View>
      )}

      {/* Emergency call button */}
      <TouchableOpacity
        style={[styles.emergencyCallBtn, { backgroundColor: config.color }]}
        onPress={callEmergencyService}
      >
        <Text style={styles.emergencyCallIcon}>📞</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.emergencyCallText}>
            Call {config.description} ({emergencyNumber})
          </Text>
          <Text style={styles.emergencyCallSub}>Tap to connect to emergency services</Text>
        </View>
      </TouchableOpacity>

      {/* Nearest service card */}
      {fetchingService ? (
        <View style={styles.serviceCard}>
          <ActivityIndicator color={config.color} size="small" />
          <Text style={{ color: '#888', marginLeft: 10, fontSize: 13 }}>
            Finding nearest {config.description}...
          </Text>
        </View>
      ) : service ? (
        <View style={styles.serviceCard}>
          <View style={[styles.serviceIcon, { backgroundColor: config.color }]}>
            <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceAddr}>
              {service.distanceKm != null
                ? `${service.distanceKm} km away${service.address ? ' · ' + service.address : ''}`
                : service.address || 'Nearby location'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.dirBtn, { backgroundColor: config.color }]}
            onPress={callNearestService}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>📍</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Attach evidence */}
      <View style={styles.evidenceCard}>
        <Text style={styles.evidenceTitle}>Attach Evidence</Text>
        <Text style={styles.evidenceSub}>Add photo or video to your alert</Text>
        <View style={styles.evidenceRow}>
          <TouchableOpacity style={styles.evidenceBtn} onPress={() => handleCapture('photo')}>
            <Text style={styles.evidenceIcon}>📷</Text>
            <Text style={styles.evidenceBtnLabel}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.evidenceBtn} onPress={() => handleCapture('video')}>
            <Text style={styles.evidenceIcon}>🎥</Text>
            <Text style={styles.evidenceBtnLabel}>Record Video</Text>
          </TouchableOpacity>
        </View>
        {uploading && <ActivityIndicator color={config.color} style={{ marginTop: 8 }} />}
      </View>

      {/* Resolve */}
      <TouchableOpacity
        style={[styles.sosSentBtn, { backgroundColor: config.color }]}
        onPress={handleResolve}
      >
        <Text style={styles.sosSentIcon}>🛡️</Text>
        <View>
          <Text style={styles.sosSentText}>SOS ACTIVE</Text>
          <Text style={styles.sosSentSub}>Tap to mark as resolved</Text>
        </View>
      </TouchableOpacity>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={[styles.navLabel, { color: '#4fc3f7' }]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0d0d0d' },
  liveBadge:          { position: 'absolute', top: 50, right: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  liveDot:            { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText:           { color: '#fff', fontSize: 11, fontWeight: '800' },
  map:                { flex: 1 },
  mapLoading:         { ...StyleSheet.absoluteFillObject, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center' },
  dispatchBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a3a1a', marginHorizontal: 12, marginTop: 10, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: '#4caf50' },
  dispatchIcon:       { fontSize: 24 },
  dispatchName:       { color: '#4caf50', fontSize: 14, fontWeight: '700' },
  dispatchEta:        { color: '#4fc3f7', fontSize: 13, marginTop: 2 },
  emergencyCallBtn:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 8, borderRadius: 14, padding: 14, gap: 12 },
  emergencyCallIcon:  { fontSize: 24 },
  emergencyCallText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  emergencyCallSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  serviceCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 12, marginTop: 8, borderRadius: 14, padding: 14, gap: 12 },
  serviceIcon:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  serviceInfo:        { flex: 1 },
  serviceName:        { color: '#fff', fontSize: 15, fontWeight: '700' },
  serviceAddr:        { color: '#888', fontSize: 12, marginTop: 2 },
  dirBtn:             { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  evidenceCard:       { backgroundColor: '#1a1a2e', marginHorizontal: 12, marginTop: 8, borderRadius: 14, padding: 14 },
  evidenceTitle:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  evidenceSub:        { color: '#888', fontSize: 12, marginBottom: 10 },
  evidenceRow:        { flexDirection: 'row', gap: 10 },
  evidenceBtn:        { flex: 1, backgroundColor: '#0d0d1a', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  evidenceIcon:       { fontSize: 24, marginBottom: 6 },
  evidenceBtnLabel:   { color: '#fff', fontSize: 13 },
  sosSentBtn:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 8, borderRadius: 14, padding: 16, gap: 12, marginBottom: 8 },
  sosSentIcon:        { fontSize: 24 },
  sosSentText:        { color: '#fff', fontSize: 16, fontWeight: '800' },
  sosSentSub:         { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  bottomNav:          { flexDirection: 'row', backgroundColor: '#1a1a1a', paddingVertical: 10, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  navItem:            { flex: 1, alignItems: 'center' },
  navIcon:            { fontSize: 22 },
  navLabel:           { color: '#888', fontSize: 11, marginTop: 3 },
});
