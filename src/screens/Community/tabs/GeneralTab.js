// src/screens/Community/tabs/GeneralTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Text from '../../../components/Text';
import { nh, nw } from '../../../helper/scales';
import { PALETTE } from '../CommunitySettings';

const GeneralTab = React.memo(({ communityDetails, onUpdate, saving }) => {
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    privacy: 'public',
    joinMethod: 'open'
  });

  useEffect(() => {
    if (communityDetails) {
      setFormState({
        name: communityDetails.name || '',
        description: communityDetails.description || '',
        privacy: communityDetails.privacy?.visibility || communityDetails.privacy || 'public',
        joinMethod: communityDetails.privacy?.joinMethod || communityDetails.joinMethod || 'open'
      });
    }
  }, [communityDetails]);

  const updateField = useCallback((field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!formState.name.trim()) {
      Alert.alert('Validation Error', 'Community name cannot be empty.');
      return;
    }
    onUpdate({ 
      name: formState.name.trim(), 
      description: formState.description.trim(),
      privacy: { visibility: formState.privacy, joinMethod: formState.joinMethod }
    });
  }, [formState, onUpdate]);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Community Name</Text>
          <TextInput 
            style={styles.input} 
            value={formState.name} 
            onChangeText={(text) => updateField('name', text)} 
            placeholder="e.g., Campus Coding Club" 
            placeholderTextColor={PALETTE.subtle} 
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={formState.description} 
            onChangeText={(text) => updateField('description', text)} 
            multiline 
            placeholder="What is this community about?" 
            placeholderTextColor={PALETTE.subtle} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Control</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Visibility</Text>
          <View style={styles.segmentedControl}>
            {['public', 'protected', 'private'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.segment, formState.privacy === p && styles.segmentActive]}
                onPress={() => updateField('privacy', p)}
              >
                <Text style={[styles.segmentText, formState.privacy === p && styles.segmentTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Join Method</Text>
          <View style={styles.segmentedControl}>
            {['open', 'approval', 'invite_only'].map(j => (
              <TouchableOpacity
                key={j}
                style={[styles.segment, formState.joinMethod === j && styles.segmentActive]}
                onPress={() => updateField('joinMethod', j)}
              >
                <Text style={[styles.segmentText, formState.joinMethod === j && styles.segmentTextActive]}>
                  {j.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave} 
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color={PALETTE.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Save General Settings</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  tabContent: { 
    flex: 1, 
    padding: nw(16) 
  },
  section: {
    backgroundColor: PALETTE.surface,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sectionTitle: { 
    fontSize: nw(16), 
    fontWeight: 'bold', 
    color: PALETTE.primary, 
    marginBottom: nh(4) 
  },
  inputGroup: { 
    marginBottom: nh(16) 
  },
  inputLabel: { 
    fontSize: nw(13), 
    fontWeight: '500', 
    color: PALETTE.primary, 
    marginBottom: nh(8) 
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nh(8),
    paddingHorizontal: nw(12),
    paddingVertical: nh(10),
    fontSize: nw(14),
    backgroundColor: PALETTE.background,
    color: PALETTE.primary,
  },
  textArea: { 
    minHeight: nh(100), 
    textAlignVertical: 'top' 
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nh(8),
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: nh(10),
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
  },
  segmentActive: { 
    backgroundColor: PALETTE.primary + '15' 
  },
  segmentText: { 
    fontSize: nw(12), 
    color: PALETTE.muted 
  },
  segmentTextActive: { 
    color: PALETTE.primary, 
    fontWeight: '600' 
  },
  saveButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: nh(12),
    paddingVertical: nh(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: nh(16),
  },
  saveButtonDisabled: { 
    backgroundColor: PALETTE.muted 
  },
  saveButtonText: { 
    color: PALETTE.surface, 
    fontSize: nw(15), 
    fontWeight: 'bold' 
  },
});

export default GeneralTab;