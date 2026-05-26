import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@rakshak_profile';

export async function saveProfile(profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getProfile() {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
