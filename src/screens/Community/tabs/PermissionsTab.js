// src/screens/Community/tabs/PermissionsTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import Text from '../../../components/Text';
import { nh, nw } from '../../../helper/scales';
import { PALETTE } from '../CommunitySettings';

const PermissionsTab = React.memo(({ settings, communityId, onUpdatePermission, getApiModule }) => {
  const [permissions, setPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState('member');
  const [saving, setSaving] = useState(null);

  const roles = ['member', 'moderator', 'admin'];
  const permissionTypes = [
    { key: 'createPost', label: 'Create Posts' },
    { key: 'createPoll', label: 'Create Polls' },
    { key: 'createEvent', label: 'Create Events' },
    { key: 'inviteMembers', label: 'Invite Members' },
  ];

  useEffect(() => {
    setPermissions(settings?.permissions || {});
  }, [settings]);

  const handlePermissionChange = useCallback(async (role, key, value) => {
    setSaving({ role, key });
    
    // Optimistic update
    const optimisticPermissions = JSON.parse(JSON.stringify(permissions));
    if (!optimisticPermissions[role]) optimisticPermissions[role] = {};
    optimisticPermissions[role][key] = value;
    setPermissions(optimisticPermissions);

    try {
      await onUpdatePermission(role, key, value);
    } catch (error) {
      console.error('Failed to update permission:', error);
      Alert.alert('Error', 'Failed to update permission. Please try again.');
      // Revert optimistic update
      setPermissions(settings?.permissions || {});
    } finally {
      setSaving(null);
    }
  }, [permissions, settings, onUpdatePermission]);

  const currentRolePermissions = permissions[selectedRole] || {};

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role Permissions</Text>
        <Text style={styles.sectionDescription}>
          Control what different roles can do in the community.
        </Text>
        <View style={styles.segmentedControl}>
          {roles.map(role => (
            <TouchableOpacity
              key={role}
              style={[styles.segment, selectedRole === role && styles.segmentActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.segmentText, selectedRole === role && styles.segmentTextActive]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.permissionsList}>
          {permissionTypes.map(perm => {
            const isSavingThis = saving?.role === selectedRole && saving?.key === perm.key;
            return (
              <View key={perm.key} style={styles.settingRow}>
                <Text style={styles.settingLabel}>{perm.label}</Text>
                {isSavingThis ? (
                  <ActivityIndicator color={PALETTE.primary} />
                ) : (
                  <Switch
                    value={!!currentRolePermissions[perm.key]}
                    onValueChange={value => handlePermissionChange(selectedRole, perm.key, value)}
                    trackColor={{ false: PALETTE.border, true: PALETTE.primary }}
                    thumbColor={PALETTE.surface}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
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
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nh(8),
    overflow: 'hidden',
    marginBottom: nh(16),
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
  permissionsList: { 
    marginTop: nh(8) 
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  settingLabel: { 
    fontSize: nw(14), 
    fontWeight: '500', 
    color: PALETTE.primary 
  },
});

export default PermissionsTab;