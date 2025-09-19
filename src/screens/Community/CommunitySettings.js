// src/screens/Community/CommunitySettings.js
'use strict';

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import { 
  getCommunityDetailsApi,
  updateCommunityApi,
  getCommunitySettingsApi,
  updateCommunitySettingsApi,
  updateRolePermissionsApi, // Added for Permissions Tab
  // deleteCommunityApi would be needed for Danger Zone
} from '../../services/apiService';
import { useFocusEffect } from '@react-navigation/native';

// Tab configurations
const TABS = [
  { id: 'general', label: 'General', icon: 'settings-outline' },
  { id: 'content', label: 'Content', icon: 'shield-checkmark-outline' },
  { id: 'permissions', label: 'Permissions', icon: 'key-outline' },
  { id: 'features', label: 'Features', icon: 'apps-outline' },
  { id: 'danger', label: 'Danger Zone', icon: 'warning-outline' },
];

const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  danger: COLORS.redEA4335,
};

// =============================================================================
// SUB-COMPONENTS (TABS)
// =============================================================================

const GeneralTab = ({ communityDetails, communityId, onUpdate, saving }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [joinMethod, setJoinMethod] = useState('open');

  useEffect(() => {
    if (communityDetails) {
      setName(communityDetails.name || '');
      setDescription(communityDetails.description || '');
      setPrivacy(communityDetails.privacy?.visibility || communityDetails.privacy || 'public');
      setJoinMethod(communityDetails.privacy?.joinMethod || communityDetails.joinMethod || 'open');
    }
  }, [communityDetails]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Community name cannot be empty.');
      return;
    }
    onUpdate({ 
      name: name.trim(), 
      description: description.trim(),
      privacy: { visibility: privacy, joinMethod }
    });
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Community Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Campus Coding Club" placeholderTextColor={PALETTE.subtle} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="What is this community about?" placeholderTextColor={PALETTE.subtle} />
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
                style={[styles.segment, privacy === p && styles.segmentActive]}
                onPress={() => setPrivacy(p)}
              >
                <Text style={[styles.segmentText, privacy === p && styles.segmentTextActive]}>
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
                style={[styles.segment, joinMethod === j && styles.segmentActive]}
                onPress={() => setJoinMethod(j)}
              >
                <Text style={[styles.segmentText, joinMethod === j && styles.segmentTextActive]}>
                  {j.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={PALETTE.surface} /> : <Text style={styles.saveButtonText}>Save General Settings</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const ContentModerationTab = ({ settings, onSave, saving }) => {
    const [bannedWords, setBannedWords] = useState([]);
    const [newWord, setNewWord] = useState('');
  
    useEffect(() => {
      if (settings && settings.contentFilters) {
        setBannedWords(settings.contentFilters.bannedWords || []);
      }
    }, [settings]);
  
    const handleAddWord = () => {
      const wordToAdd = newWord.trim().toLowerCase();
      if (!wordToAdd || bannedWords.some(w => w.word === wordToAdd)) {
        setNewWord('');
        return;
      }
      const updatedWords = [...bannedWords, { word: wordToAdd, severity: 'medium', action: 'flag' }];
      onSave('content', { bannedWords: updatedWords });
      setNewWord('');
    };
  
    const handleRemoveWord = (wordToRemove) => {
      const updatedWords = bannedWords.filter(w => w.word !== wordToRemove);
      onSave('content', { bannedWords: updatedWords });
    };
  
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banned Words</Text>
          <Text style={styles.sectionDescription}>Automatically filter content containing these words.</Text>
          <View style={styles.domainInput}>
            <TextInput
              style={styles.domainInputField}
              value={newWord}
              onChangeText={setNewWord}
              placeholder="Add a word to filter..."
              onSubmitEditing={handleAddWord}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddWord} disabled={saving}>
               <Icon name="add" size={nw(20)} color={PALETTE.surface} />
            </TouchableOpacity>
          </View>
          {bannedWords.length > 0 && 
              <View style={styles.domainList}>
              {bannedWords.map((item, index) => (
                  <View key={index} style={styles.domainChip}>
                  <Text style={styles.domainChipText}>{item.word}</Text>
                  <TouchableOpacity onPress={() => handleRemoveWord(item.word)}>
                      <Icon name="close-circle" size={nw(18)} color={PALETTE.surface} />
                  </TouchableOpacity>
                  </View>
              ))}
              </View>
          }
        </View>
      </ScrollView>
    );
  };

