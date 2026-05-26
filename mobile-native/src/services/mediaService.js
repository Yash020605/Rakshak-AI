import { launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export function captureMedia(type = 'photo') {
  return new Promise((resolve, reject) => {
    launchCamera(
      {
        mediaType: type === 'video' ? 'video' : 'photo',
        quality: 0.7,
        videoQuality: 'medium',
        durationLimit: 30,
        saveToPhotos: false,
      },
      (response) => {
        if (response.didCancel) return resolve(null);
        if (response.errorCode) return reject(new Error(response.errorMessage));
        resolve(response.assets?.[0] || null);
      }
    );
  });
}

export async function uploadMedia(asset, alertId, userId) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: asset.type,
    name: asset.fileName || 'capture',
  });
  if (alertId) formData.append('alertId', alertId);
  if (userId) formData.append('userId', userId);

  const { data } = await axios.post(`${API_BASE_URL}/media/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}
