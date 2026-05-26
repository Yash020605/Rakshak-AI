import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { EMERGENCY_TYPES, OSM_TILE_URL } from '../config/constants';
import { watchLocation, clearWatch } from '../services/locationService';
import { captureMedia, uploadMedia } from '../services/mediaService';
import { getProfile } from '../services/storageService';
import { resolveAlert } from '../services/alertService';

export default function MapScreen({ route, navigation }) {
  const { type, latitude, longitude, alertId, nearestService } = route.params;
  const config = EMERGENCY_TYPES[type];

  const [userLocation, setUserLocation] = useState({ latitude, longitude });
  const [uploading, setUploading] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    watchIdRef.current = watchLocation((loc) => {
      setUserLocation(loc);
      mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
    });
    return () => clearWatch(watchIdRef.current);
  }, []);

  // Listen for dispatch status
  useEffect(() => {
    const profile = getProfile();
    profile.then(p => {
      if (p && p.userId) {
        const socket = require('./services/socketService').getSocket();
        
        socket.on(`alert-dispatched:${p.userId}`, (data) => {
          setDispatchStatus(data);
          Alert.alert(
            '✅ Help is on the way!',
            data.message || `${data.responderName} has been dispatched to your location.`,
            [{ text: 'OK' }]
          );
        });

        return () => {
          socket.off(`alert-dispatched:${p.userId}`);
        };
      }
    });
  }, []);

  const handleCapture = async (mediaType) => {
    try {
      const asset = await captureMedia(mediaType);
      if (!asset) return;
      setUploading(true);
      const profile = await getProfile();
      await uploadMedia(asset, alertId, profile?.userId);
      Alert.alert('Uploaded', 'Media attached to your alert.');
    } catch (err) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResolve = async () => {
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
  };

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.banner, { backgroundColor: config.color }]}>
        <Text style={styles.bannerText}>{config.emoji} {config.label} — SOS Active</Text>
        {nearestService && (
          <Text style={styles.nearestText}>Nearest: {nearestService.name}</Text>
        )}
        {dispatchStatus && (
          <Text style={styles.dispatchText}>✅ {dispatchStatus.responderName} dispatched</Text>
        )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* OSM tile layer — free, no API key */}
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />

        {/* User marker */}
        <Marker coordinate={userLocation} title="You" pinColor={config.color} />

        {/* Nearest service marker */}
        {nearestService && (
          <Marker
            coordinate={{ latitude: nearestService.latitude, longitude: nearestService.longitude }}
            title={nearestService.name}
            description={nearestService.address}
            pinColor="green"
          />
        )}
      </MapView>

      {/* Action bar */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleCapture('photo')}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionLabel}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleCapture('video')}>
          <Text style={styles.actionIcon}>🎥</Text>
          <Text style={styles.actionLabel}>Video</Text>
        </TouchableOpacity>
        {uploading && <ActivityIndicator color={config.color} />}
        <TouchableOpacity style={[styles.resolveBtn, { borderColor: config.color }]} onPress={handleResolve}>
          <Text style={[styles.resolveBtnText, { color: config.color }]}>✓ Resolved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { padding: 16, paddingTop: 50, alignItems: 'center' },
  bannerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nearestText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  dispatchText: { color: '#fff', fontSize: 13, marginTop: 4, fontWeight: '600' },
  map: { flex: 1 },
  actions: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 32,
  },
  actionBtn: { alignItems: 'center', padding: 8 },
  actionIcon: { fontSize: 28 },
  actionLabel: { color: '#aaa', fontSize: 11, marginTop: 4 },
  resolveBtn: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resolveBtnText: { fontWeight: '700', fontSize: 14 },
});