const PermissionsTab = ({ settings, communityId, onUpdate }) => {
    const [permissions, setPermissions] = useState({});
    const [selectedRole, setSelectedRole] = useState('member');
    const [saving, setSaving] = useState(null); // e.g., { role: 'member', key: 'createPost' }
  
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
  
    const handlePermissionChange = async (role, key, value) => {
      setSaving({ role, key });
      const optimisticPermissions = JSON.parse(JSON.stringify(permissions));
      if (!optimisticPermissions[role]) optimisticPermissions[role] = {};
      optimisticPermissions[role][key] = value;
      setPermissions(optimisticPermissions);

      try {
        await updateRolePermissionsApi(communityId, { role, permissions: { [key]: value } });
        // No success alert to avoid spamming the user on every toggle
      } catch (error) {
        console.error('Failed to update permission:', error);
        Alert.alert('Error', 'Failed to update permission. Please try again.');
        // Revert optimistic update on failure
        setPermissions(settings?.permissions || {});
      } finally {
        setSaving(null);
        // We call onUpdate to refetch all settings to be safe
        onUpdate();
      }
    };
  
    const currentRolePermissions = permissions[selectedRole] || {};
  
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Permissions</Text>
          <Text style={styles.sectionDescription}>Control what different roles can do in the community.</Text>
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
          <View style={{ marginTop: nh(16) }}>
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
  };

const FeaturesTab = ({ settings, onSave, saving }) => {
    const [features, setFeatures] = useState({});

    const featureList = [
        { key: 'polls', label: 'Polls', description: 'Allow members to create and vote on polls.' },
        { key: 'events', label: 'Events', description: 'Enable event creation and RSVPs.' },
        { key: 'resources', label: 'Resources', description: 'Allow file and document sharing.' },
    ];
  
    useEffect(() => {
      setFeatures(settings?.featureToggles || {});
    }, [settings]);
  
    const handleSave = () => {
      onSave('features', { featureToggles: features });
    };
  
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Features</Text>
          <Text style={styles.sectionDescription}>Enable or disable core functionalities for your community.</Text>
            {featureList.map(feature => (
                <View key={feature.key} style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>{feature.label}</Text>
                        <Text style={styles.settingDescription}>{feature.description}</Text>
                    </View>
                    <Switch
                        value={features[feature.key] !== false}
                        onValueChange={value => setFeatures(prev => ({ ...prev, [feature.key]: value }))}
                        trackColor={{ false: PALETTE.border, true: PALETTE.primary }}
                        thumbColor={PALETTE.surface}
                    />
                </View>
            ))}
        </View>
        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={PALETTE.surface} /> : <Text style={styles.saveButtonText}>Save Feature Settings</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };
  
