import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { getCurrentLocation } from '../services/locationService';
import { triggerSOS } from '../services/alertService';

const STEPS = [
  { label: 'Location Captured',          key: 'location' },
  { label: 'Contacts Notified',          key: 'contacts' },
  { label: 'Finding Nearest Service...', key: 'service'  },
];

export default function SendingScreen({ route, navigation }) {
  const { type, color, locationRef } = route.params;
  const [steps, setSteps]           = useState({ location: false, contacts: false, service: false });
  const [responseTime, setResponseTime] = useState(0);
  const pulseAnim  = useRef(new Animated.Value(0.85)).current;
  const startTime  = useRef(Date.now());

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1,  duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    const timer = setInterval(() => {
      setResponseTime(((Date.now() - startTime.current) / 1000).toFixed(1));
    }, 100);

    sendSOS();
    return () => clearInterval(timer);
  }, []);

  const sendSOS = async () => {
    let capturedLocation = null;

    const hardTimeout = setTimeout(() => {
      navigation.replace('Map', {
        type,
        latitude:  capturedLocation?.latitude  ?? null,
        longitude: capturedLocation?.longitude ?? null,
        alertId: null, nearestService: null,
      });
    }, 8000);

    try {
      let location = locationRef?.current;
      if (!location) location = await getCurrentLocation();
      capturedLocation = location;
      setSteps(s => ({ ...s, location: true }));

      const result = await triggerSOS(type, location.latitude, location.longitude);
      setSteps(s => ({ ...s, contacts: true }));

      setTimeout(() => {
        clearTimeout(hardTimeout);
        setSteps(s => ({ ...s, service: true }));
        setTimeout(() => {
          navigation.replace('Map', {
            type,
            latitude:  location.latitude,
            longitude: location.longitude,
            alertId:   result.alertId,
            nearestService: result.nearestService,
          });
        }, 1000);
      }, 1000);
    } catch (err) {
      console.warn('SOS error:', err.message);
      clearTimeout(hardTimeout);
      setTimeout(() => {
        navigation.replace('Map', {
          type,
          latitude:  capturedLocation?.latitude  ?? null,
          longitude: capturedLocation?.longitude ?? null,
          alertId: null, nearestService: null,
        });
      }, 2000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.title}>Sending SOS...</Text>
      <Text style={styles.subtitle}>Please wait, we are notifying{'\n'}your contacts and services.</Text>

      <View style={styles.circleWrap}>
        <Animated.View style={[styles.outerCircle, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.innerCircle}>
          <Text style={styles.timeText}>{responseTime}s</Text>
          <Text style={styles.timeLabel}>RESPONSE TIME</Text>
        </View>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={[styles.stepIcon, { backgroundColor: steps[step.key] ? '#4caf50' : 'rgba(255,255,255,0.2)' }]}>
              <Text style={{ fontSize: 14 }}>{steps[step.key] ? '✓' : '○'}</Text>
            </View>
            <Text style={[styles.stepLabel, { opacity: steps[step.key] ? 1 : 0.6 }]}>{step.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.doNotClose}>
        <Text style={styles.doNotCloseText}>⏱ Do not close the app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, alignItems: 'center', paddingTop: 80 },
  title:          { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle:       { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  circleWrap:     { marginTop: 40, marginBottom: 40, alignItems: 'center', justifyContent: 'center' },
  outerCircle:    { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  innerCircle:    { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  timeText:       { color: '#fff', fontSize: 42, fontWeight: '900' },
  timeLabel:      { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1, marginTop: 4 },
  steps:          { width: '80%', gap: 16 },
  stepRow:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepLabel:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  doNotClose:     { position: 'absolute', bottom: 60, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  doNotCloseText: { color: '#fff', fontSize: 14 },
});
