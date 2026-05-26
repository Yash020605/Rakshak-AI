import * as Location from 'expo-location';

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    await Location.requestForegroundPermissionsAsync();
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5000,
  });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export function watchLocation(callback) {
  let sub = null;
  Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 },
    (pos) => callback({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
  ).then((s) => { sub = s; });
  // Return a fake watchId object — clearWatch will call sub.remove()
  return { _sub: () => sub };
}

export function clearWatch(watchRef) {
  if (watchRef && typeof watchRef._sub === 'function') {
    const sub = watchRef._sub();
    sub?.remove();
  }
}