const DangerTab = ({ communityId, navigation }) => {
    const handleDelete = () => {
      Alert.alert(
        'Delete Community',
        'This is a permanent action and cannot be undone. All posts, members, and data will be lost. Are you absolutely sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: async () => {
              try {
                // NOTE: deleteCommunityApi needs to be created in your apiService.ts
                // await deleteCommunityApi(communityId); 
                Alert.alert('Success', 'Community has been deleted.');
                navigation.goBack();
              } catch (error) {
                console.error('Failed to delete community:', error);
                Alert.alert('Error', 'Could not delete community.');
              }
            },
          },
        ]
      );
    };
  
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDescription}>These actions are irreversible. Please be certain.</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
            <Text style={styles.dangerButtonText}>Delete This Community</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CommunitySettings = ({ route, navigation }) => {
  const { communityId } = route.params || {};
  const [activeTab, setActiveTab] = useState('general');
  const [community, setCommunity] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);

  const fetchData = useCallback(async () => {
    if (!communityId) {
      Alert.alert('Error', 'Community ID is missing.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      return;
    }
    setLoading(true);
    try {
      const [detailsRes, settingsRes] = await Promise.all([
        getCommunityDetailsApi(communityId),
        getCommunitySettingsApi(communityId)
      ]);

      const communityData = detailsRes.data?.data?.community || detailsRes.data?.community || {};
      const settingsData = settingsRes.data?.data || settingsRes.data || {};
      
      console.log('--- RAW COMMUNITY DETAILS FROM BACKEND ---');
      console.log(JSON.stringify(communityData, null, 2));
      console.log('--- RAW SETTINGS DATA FROM BACKEND ---');
      console.log(JSON.stringify(settingsData, null, 2));
      
      setCommunity(communityData);
      setSettings(settingsData);

    } catch (error) {
      console.error('Error fetching data:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not load community data.');
    } finally {
      setLoading(false);
    }
  }, [communityId, navigation]);

  useFocusEffect(useCallback(() => {
    fetchData();
  }, [fetchData]));
  
  const handleUpdateCommunityDetails = async (updates) => {
    setSavingSection('general');
    try {
      await updateCommunityApi(communityId, updates);
      Alert.alert('Success', `General settings updated!`);
      await fetchData();
    } catch(error) {
       console.error(`Error updating general details:`, error.response?.data || error.message);
       Alert.alert('Error', `Failed to update general settings.`);
    } finally {
        setSavingSection(null);
    }
  };

  const handleUpdateSettings = async (section, updates) => {
    setSavingSection(section);
    try {
      console.log(`--- SAVING SETTINGS FOR SECTION: ${section} ---`, { section, updates });
      
      await updateCommunitySettingsApi(communityId, { section, updates });
      Alert.alert('Success', `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated!`);
      await fetchData();
    } catch (error) {
      console.error(`Error updating ${section}:`, error.response?.data || error.message);
      Alert.alert('Error', `Failed to update ${section} settings.`);
    } finally {
      setSavingSection(null);
    }
  };
  
  const TabBar = ({ activeTab, onTabPress }) => (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.id)}
            >
              <Icon 
                name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                size={nw(18)} 
                color={isActive ? PALETTE.primary : PALETTE.muted} 
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    if (loading || !settings || !community) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.loadingText}>Loading Settings...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'general':
        return <GeneralTab communityDetails={community} communityId={communityId} onSave={handleUpdateCommunityDetails} saving={savingSection === 'general'} />;
      case 'content':
        return <ContentModerationTab settings={settings} onSave={handleUpdateSettings} saving={savingSection === 'content'} />;
      case 'permissions':
        return <PermissionsTab settings={settings} communityId={communityId} onUpdate={fetchData} />;
      case 'features':
        return <FeaturesTab settings={settings} onSave={handleUpdateSettings} saving={savingSection === 'features'} />;
      case 'danger':
        return <DangerTab communityId={communityId} navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={nw(24)} color={PALETTE.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Settings</Text>
        <View style={{ width: nw(24) }} />
      </View>

      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
      
      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: PALETTE.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: nw(16),
      backgroundColor: PALETTE.surface,
      borderBottomWidth: 1,
      borderBottomColor: PALETTE.border,
    },
    headerTitle: { fontSize: nw(18), fontWeight: 'bold', color: PALETTE.primary },
    tabBar: { backgroundColor: PALETTE.surface, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
    tabBarContent: { paddingHorizontal: nw(8) },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: nw(12),
      paddingVertical: nh(14),
      marginHorizontal: nw(4),
      gap: nw(6),
    },
    activeTab: { borderBottomWidth: 2, borderBottomColor: PALETTE.primary },
    tabLabel: { fontSize: nw(13), color: PALETTE.muted, fontWeight: '500' },
    activeTabLabel: { color: PALETTE.primary, fontWeight: '600' },
    tabContent: { flex: 1, padding: nw(16) },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: nh(12) },
    loadingText: { fontSize: nw(14), color: PALETTE.muted },
    section: {
      backgroundColor: PALETTE.surface,
      borderRadius: nw(12),
      padding: nw(16),
      marginBottom: nh(16),
      borderWidth: 1,
      borderColor: PALETTE.border,
    },
    sectionTitle: { fontSize: nw(16), fontWeight: 'bold', color: PALETTE.primary, marginBottom: nh(4) },
    sectionDescription: { fontSize: nw(12), color: PALETTE.muted, marginBottom: nh(16), lineHeight: nh(18) },
    inputGroup: { marginBottom: nh(16) },
    inputLabel: { fontSize: nw(13), fontWeight: '500', color: PALETTE.text, marginBottom: nh(8) },
    input: {
      borderWidth: 1,
      borderColor: PALETTE.border,
      borderRadius: nh(8),
      paddingHorizontal: nw(12),
      paddingVertical: nh(10),
      fontSize: nw(14),
      backgroundColor: PALETTE.background,
      color: PALETTE.text,
    },
    textArea: { minHeight: nh(100), textAlignVertical: 'top' },
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
    segmentActive: { backgroundColor: PALETTE.primary + '15' },
    segmentText: { fontSize: nw(12), color: PALETTE.muted },
    segmentTextActive: { color: PALETTE.primary, fontWeight: '600' },
    saveButton: {
      backgroundColor: PALETTE.primary,
      borderRadius: nh(12),
      paddingVertical: nh(14),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: nh(16),
    },
    saveButtonDisabled: { backgroundColor: PALETTE.muted },
    saveButtonText: { color: PALETTE.surface, fontSize: nw(15), fontWeight: 'bold' },
    domainInput: { flexDirection: 'row', marginBottom: nh(12) },
    domainInputField: {
      flex: 1,
      borderWidth: 1,
      borderColor: PALETTE.border,
      borderTopLeftRadius: nh(8),
      borderBottomLeftRadius: nh(8),
      padding: nw(12),
      fontSize: nw(14),
      backgroundColor: PALETTE.surface,
    },
    addButton: {
      backgroundColor: PALETTE.primary,
      paddingHorizontal: nw(16),
      justifyContent: 'center',
      alignItems: 'center',
      borderTopRightRadius: nh(8),
      borderBottomRightRadius: nh(8),
    },
    domainList: { flexDirection: 'row', flexWrap: 'wrap', gap: nw(8), marginTop: nh(8) },
    domainChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: PALETTE.primary,
      borderRadius: nh(16),
      paddingVertical: nh(6),
      paddingHorizontal: nw(12),
      gap: nw(8),
    },
    domainChipText: { color: PALETTE.surface, fontSize: nw(13) },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: nw(20), gap: nh(12) },
    emptyTitle: { fontSize: nw(16), fontWeight: '600', color: PALETTE.text },
    emptySubtitle: { fontSize: nw(13), color: PALETTE.muted, textAlign: 'center' },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: nh(12),
      borderBottomWidth: 1,
      borderBottomColor: PALETTE.border,
    },
    settingInfo: { flex: 1, marginRight: nw(12) },
    settingLabel: { fontSize: nw(14), fontWeight: '500', color: PALETTE.primary, marginBottom: nh(2) },
    settingDescription: { fontSize: nw(12), color: PALETTE.muted },
    roleSelector: { marginBottom: nh(16) },
    permissionsList: { paddingTop: nh(8) },
    permissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: nh(12),
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
    },
    permissionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: nw(12),
    },
    permissionLabel: {
        fontSize: nw(14),
        color: PALETTE.text,
    },
    featuresList: { gap: nh(12) },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PALETTE.surface,
        borderRadius: nh(12),
        padding: nw(12),
        borderWidth: 1,
        borderColor: PALETTE.border,
    },
    featureIcon: {
        width: nw(40),
        height: nw(40),
        borderRadius: nw(20),
        backgroundColor: PALETTE.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: nw(12),
    },
    featureInfo: { flex: 1, marginRight: nw(12) },
    featureLabel: { fontSize: nw(14), fontWeight: '600', color: PALETTE.primary },
    featureDescription: { fontSize: nw(12), color: PALETTE.muted, marginTop: nh(4) },
    dangerSection: {
        marginVertical: nh(16),
        padding: nw(20),
        backgroundColor: PALETTE.danger + '15',
        borderRadius: nh(12),
        borderWidth: 1,
        borderColor: PALETTE.danger + '40',
      },
    dangerTitle: {
        fontSize: nw(18),
        fontWeight: 'bold',
        color: PALETTE.danger,
        marginBottom: nh(8),
    },
    dangerDescription: {
        fontSize: nw(13),
        color: PALETTE.danger,
        marginBottom: nh(20),
        lineHeight: nh(18),
    },
    dangerButton: {
        backgroundColor: PALETTE.danger,
        borderRadius: nh(8),
        paddingVertical: nh(12),
        alignItems: 'center',
    },
    dangerButtonText: {
        fontSize: nw(14),
        fontWeight: '600',
        color: PALETTE.surface,
    },
  });
  
  export default CommunitySettings;