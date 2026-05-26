import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// Use native LocationManager — no Google Play Services dependency
Geolocation.setRNConfiguration({ skipPermissionRequests: false, authorizationLevel: 'whenInUse' });

export async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Rakshak AI needs your location to send SOS alerts.',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    const fallbackTimer = setTimeout(() => {
      reject(new Error('GPS timeout — location unavailable'));
    }, 6000);

    Geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        clearTimeout(fallbackTimer);
        reject(new Error(`GPS error: ${err.message}`));
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );
  });
}

export function watchLocation(callback) {
  return Geolocation.watchPosition(
    (pos) => callback({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    (err) => console.warn('Watch error:', err.message),
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
  );
}

export function clearWatch(watchId) {
  if (watchId != null) Geolocation.clearWatch(watchId);
}
