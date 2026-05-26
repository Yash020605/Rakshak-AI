import { launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

async function requestCameraPermissions(isVideo) {
  if (Platform.OS !== 'android') return true;
  try {
    const perms = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      ...(isVideo ? [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] : []),
    ];
    const results = await PermissionsAndroid.requestMultiple(perms);
    return Object.values(results).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

export async function captureMedia(type = 'photo') {
  const isVideo = type === 'video';
  const granted = await requestCameraPermissions(isVideo);
  if (!granted) {
    Alert.alert('Permission Denied', 'Camera permission is required to capture evidence.');
    return null;
  }

  return new Promise((resolve, reject) => {
    launchCamera(
      {
        mediaType: isVideo ? 'video' : 'photo',
        quality: 0.7,
        videoQuality: 'medium',
        durationLimit: 30,
        saveToPhotos: false,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) return resolve(null);
        if (response.errorCode) {
          console.warn('Camera error:', response.errorMessage);
          return reject(new Error(response.errorMessage || 'Camera failed'));
        }
        resolve(response.assets?.[0] || null);
      }
    );
  });
}

export async function uploadMedia(asset, alertId, userId) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `capture_${Date.now()}.jpg`,
  });
  if (alertId) formData.append('alertId', alertId);
  if (userId) formData.append('userId', userId);

  const { data } = await axios.post(`${API_BASE_URL}/media/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}
