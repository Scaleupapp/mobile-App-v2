// src/screens/Community/CommunityDiscovery.js
'use strict';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import axiosInstance from '../../services/axiosinstance';
import Routes from '../../helper/routes';

// Consistent Color Palette
const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  success: '#2E7D32',
  warning: '#FFA000',
  danger: COLORS.redEA4335,
};

// Helper Function
const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!num) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${num}`;
};

// Enhanced Tab Bar Component
const TabBar = ({activeTab, onTabChange, counts}) => {
  const tabs = [
    {id: 'discover', label: 'Discover', icon: 'compass-outline'},
    {id: 'joined', label: 'My Hubs', icon: 'people-outline'},
    {id: 'pending', label: 'Requests', icon: 'time-outline'},
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabChange(tab.id)}>
            <Icon 
              name={isActive ? tab.icon.replace('-outline', '') : tab.icon} 
              size={nw(18)} 
              color={isActive ? PALETTE.primary : PALETTE.muted}
            />
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
            {counts[tab.id] > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{counts[tab.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Enhanced & "Better" Community Card Component
const CommunityCard = ({item, onPress, onAction, actionType}) => {
  const userRole = item?.userRole || item?.membership?.role || '';
  
  const getActionButton = () => {
    switch(actionType) {
      case 'joined':
        return {
          text: userRole.charAt(0).toUpperCase() + userRole.slice(1),
          style: styles.roleButton,
          textStyle: styles.roleButtonText,
          action: () => onPress(item),
        };
      case 'pending':
        return {
          text: 'Cancel',
          style: styles.cancelButton,
          textStyle: styles.actionButtonText,
          action: () => onAction(item, 'cancel'),
        };
      case 'discover':
      default:
        const requiresApproval = item.joinMethod === 'approval_required' || item.privacy === 'private';
        return {
          text: requiresApproval ? 'Request' : 'Join',
          style: styles.joinButton,
          textStyle: styles.actionButtonText,
          action: () => onAction(item, requiresApproval ? 'request' : 'join'),
        };
    }
  };

  const button = getActionButton();
  const avatarUri = item.avatar?.url || item.avatar;
  const memberCount = item.stats?.memberCount || item.stats?.totalMembers || item.memberCount || 0;
  const privacy = item.privacy?.charAt(0).toUpperCase() + item.privacy?.slice(1) || 'Public';

  return (
    <TouchableOpacity style={styles.communityCard} onPress={() => onPress(item)} activeOpacity={0.95}>
      {avatarUri ? (
        <Image source={{uri: avatarUri}} style={styles.cardAvatar} />
      ) : (
        <View style={[styles.cardAvatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarPlaceholderText}>
            {item.name?.[0]?.toUpperCase() || 'C'}
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          {item.isVerified && (
            <Icon name="shield-checkmark" size={nw(14)} color={PALETTE.accent} />
          )}
        </View>
        <Text style={styles.cardDescription} numberOfLines={1}>
          {item.description || `${privacy} • ${formatNumber(memberCount)} members`}
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Icon name="people-outline" size={nw(12)} color={PALETTE.muted} />
            <Text style={styles.statText}>{formatNumber(memberCount)}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="newspaper-outline" size={nw(12)} color={PALETTE.muted} />
            <Text style={styles.statText}>{formatNumber(item.stats?.postCount || 0)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={[styles.actionButton, button.style]} onPress={button.action}>
        <Text style={button.textStyle}>{button.text}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Main Component
export default function CommunityDiscovery({navigation}) {
  const [activeTab, setActiveTab] = useState('discover');
  const [allCommunities, setAllCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [pendingCommunities, setPendingCommunities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => ['All', 'Academic', 'Tech', 'Creative', 'Business', 'Social'], []);

  const fetchAllCommunities = async () => {
    try {
      const response = await axiosInstance.get('communities', { params: { myCommunitiesOnly: false } });
      if (response?.data?.success) {
        setAllCommunities(response.data.data.communities || []);
      }
    } catch (error) {
      console.error('Failed to fetch all communities:', error);
    }
  };

  const fetchJoinedCommunities = async () => {
    try {
      const response = await axiosInstance.get('communities/my-communities/list');
      if (response?.data?.success) {
        setJoinedCommunities(response.data.data.communities || []);
      }
    } catch (error) {
      console.error('Failed to fetch joined communities:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axiosInstance.get('communities/my-requests/pending');
      if (response?.data?.success) {
        setPendingCommunities(response.data.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      setPendingCommunities([]);
    }
  };

  const handleCommunityAction = async (community, action) => {
    const communityId = community.id || community._id;
    try {
      if (action === 'join' || action === 'request') {
        const response = await axiosInstance.post(`communities/${communityId}/join`);
        if (response?.data?.success) {
          Alert.alert('Success', action === 'request' ? 'Join request sent!' : `Joined ${community.name}!`);
          loadData(true);
        }
      } else if (action === 'cancel') {
        await axiosInstance.delete(`communities/${communityId}/cancel-request`);
        Alert.alert('Success', 'Request cancelled');
        loadData(true);
      }
    } catch (error) {
      console.error(`Action '${action}' failed for community ${communityId}:`, error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    }
  };

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);
    await Promise.all([
      fetchAllCommunities(),
      fetchJoinedCommunities(),
      fetchPendingRequests(),
    ]);
    if (!isRefresh) setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const discoverList = useMemo(() => {
    const joinedIds = new Set(joinedCommunities.map(c => c.id || c._id));
    const pendingIds = new Set(pendingCommunities.map(c => c.id || c._id));
    return allCommunities.filter(c => !joinedIds.has(c.id || c._id) && !pendingIds.has(c.id || c._id));
  }, [allCommunities, joinedCommunities, pendingCommunities]);
  
  const filteredLists = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filterFn = c => {
      const nameMatch = c.name?.toLowerCase().includes(query);
      const categoryMatch = selectedCategory === 'All' || (c.category?.toLowerCase() === selectedCategory.toLowerCase());
      return nameMatch && (activeTab !== 'discover' || categoryMatch);
    };

    return {
      discover: discoverList.filter(filterFn),
      joined: joinedCommunities.filter(filterFn),
      pending: pendingCommunities.filter(filterFn),
    };
  }, [searchQuery, selectedCategory, activeTab, discoverList, joinedCommunities, pendingCommunities]);
  
  const counts = {
    discover: discoverList.length,
    joined: joinedCommunities.length,
    pending: pendingCommunities.length,
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.searchBar}>
        <Icon name="search-outline" size={nw(20)} color={PALETTE.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for community hubs..."
          placeholderTextColor={PALETTE.subtle}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={nw(18)} color={PALETTE.subtle} />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'discover' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroller}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryPill, selectedCategory === cat && styles.activeCategoryPill]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderCommunity = ({item}) => (
    <CommunityCard
      item={item}
      onPress={(community) => navigation.navigate(Routes.CommunityDetail, { communityId: community.id || community._id })}
      onAction={handleCommunityAction}
      actionType={activeTab}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="compass-outline" size={nw(50)} color={PALETTE.subtle} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'joined' ? "You're Not in a Hub Yet" : 
         activeTab === 'pending' ? 'No Pending Requests' : 
         searchQuery ? 'No Results Found' : 'Nothing to Discover'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'joined' ? "Join a community hub to start connecting." : 
         activeTab === 'pending' ? 'Your approved requests will show up in "My Hubs".' : 
         searchQuery ? 'Try a different search term.' : 'We couldn’t find any communities to show.'}
      </Text>
      {activeTab !== 'discover' && (
        <TouchableOpacity style={styles.emptyButton} onPress={() => setActiveTab('discover')}>
          <Text style={styles.emptyButtonText}>Discover Hubs</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentList = filteredLists[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Hubs</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate(Routes.CreateCommunity)}>
          <Icon name="add-circle-outline" size={nw(28)} color={PALETTE.primary} />
        </TouchableOpacity>
      </View>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      <FlatList
        data={currentList}
        keyExtractor={item => item.id || item._id}
        renderItem={renderCommunity}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[PALETTE.primary]}
            tintColor={PALETTE.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

// Enhanced Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    backgroundColor: PALETTE.surface,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  headerTitle: { fontSize: nw(22), fontWeight: 'bold', color: PALETTE.primary },
  createButton: { padding: nw(4) },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PALETTE.surface,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    gap: nw(6),
    position: 'relative',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: PALETTE.primary },
  tabText: { fontSize: nw(13), color: PALETTE.muted, fontWeight: '500' },
  activeTabText: { color: PALETTE.primary, fontWeight: '600' },
  tabBadge: {
    backgroundColor: PALETTE.danger,
    borderRadius: nw(10),
    minWidth: nw(18),
    height: nw(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(5),
    marginLeft: nw(4),
  },
  tabBadgeText: { color: PALETTE.surface, fontSize: nw(10), fontWeight: 'bold' },
  listHeader: { paddingTop: nh(16) },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderRadius: nw(12),
    marginHorizontal: nw(16),
    marginBottom: nh(16),
    paddingHorizontal: nw(12),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  searchInput: {
    flex: 1,
    height: nh(44),
    marginLeft: nw(8),
    fontSize: nw(14),
    color: PALETTE.text,
  },
  categoryScroller: {
    paddingHorizontal: nw(16),
    paddingBottom: nh(16),
  },
  categoryPill: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(8),
    borderRadius: nw(18),
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginRight: nw(8),
  },
  activeCategoryPill: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  categoryText: {
    fontSize: nw(13),
    fontWeight: '500',
    color: PALETTE.primary,
  },
  activeCategoryText: {
    color: PALETTE.surface,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: nw(16),
    marginBottom: nh(12),
    padding: nw(12),
    backgroundColor: PALETTE.surface,
    borderRadius: nw(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardAvatar: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(12),
    marginRight: nw(12),
  },
  avatarPlaceholder: {
    backgroundColor: PALETTE.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: nw(20),
    fontWeight: 'bold',
    color: PALETTE.primary,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
  },
  cardTitle: {
    fontSize: nw(15),
    fontWeight: '600',
    color: PALETTE.primary,
  },
  cardDescription: {
    fontSize: nw(12),
    color: PALETTE.muted,
    marginTop: nh(2),
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
    marginTop: nh(6),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  statText: {
    fontSize: nw(11),
    color: PALETTE.muted,
  },
  actionButton: {
    paddingHorizontal: nw(14),
    paddingVertical: nh(8),
    borderRadius: nw(18),
    marginLeft: nw(10),
  },
  actionButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: PALETTE.success,
  },
  requestButton: {
    backgroundColor: PALETTE.accent,
  },
  cancelButton: {
    backgroundColor: PALETTE.danger,
  },
  roleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  roleButtonText: {
    color: PALETTE.muted,
    fontSize: nw(12),
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(60),
    paddingHorizontal: nw(40),
  },
  emptyTitle: {
    fontSize: nw(18),
    fontWeight: '600',
    color: PALETTE.text,
    marginTop: nh(16),
  },
  emptySubtitle: {
    fontSize: nw(14),
    color: PALETTE.muted,
    textAlign: 'center',
    marginTop: nh(8),
    lineHeight: nh(22),
  },
  emptyButton: {
    marginTop: nh(20),
    backgroundColor: PALETTE.primary,
    paddingHorizontal: nw(24),
    paddingVertical: nh(12),
    borderRadius: nw(24),
  },
  emptyButtonText: {
    color: PALETTE.surface,
    fontSize: nw(14),
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: nh(20),
    minHeight: '100%',
  },
});