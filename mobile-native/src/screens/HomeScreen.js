import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, StatusBar, Vibration,
} from 'react-native';
import { EMERGENCY_TYPES } from '../config/constants';
import { getCurrentLocation, requestLocationPermission } from '../services/locationService';
import { triggerSOS } from '../services/alertService';
import { getProfile } from '../services/storageService';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [profile, setProfile] = useState(null);
  const locationRef = useRef(null);

  useEffect(() => {
    (async () => {
      await requestLocationPermission();
      const p = await getProfile();
      setProfile(p);
      // Pre-fetch location for speed
      try {
        locationRef.current = await getCurrentLocation();
      } catch (_) {}
    })();
  }, []);

  const handleEmergency = async (type) => {
    if (!profile) {
      Alert.alert('Profile Required', 'Please set up your profile before sending an SOS.', [
        { text: 'Set Up', onPress: () => navigation.navigate('Profile') },
      ]);
      return;
    }

    Vibration.vibrate([0, 200, 100, 200]);
    setLoading(true);
    setActiveType(type);

    try {
      let location = locationRef.current;
      if (!location) location = await getCurrentLocation();

      const result = await triggerSOS(type, location.latitude, location.longitude);

      navigation.navigate('Map', {
        type,
        latitude: location.latitude,
        longitude: location.longitude,
        alertId: result.alertId,
        nearestService: result.nearestService,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send SOS. Please call emergency services directly.');
    } finally {
      setLoading(false);
      setActiveType(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <Text style={styles.title}>Rakshak AI</Text>
        <Text style={styles.subtitle}>Tap once. Help is on the way.</Text>
      </View>

      <View style={styles.buttonContainer}>
        {Object.entries(EMERGENCY_TYPES).map(([type, config]) => (
          <TouchableOpacity
            key={type}
            style={[styles.emergencyButton, { backgroundColor: config.color }]}
            onPress={() => handleEmergency(type)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading && activeType === type ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Text style={styles.emoji}>{config.emoji}</Text>
                <Text style={styles.buttonLabel}>{config.label}</Text>
                <Text style={styles.buttonSub}>{config.description}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
          <Text style={styles.profileBtnText}>👤 My Profile</Text>
        </TouchableOpacity>
        {profile && (
          <Text style={styles.profileName}>Signed in as {profile.name}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 20 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 6 },
  buttonContainer: { flex: 1, justifyContent: 'center', gap: 16 },
  emergencyButton: {
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  buttonLabel: { fontSize: 22, fontWeight: '700', color: '#fff' },
  buttonSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  footer: { paddingBottom: 40, alignItems: 'center', gap: 8 },
  profileBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  profileBtnText: { color: '#fff', fontSize: 15 },
  profileName: { color: '#888', fontSize: 12 },
});
