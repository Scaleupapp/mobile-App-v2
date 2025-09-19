// src/screens/Community/CommunitySettings.js
'use strict';

import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import { getCommunityDetailsApi, updateCommunityApi } from '../../services/apiService';
import { useFocusEffect } from '@react-navigation/native';

// shallow-enough equality for settings form; good for “dirty” check
const isObjectEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const CommunitySettings = ({ route, navigation }) => {
  const { communityId } = route.params || {};

  const [initialData, setInitialData] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinMethod, setJoinMethod] = useState('open');
  const [domains, setDomains] = useState([]);
  const [currentDomain, setCurrentDomain] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const buildSnapshot = useCallback(
    (base) => ({
      name: (name || '').trim(),
      description: (description || '').trim(),
      privacy: { ...(base?.privacy || {}), joinMethod },
      institutionalInfo: {
        ...(base?.institutionalInfo || {}),
        verifiedDomains: (domains || []).map((d) => ({ domain: d, verified: true })),
      },
    }),
    [name, description, joinMethod, domains]
  );

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    const current = buildSnapshot(initialData);
    return !isObjectEqual(initialData, current);
  }, [initialData, buildSnapshot]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCommunityDetailsApi(communityId);
      const community = response?.data?.community || {};

      const initial = {
        name: community.name || '',
        description: community.description || '',
        privacy: community.privacy || { joinMethod: 'open' },
        institutionalInfo: community.institutionalInfo || { verifiedDomains: [] },
      };

      setInitialData(initial);
      setName(initial.name);
      setDescription(initial.description);
      setJoinMethod(initial.privacy?.joinMethod || 'open');
      setDomains((initial.institutionalInfo?.verifiedDomains || []).map((d) => d.domain).filter(Boolean));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      Alert.alert('Error', 'Could not load community settings.');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  // React Navigation recommends wrapping in a callback returning cleanup (if any)
  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {};
    }, [fetchData])
  );

  const handleAddDomain = () => {
    const domainToAdd = (currentDomain || '').trim().toLowerCase();
    const valid = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(domainToAdd);
    if (domainToAdd && valid && !domains.includes(domainToAdd)) {
      setDomains((prev) => [...prev, domainToAdd]);
      setCurrentDomain('');
    } else {
      Alert.alert('Invalid Domain', 'Please enter a valid domain format (e.g., example.com).');
    }
  };

  const handleRemoveDomain = (indexToRemove) => {
    setDomains((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveChanges = async () => {
    if (!initialData) return;
    setIsSaving(true);
    try {
      const payload = buildSnapshot(initialData);
      await updateCommunityApi(communityId, payload);
      Alert.alert('Success', 'Community settings have been updated.');
      await fetchData(); // refresh to reset dirty state
    } catch (error) {
      const errorMessage = error?.response?.data?.error?.message || 'Could not save changes.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCommunity = () => {
    Alert.alert(
      'Delete Community',
      'Are you sure? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Deletion confirmed (hook API here)'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color={COLORS.blue043142} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <Icon name="arrow-back" size={nw(24)} color={COLORS.blue043142} />
          </TouchableOpacity>
          <Text variant="bold18" color={COLORS.blue043142}>
            Community Settings
          </Text>
          <View style={{ width: nw(24) }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>General Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Community Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.sectionTitle}>Privacy & Access</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, joinMethod === 'open' && styles.activeToggle]}
              onPress={() => setJoinMethod('open')}
            >
              <Text color={joinMethod === 'open' ? COLORS.blue043142 : COLORS.grey666666}>Open to All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, joinMethod === 'approval' && styles.activeToggle]}
              onPress={() => setJoinMethod('approval')}
            >
              <Text color={joinMethod === 'approval' ? COLORS.blue043142 : COLORS.grey666666}>
                Approval Required
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Auto-Join Domain Rule</Text>
          <Text style={styles.sectionSubtitle}>
            Allow users with a specific email domain to join automatically.
          </Text>
          <View style={styles.domainInputContainer}>
            <TextInput
              style={styles.domainInput}
              placeholder="e.g., stanford.edu"
              value={currentDomain}
              onChangeText={setCurrentDomain}
              onSubmitEditing={handleAddDomain}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddDomain}>
              <Text color={COLORS.whiteFFFFFF}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.domainPillsContainer}>
            {domains.map((domain, index) => (
              <View key={`${domain}-${index}`} style={styles.domainPill}>
                <Text style={styles.domainPillText}>{domain}</Text>
                <TouchableOpacity onPress={() => handleRemoveDomain(index)} accessibilityLabel={`Remove ${domain}`}>
                  <Icon name="close-circle" size={nw(18)} color={COLORS.whiteFFFFFF} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCommunity}>
              <Text color={'red'} variant="bold16">
                Delete Community
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isDirty && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={COLORS.whiteFFFFFF} />
              ) : (
                <Text variant="bold16" color={COLORS.whiteFFFFFF}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.whiteF9F9F9 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  scrollContainer: { padding: nw(16), flexGrow: 1, paddingBottom: nh(100) },
  sectionTitle: {
    fontSize: nw(18),
    fontWeight: 'bold',
    color: COLORS.blue043142,
    marginTop: nh(20),
    marginBottom: nh(10),
  },
  sectionSubtitle: { fontSize: nw(14), color: COLORS.grey666666, marginBottom: nh(15), lineHeight: nh(20) },
  input: {
    borderWidth: 1,
    borderColor: COLORS.greyE0E0E0,
    borderRadius: nh(8),
    padding: nw(12),
    fontSize: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    marginBottom: nh(10),
  },
  textArea: { height: nh(120), textAlignVertical: 'top' },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.greyE0E0E0,
    borderRadius: nh(8),
    overflow: 'hidden',
  },
  toggleButton: { flex: 1, padding: nw(12), alignItems: 'center', backgroundColor: COLORS.whiteFFFFFF },
  activeToggle: { backgroundColor: COLORS.blueLightF0 },
  domainInputContainer: { flexDirection: 'row' },
  domainInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.greyE0E0E0,
    borderTopLeftRadius: nh(8),
    borderBottomLeftRadius: nh(8),
    padding: nw(12),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  addButton: {
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(20),
    justifyContent: 'center',
    borderTopRightRadius: nh(8),
    borderBottomRightRadius: nh(8),
  },
  domainPillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: nh(10) },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(16),
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    marginRight: nw(8),
    marginBottom: nw(8),
  },
  domainPillText: { color: COLORS.whiteFFFFFF, marginRight: nw(6) },
  dangerZone: { marginTop: nh(30), borderTopWidth: 1, borderTopColor: COLORS.greyEEEEEE, paddingTop: nh(10) },
  deleteButton: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: nh(8),
    padding: nw(12),
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: nw(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  saveButton: {
    backgroundColor: COLORS.blue043142,
    height: nh(48),
    borderRadius: nh(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunitySettings;
