import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Vibration, ScrollView, Animated,
} from 'react-native';
import { getCurrentLocation, requestLocationPermission } from '../services/locationService';
import { triggerSOS } from '../services/alertService';
import { getProfile } from '../services/storageService';

const EMERGENCY_TYPES = [
  { type: 'medical', label: 'AMBULANCE', sub: 'Medical Emergency', emoji: '🚑', color: '#E53935' },
  { type: 'fire',    label: 'FIRE',      sub: 'Fire Emergency',    emoji: '🔥', color: '#F57C00' },
  { type: 'police',  label: 'POLICE',    sub: 'Police Assistance', emoji: '🛡️', color: '#1565C0' },
];

export default function HomeScreen({ navigation }) {
  const [profile, setProfile]           = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const locationRef                     = useRef(null);
  const pulseAnim                       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();

    (async () => {
      await requestLocationPermission();
      const p = await getProfile();
      setProfile(p);
      try {
        locationRef.current = await getCurrentLocation();
        setLocationReady(true);
      } catch (_) {}
    })();
  }, []);

  const handleSOS = (item) => {
    if (!profile) { navigation.navigate('Profile'); return; }
    Vibration.vibrate([0, 200, 100, 200]);
    navigation.navigate('Sending', { type: item.type, color: item.color, locationRef });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>RAKSHAK <Text style={styles.appNameAI}>AI</Text></Text>
          <Text style={styles.tagline}>Your Safety. Our Priority.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileIcon}>
          <Text style={{ fontSize: 22 }}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.locationBadge, { backgroundColor: locationReady ? '#1a3a1a' : '#2a2a2a' }]}>
        <View style={[styles.locationDot, { backgroundColor: locationReady ? '#4caf50' : '#888' }]} />
        <Text style={[styles.locationText, { color: locationReady ? '#4caf50' : '#888' }]}>
          {locationReady ? 'Location ready' : 'Getting location...'}
        </Text>
        <Text style={styles.gpsText}>GPS {locationReady ? 'Active' : 'Searching'}</Text>
      </View>

      <Text style={styles.tapTitle}>Tap to Send SOS</Text>
      <Text style={styles.tapSub}>We'll alert your contacts and{'\n'}nearest services instantly.</Text>

      <ScrollView style={styles.buttonList} showsVerticalScrollIndicator={false}>
        {EMERGENCY_TYPES.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[styles.emergencyBtn, { backgroundColor: item.color }]}
            onPress={() => handleSOS(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnEmoji}>{item.emoji}</Text>
            <View style={styles.btnTextWrap}>
              <Text style={styles.btnLabel}>{item.label}</Text>
              <Text style={styles.btnSub}>{item.sub}</Text>
            </View>
            <Text style={styles.btnArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>⚡ SOS responds in under 3 seconds{'\n'}even under extreme conditions.</Text>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, { color: '#E53935' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Map', {})}>
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={styles.navLabel}>Map</Text>
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
  container:      { flex: 1, backgroundColor: '#0d0d0d' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16 },
  appName:        { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  appNameAI:      { color: '#E53935' },
  tagline:        { color: '#888', fontSize: 12, marginTop: 2 },
  profileIcon:    { padding: 8 },
  locationBadge:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 20 },
  locationDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  locationText:   { fontSize: 13, fontWeight: '600', flex: 1 },
  gpsText:        { color: '#555', fontSize: 12 },
  tapTitle:       { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  tapSub:         { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  buttonList:     { flex: 1, paddingHorizontal: 20 },
  emergencyBtn:   { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 20, marginBottom: 14, elevation: 6 },
  btnEmoji:       { fontSize: 36, marginRight: 16 },
  btnTextWrap:    { flex: 1 },
  btnLabel:       { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  btnSub:         { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  btnArrow:       { color: '#fff', fontSize: 28, opacity: 0.7 },
  footer:         { backgroundColor: '#1a1a1a', marginHorizontal: 20, borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center' },
  footerText:     { color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  bottomNav:      { flexDirection: 'row', backgroundColor: '#1a1a1a', paddingVertical: 10, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  navItem:        { flex: 1, alignItems: 'center' },
  navIcon:        { fontSize: 22 },
  navLabel:       { color: '#888', fontSize: 11, marginTop: 3 },
});
