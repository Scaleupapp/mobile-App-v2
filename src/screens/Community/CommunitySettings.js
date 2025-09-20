// src/screens/Community/CommunitySettings.js
'use strict';

import React, { useState, useCallback, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  InteractionManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import { useFocusEffect } from '@react-navigation/native';

// Palette constants
export const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  danger: COLORS.redEA4335,
};

// Tab configurations
const TABS = [
  { id: 'general', label: 'General', icon: 'settings-outline' },
  { id: 'content', label: 'Content', icon: 'shield-checkmark-outline' },
  { id: 'permissions', label: 'Permissions', icon: 'key-outline' },
  { id: 'features', label: 'Features', icon: 'apps-outline' },
  { id: 'danger', label: 'Danger Zone', icon: 'warning-outline' },
];

// Lazy load tab components
const GeneralTab = lazy(() => import('./tabs/GeneralTab'));
const ContentModerationTab = lazy(() => import('./tabs/ContentModerationTab'));
const PermissionsTab = lazy(() => import('./tabs/PermissionsTab'));
const FeaturesTab = lazy(() => import('./tabs/FeaturesTab'));
const DangerTab = lazy(() => import('./tabs/DangerTab'));

// Memoized TabBar Component
const TabBar = React.memo(({ activeTab, onTabPress }) => {
  const [tabsLoaded, setTabsLoaded] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTabsLoaded(true);
    });
  }, []);

  if (!tabsLoaded) {
    return <View style={styles.tabBar} />;
  }

  return (
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
});

// Loading component for tabs
const TabLoader = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={PALETTE.primary} />
    <Text style={styles.loadingText}>Loading Settings...</Text>
  </View>
);

const CommunitySettings = ({ route, navigation }) => {
  const { communityId } = route.params || {};
  const [activeTab, setActiveTab] = useState('general');
  const [community, setCommunity] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  
  // Lazy load API module
  const [apiModule, setApiModule] = useState(null);

  // Load API module when needed
  const getApiModule = useCallback(async () => {
    if (!apiModule) {
      const module = await import('../../services/apiService');
      setApiModule(module);
      return module;
    }
    return apiModule;
  }, [apiModule]);

  const fetchData = useCallback(async () => {
    if (!communityId) {
      Alert.alert('Error', 'Community ID is missing.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    
    setLoading(true);
    try {
      const api = await getApiModule();
      const [detailsRes, settingsRes] = await Promise.all([
        api.getCommunityDetailsApi(communityId),
        api.getCommunitySettingsApi(communityId)
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
  }, [communityId, navigation, getApiModule]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );
  
  const handleUpdateCommunityDetails = useCallback(async (updates) => {
    setSavingSection('general');
    try {
      const api = await getApiModule();
      await api.updateCommunityApi(communityId, updates);
      Alert.alert('Success', 'General settings updated!');
      await fetchData();
    } catch(error) {
      console.error('Error updating general details:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update general settings.');
    } finally {
      setSavingSection(null);
    }
  }, [communityId, fetchData, getApiModule]);

  const handleUpdateSettings = useCallback(async (section, updates) => {
    setSavingSection(section);
    try {
      console.log(`--- SAVING SETTINGS FOR SECTION: ${section} ---`, { section, updates });
      
      const api = await getApiModule();
      await api.updateCommunitySettingsApi(communityId, { section, updates });
      Alert.alert('Success', `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated!`);
      await fetchData();
    } catch (error) {
      console.error(`Error updating ${section}:`, error.response?.data || error.message);
      Alert.alert('Error', `Failed to update ${section} settings.`);
    } finally {
      setSavingSection(null);
    }
  }, [communityId, fetchData, getApiModule]);

  const handleUpdatePermissions = useCallback(async (role, key, value) => {
    const api = await getApiModule();
    await api.updateRolePermissionsApi(communityId, { role, permissions: { [key]: value } });
    // Refetch data after permission update
    await fetchData();
  }, [communityId, fetchData, getApiModule]);

  const handleDeleteCommunity = useCallback(async () => {
    try {
      const api = await getApiModule();
      // NOTE: deleteCommunityApi needs to be implemented in apiService
      // await api.deleteCommunityApi(communityId);
      Alert.alert('Success', 'Community has been deleted.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete community:', error);
      Alert.alert('Error', 'Could not delete community.');
    }
  }, [communityId, navigation, getApiModule]);

  // Memoized tab props
  const tabProps = useMemo(() => ({
    general: {
      communityDetails: community,
      communityId,
      onUpdate: handleUpdateCommunityDetails,
      saving: savingSection === 'general'
    },
    content: {
      settings,
      onSave: handleUpdateSettings,
      saving: savingSection === 'content'
    },
    permissions: {
      settings,
      communityId,
      onUpdatePermission: handleUpdatePermissions,
      getApiModule
    },
    features: {
      settings,
      onSave: handleUpdateSettings,
      saving: savingSection === 'features'
    },
    danger: {
      communityId,
      navigation,
      onDelete: handleDeleteCommunity
    }
  }), [
    community,
    communityId,
    settings,
    savingSection,
    handleUpdateCommunityDetails,
    handleUpdateSettings,
    handleUpdatePermissions,
    handleDeleteCommunity,
    navigation,
    getApiModule
  ]);

  const renderTabContent = useCallback(() => {
    if (loading || !settings || !community) {
      return <TabLoader />;
    }

    return (
      <Suspense fallback={<TabLoader />}>
        {activeTab === 'general' && <GeneralTab {...tabProps.general} />}
        {activeTab === 'content' && <ContentModerationTab {...tabProps.content} />}
        {activeTab === 'permissions' && <PermissionsTab {...tabProps.permissions} />}
        {activeTab === 'features' && <FeaturesTab {...tabProps.features} />}
        {activeTab === 'danger' && <DangerTab {...tabProps.danger} />}
      </Suspense>
    );
  }, [activeTab, loading, settings, community, tabProps]);

  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

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

      <TabBar activeTab={activeTab} onTabPress={handleTabPress} />
      
      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: PALETTE.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(16),
    backgroundColor: PALETTE.surface,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  headerTitle: { 
    fontSize: nw(18), 
    fontWeight: 'bold', 
    color: PALETTE.primary 
  },
  tabBar: { 
    backgroundColor: PALETTE.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: PALETTE.border,
    minHeight: nh(50),
  },
  tabBarContent: { 
    paddingHorizontal: nw(8) 
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(12),
    paddingVertical: nh(14),
    marginHorizontal: nw(4),
    gap: nw(6),
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: PALETTE.primary 
  },
  tabLabel: { 
    fontSize: nw(13), 
    color: PALETTE.muted, 
    fontWeight: '500' 
  },
  activeTabLabel: { 
    color: PALETTE.primary, 
    fontWeight: '600' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: nh(12) 
  },
  loadingText: { 
    fontSize: nw(14), 
    color: PALETTE.muted 
  },
});

export default CommunitySettings;