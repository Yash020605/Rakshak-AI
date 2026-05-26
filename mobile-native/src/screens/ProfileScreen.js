import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { saveProfile, getProfile } from '../services/storageService';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileScreen({ navigation }) {
  const [form, setForm] = useState({
    userId: `user_${Date.now()}`,
    name: '',
    bloodGroup: '',
    medicalConditions: '',
    emergencyContacts: [{ name: '', phone: '' }],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((p) => { if (p) setForm(p); });
  }, []);

  const updateContact = (index, field, value) => {
    const contacts = [...form.emergencyContacts];
    contacts[index] = { ...contacts[index], [field]: value };
    setForm({ ...form, emergencyContacts: contacts });
  };

  const addContact = () => {
    if (form.emergencyContacts.length >= 5) return;
    setForm({ ...form, emergencyContacts: [...form.emergencyContacts, { name: '', phone: '' }] });
  };

  const removeContact = (index) => {
    const contacts = form.emergencyContacts.filter((_, i) => i !== index);
    setForm({ ...form, emergencyContacts: contacts });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Name is required');
    const validContacts = form.emergencyContacts.filter((c) => c.name && c.phone);
    if (!validContacts.length) return Alert.alert('Add at least one emergency contact');

    setSaving(true);
    const profile = { ...form, emergencyContacts: validContacts };
    try {
      await saveProfile(profile);
      await axios.post(`${API_BASE_URL}/profile`, profile).catch(() => {}); // sync to server
      Alert.alert('Saved', 'Profile saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Personal Info</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor="#666"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.bloodGroupRow}>
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[styles.bgChip, form.bloodGroup === bg && styles.bgChipActive]}
              onPress={() => setForm({ ...form, bloodGroup: bg })}
            >
              <Text style={[styles.bgChipText, form.bloodGroup === bg && styles.bgChipTextActive]}>
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Medical Conditions (e.g. Diabetic, Asthma)"
          placeholderTextColor="#666"
          value={form.medicalConditions}
          onChangeText={(v) => setForm({ ...form, medicalConditions: v })}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.sectionTitle}>Emergency Contacts</Text>

        {form.emergencyContacts.map((contact, i) => (
          <View key={i} style={styles.contactRow}>
            <TextInput
              style={[styles.input, styles.contactInput]}
              placeholder="Name"
              placeholderTextColor="#666"
              value={contact.name}
              onChangeText={(v) => updateContact(i, 'name', v)}
            />
            <TextInput
              style={[styles.input, styles.contactInput]}
              placeholder="+91XXXXXXXXXX"
              placeholderTextColor="#666"
              value={contact.phone}
              onChangeText={(v) => updateContact(i, 'phone', v)}
              keyboardType="phone-pad"
            />
            {i > 0 && (
              <TouchableOpacity onPress={() => removeContact(i)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {form.emergencyContacts.length < 5 && (
          <TouchableOpacity style={styles.addBtn} onPress={addContact}>
            <Text style={styles.addBtnText}>+ Add Contact</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  bloodGroupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  bgChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  bgChipActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
  bgChipText: { color: '#aaa', fontSize: 13 },
  bgChipTextActive: { color: '#fff', fontWeight: '700' },
  contactRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  contactInput: { flex: 1 },
  removeBtn: { padding: 8 },
  removeBtnText: { color: '#E53935', fontSize: 18 },
  addBtn: { alignItems: 'center', padding: 12, marginBottom: 8 },
  addBtnText: { color: '#4fc3f7', fontSize: 14 },
  saveBtn: {
    backgroundColor: '#E53935',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
