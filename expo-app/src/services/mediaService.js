import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export async function captureMedia(type = 'photo') {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: type === 'video'
      ? ImagePicker.MediaTypeOptions.Videos
      : ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    videoMaxDuration: 30,
    allowsEditing: false,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function pickFromGallery() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function uploadMedia(asset, alertId, userId) {
  const formData = new FormData();
  const filename = asset.uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri: asset.uri, type: mimeType, name: filename });
  if (alertId) formData.append('alertId', alertId);
  if (userId)  formData.append('userId', userId);

  const { data } = await axios.post(`${API_BASE_URL}/media/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}
