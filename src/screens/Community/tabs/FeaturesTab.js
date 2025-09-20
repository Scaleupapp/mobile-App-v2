// src/screens/Community/tabs/FeaturesTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Text from '../../../components/Text';
import { nh, nw } from '../../../helper/scales';
import { PALETTE } from '../CommunitySettings';

const FeaturesTab = React.memo(({ settings, onSave, saving }) => {
  const [features, setFeatures] = useState({});

  const featureList = [
    { key: 'polls', label: 'Polls', description: 'Allow members to create and vote on polls.' },
    { key: 'events', label: 'Events', description: 'Enable event creation and RSVPs.' },
    { key: 'resources', label: 'Resources', description: 'Allow file and document sharing.' },
  ];

  useEffect(() => {
    setFeatures(settings?.featureToggles || {});
  }, [settings]);

  const handleToggle = useCallback((key, value) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave('features', { featureToggles: features });
  }, [features, onSave]);

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Features</Text>
        <Text style={styles.sectionDescription}>
          Enable or disable core functionalities for your community.
        </Text>
        {featureList.map(feature => (
          <View key={feature.key} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{feature.label}</Text>
              <Text style={styles.settingDescription}>{feature.description}</Text>
            </View>
            <Switch
              value={features[feature.key] !== false}
              onValueChange={value => handleToggle(feature.key, value)}
              trackColor={{ false: PALETTE.border, true: PALETTE.primary }}
              thumbColor={PALETTE.surface}
            />
          </View>
        ))}
      </View>
      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave} 
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color={PALETTE.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Save Feature Settings</Text>
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
  sectionDescription: { 
    fontSize: nw(12), 
    color: PALETTE.muted, 
    marginBottom: nh(16), 
    lineHeight: nh(18) 
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  settingInfo: { 
    flex: 1, 
    marginRight: nw(12) 
  },
  settingLabel: { 
    fontSize: nw(14), 
    fontWeight: '500', 
    color: PALETTE.primary, 
    marginBottom: nh(2) 
  },
  settingDescription: { 
    fontSize: nw(12), 
    color: PALETTE.muted 
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

export default FeaturesTab;