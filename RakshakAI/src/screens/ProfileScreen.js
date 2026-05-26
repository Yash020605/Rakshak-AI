import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
  Image, ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import axios from 'axios';
import { saveProfile, getProfile } from '../services/storageService';
import { API_BASE_URL } from '../config/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Permission helper ────────────────────────────────────────────────────────
async function requestStoragePermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
    return Object.values(granted).every(
      (r) => r === PermissionsAndroid.RESULTS.GRANTED || r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    );
  } catch {
    return false;
  }
}

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadFile(uri, type, name, endpoint) {
  const formData = new FormData();
  formData.append('file', { uri, type: type || 'image/jpeg', name: name || 'upload.jpg' });
  const { data } = await axios.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}

export default function ProfileScreen({ navigation }) {
  const [form, setForm] = useState({
    userId: `user_${Date.now()}`,
    name: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: '',
    medications: '',
    address: '',
    emergencyContacts: [{ name: '', phone: '' }],
    photoUrl: null,
    prescriptions: [],
  });
  const [saving, setSaving]               = useState(false);
  const [showExtra, setShowExtra]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto]   = useState(false);
  const [uploadingRx, setUploadingRx]     = useState(false);

  useEffect(() => {
    getProfile().then((p) => { if (p) setForm(f => ({ ...f, ...p })); });
  }, []);

  // ─── Photo picker ───────────────────────────────────────────────────────────
  const handlePickPhoto = () => {
    Alert.alert('Profile Photo', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          await requestStoragePermission();
          launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, handlePhotoResponse);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          await requestStoragePermission();
          launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, handlePhotoResponse);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePhotoResponse = async (response) => {
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (!asset) return;

    setUploadingPhoto(true);
    try {
      const userId = form.userId;
      const result = await uploadFile(
        asset.uri,
        asset.type,
        asset.fileName || 'photo.jpg',
        `${API_BASE_URL}/profile/${userId}/photo`
      );
      const newForm = { ...form, photoUrl: result.photoUrl };
      setForm(newForm);
      await saveProfile(newForm);
      Alert.alert('✅ Photo updated');
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ─── Prescription picker ────────────────────────────────────────────────────
  const handleAddPrescription = () => {
    Alert.alert('Add Prescription', 'Choose source', [
      {
        text: 'Camera (photo)',
        onPress: async () => {
          await requestStoragePermission();
          launchCamera({ mediaType: 'photo', quality: 0.9, saveToPhotos: false }, (r) =>
            handlePrescriptionResponse(r, 'photo')
          );
        },
      },
      {
        text: 'Gallery (image)',
        onPress: async () => {
          await requestStoragePermission();
          launchImageLibrary({ mediaType: 'photo', quality: 0.9 }, (r) =>
            handlePrescriptionResponse(r, 'image')
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePrescriptionResponse = async (response, source) => {
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (!asset) return;

    // Ask for a label
    Alert.prompt(
      'Prescription Name',
      'Enter a label (e.g. "Diabetes - Dr. Sharma")',
      async (label) => {
        if (!label) return;
        setUploadingRx(true);
        try {
          const formData = new FormData();
          formData.append('prescription', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'prescription.jpg',
          });
          formData.append('name', label);
          const { data } = await axios.post(
            `${API_BASE_URL}/profile/${form.userId}/prescription`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }
          );
          const newPrescriptions = [...(form.prescriptions || []), data.prescription];
          const newForm = { ...form, prescriptions: newPrescriptions };
          setForm(newForm);
          await saveProfile(newForm);
          Alert.alert('✅ Prescription uploaded');
        } catch (err) {
          Alert.alert('Upload failed', err.message);
        } finally {
          setUploadingRx(false);
        }
      },
      'plain-text',
      '',
    );
  };

  const handleDeletePrescription = (index) => {
    Alert.alert('Remove Prescription', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(
              `${API_BASE_URL}/profile/${form.userId}/prescription/${index}`,
              { timeout: 8000 }
            );
            const newPrescriptions = form.prescriptions.filter((_, i) => i !== index);
            const newForm = { ...form, prescriptions: newPrescriptions };
            setForm(newForm);
            await saveProfile(newForm);
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  // ─── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Name is required');
    const validContacts = form.emergencyContacts.filter((c) => c.name && c.phone);
    if (!validContacts.length) return Alert.alert('Add at least one emergency contact');
    setSaving(true);
    const profile = { ...form, emergencyContacts: validContacts };
    try {
      await saveProfile(profile);
      await axios.post(`${API_BASE_URL}/profile`, profile).catch(() => {});
      Alert.alert('Saved', 'Profile saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateContact = (index, field, value) => {
    const contacts = [...form.emergencyContacts];
    contacts[index] = { ...contacts[index], [field]: value };
    setForm({ ...form, emergencyContacts: contacts });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0d0d0d' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap}>
            {uploadingPhoto ? (
              <ActivityIndicator color="#E53935" size="large" />
            ) : form.photoUrl ? (
              <Image source={{ uri: form.photoUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 40 }}>👤</Text>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={{ fontSize: 12 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{form.name || 'Your Name'}</Text>
          <Text style={styles.avatarSub}>Tap photo to change</Text>
        </View>

        {/* ── Personal info ── */}
        <Text style={styles.sectionTitle}>Personal Info</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor="#555"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        {/* ── Medical info ── */}
        <Text style={styles.sectionTitle}>Medical Information</Text>

        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.bloodGroupRow}>
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[styles.bgChip, form.bloodGroup === bg && styles.bgChipActive]}
              onPress={() => setForm({ ...form, bloodGroup: bg })}
            >
              <Text style={[styles.bgChipText, form.bloodGroup === bg && { color: '#fff' }]}>
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          placeholder="Medical Conditions (e.g. Diabetic, Asthma)"
          placeholderTextColor="#555"
          value={form.medicalConditions}
          onChangeText={(v) => setForm({ ...form, medicalConditions: v })}
          multiline
        />

        <TouchableOpacity style={styles.addMoreBtn} onPress={() => setShowExtra(!showExtra)}>
          <Text style={styles.addMoreText}>
            {showExtra ? '▲ Hide extra details' : '✏️ Add more details'}
          </Text>
        </TouchableOpacity>

        {showExtra && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Allergies (e.g. Penicillin, Peanuts)"
              placeholderTextColor="#555"
              value={form.allergies}
              onChangeText={(v) => setForm({ ...form, allergies: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Current Medications"
              placeholderTextColor="#555"
              value={form.medications}
              onChangeText={(v) => setForm({ ...form, medications: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Home Address"
              placeholderTextColor="#555"
              value={form.address}
              onChangeText={(v) => setForm({ ...form, address: v })}
            />
          </>
        )}

        {/* ── Prescriptions ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Medical Prescriptions</Text>
          <TouchableOpacity onPress={handleAddPrescription} disabled={uploadingRx}>
            {uploadingRx
              ? <ActivityIndicator color="#4fc3f7" size="small" />
              : <Text style={styles.addContactBtn}>+ Add</Text>
            }
          </TouchableOpacity>
        </View>

        {(!form.prescriptions || form.prescriptions.length === 0) ? (
          <View style={styles.emptyRx}>
            <Text style={styles.emptyRxIcon}>📋</Text>
            <Text style={styles.emptyRxText}>No prescriptions added</Text>
            <Text style={styles.emptyRxSub}>
              Add photos of your prescriptions — they'll be shared with responders during an SOS
            </Text>
          </View>
        ) : (
          form.prescriptions.map((rx, i) => (
            <View key={i} style={styles.rxCard}>
              <Image
                source={{ uri: rx.url }}
                style={styles.rxThumb}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rxName} numberOfLines={1}>{rx.name}</Text>
                <Text style={styles.rxDate}>
                  {rx.uploadedAt ? new Date(rx.uploadedAt).toLocaleDateString() : 'Uploaded'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.rxDeleteBtn}
                onPress={() => handleDeletePrescription(i)}
              >
                <Text style={{ color: '#E53935', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ── Emergency contacts ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity
            onPress={() =>
              setForm({ ...form, emergencyContacts: [...form.emergencyContacts, { name: '', phone: '' }] })
            }
          >
            <Text style={styles.addContactBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {form.emergencyContacts.map((contact, i) => (
          <View key={i} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.contactInput}
                placeholder="Contact Name"
                placeholderTextColor="#555"
                value={contact.name}
                onChangeText={(v) => updateContact(i, 'name', v)}
              />
              <TextInput
                style={styles.contactInput}
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor="#555"
                value={contact.phone}
                onChangeText={(v) => updateContact(i, 'phone', v)}
                keyboardType="phone-pad"
              />
            </View>
            {i > 0 && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => {
                  const c = form.emergencyContacts.filter((_, idx) => idx !== i);
                  setForm({ ...form, emergencyContacts: c });
                }}
              >
                <Text style={{ color: '#E53935', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.syncNote}>
          <Text style={styles.syncNoteText}>
            🛡️ Your profile, photo and prescriptions are shared with responders during an SOS.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Map', {})}>
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navLabel, { color: '#4fc3f7' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backBtn:          { color: '#fff', fontSize: 24 },
  headerTitle:      { color: '#fff', fontSize: 20, fontWeight: '800' },
  content:          { padding: 20, paddingBottom: 30 },

  // Avatar
  avatarSection:    { alignItems: 'center', marginBottom: 24 },
  avatarWrap:       { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'visible' },
  avatarImg:        { width: 90, height: 90, borderRadius: 45 },
  avatarEditBadge:  { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E53935', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0d0d0d' },
  avatarName:       { color: '#fff', fontSize: 20, fontWeight: '700' },
  avatarSub:        { color: '#555', fontSize: 12, marginTop: 4 },

  sectionTitle:     { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  sectionRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  label:            { color: '#aaa', fontSize: 13, marginBottom: 8 },
  addContactBtn:    { color: '#4fc3f7', fontSize: 14 },

  bloodGroupRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  bgChip:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: '#333' },
  bgChipActive:     { backgroundColor: '#E53935', borderColor: '#E53935' },
  bgChipText:       { color: '#888', fontSize: 12 },

  input:            { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  addMoreBtn:       { marginBottom: 16 },
  addMoreText:      { color: '#4fc3f7', fontSize: 13 },

  // Prescriptions
  emptyRx:          { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a', borderStyle: 'dashed' },
  emptyRxIcon:      { fontSize: 32, marginBottom: 8 },
  emptyRxText:      { color: '#aaa', fontSize: 14, fontWeight: '600' },
  emptyRxSub:       { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  rxCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  rxThumb:          { width: 56, height: 56, borderRadius: 10, backgroundColor: '#2a2a2a' },
  rxName:           { color: '#fff', fontSize: 14, fontWeight: '600' },
  rxDate:           { color: '#555', fontSize: 12, marginTop: 3 },
  rxDeleteBtn:      { padding: 8 },

  // Contacts
  contactCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12, marginBottom: 10, gap: 10 },
  contactAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  contactInput:     { color: '#fff', fontSize: 13, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', marginBottom: 4 },
  callBtn:          { padding: 8 },

  syncNote:         { backgroundColor: '#0d1a2e', borderRadius: 12, padding: 14, marginVertical: 16 },
  syncNoteText:     { color: '#4fc3f7', fontSize: 13, textAlign: 'center' },
  saveBtn:          { backgroundColor: '#E53935', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 8 },
  saveBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },

  bottomNav:        { flexDirection: 'row', backgroundColor: '#1a1a1a', paddingVertical: 10, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  navItem:          { flex: 1, alignItems: 'center' },
  navIcon:          { fontSize: 22 },
  navLabel:         { color: '#888', fontSize: 11, marginTop: 3 },
});
