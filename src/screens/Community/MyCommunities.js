// src/screens/Community/MyCommunities.js
/**
 * My Communities Screen - Personal Community Dashboard
 * Redesigned with better UX for community management
 * Inspired by Discord Server Management + Reddit Mod Tools
 */

import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Pressable,
  Modal,
  Share,
  Vibration,
  SectionList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  interpolate,
  runOnJS,
  SlideInRight,
  SlideOutRight,
  ZoomIn,
} from 'react-native-reanimated';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getMyCommunitiesApi,
  getMyCommunitySmammarayApi,
  bulkLeaveCommunityApi,
  autoJoinDomainApi,
  leaveCommunityApi,
  updateCommunityNotificationsApi,
  bookmarkCommunityApi,
  removeBookmarkCommunityApi,
} from '../../services/apiService';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import mixpanel from '../../helper/mixpanelClient';
import Routes from '../../helper/routes';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ===============================
// ENHANCED COLOR SYSTEM
// ===============================
const COMMUNITY_COLORS = {
  // Primary theme
  primary: '#FF4500',
  primaryLight: '#FF5700',
  primaryDark: '#C44569',
  
  // Secondary accents
  accent: '#5865F2',
  accentLight: '#7289DA',
  success: '#3BA55C',
  warning: '#FAA61A',
  danger: '#ED4245',
  
  // Dark theme backgrounds
  background: '#0A0A0A',
  backgroundSecondary: '#1A1A1B',
  surface: '#272729',
  surfaceLight: '#2F3136',
  surfaceHover: '#343536',
  elevated: '#2F3136',
  
  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#D7DADC',
  textMuted: '#818384',
  textDim: '#565758',
  
  // Borders
  border: '#343536',
  borderLight: '#474748',
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Role colors
  owner: '#FFD700',
  admin: '#FF4500', 
  moderator: '#5865F2',
  member: '#99AAB5',
  
  // Status indicators
  online: '#3BA55C',
  idle: '#FAA61A',
  dnd: '#ED4245',
  offline: '#747F8D',
};

// ===============================
// UTILITY FUNCTIONS
// ===============================
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const getRelativeTime = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

// ===============================
// REDESIGNED STATS DASHBOARD - COMPACT & CLEAN
// ===============================
const StatsDashboard = ({stats, communities}) => {
  // Calculate real stats from communities data
  const calculatedStats = useMemo(() => {
    if (!communities || communities.length === 0) {
      return {
        total: 0,
        owned: 0,
        moderated: 0,
        active: 0,
      };
    }

    const owned = communities.filter(c => 
      c.isOwner || c.userRole === 'owner' || c.userMembership?.role === 'owner'
    ).length;
    
    const moderated = communities.filter(c => 
      c.isAdmin || c.isModerator || 
      ['admin', 'moderator'].includes(c.userRole) ||
      ['admin', 'moderator'].includes(c.userMembership?.role)
    ).length;
    
    const active = communities.filter(c => 
      c.stats?.unreadPosts > 0 || 
      (c.stats?.lastActivity && new Date() - new Date(c.stats.lastActivity) < 24 * 60 * 60 * 1000)
    ).length;

    return {
      total: communities.length,
      owned,
      moderated,
      active,
    };
  }, [communities]);

  return (
    <Animated.View entering={FadeInDown} style={styles.statsDashboard}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{calculatedStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statWithDot}>
            <View style={[styles.statDot, {backgroundColor: COMMUNITY_COLORS.owner}]} />
            <Text style={styles.statValue}>{calculatedStats.owned}</Text>
          </View>
          <Text style={styles.statLabel}>Owned</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statWithDot}>
            <View style={[styles.statDot, {backgroundColor: COMMUNITY_COLORS.moderator}]} />
            <Text style={styles.statValue}>{calculatedStats.moderated}</Text>
          </View>
          <Text style={styles.statLabel}>Moderated</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statWithDot}>
            <View style={[styles.statDot, {backgroundColor: COMMUNITY_COLORS.online}]} />
            <Text style={styles.statValue}>{calculatedStats.active}</Text>
          </View>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ===============================
// ENHANCED COMMUNITY CARD
// ===============================
const EnhancedCommunityCard = ({community, onPress, index, currentUserId}) => {
  const [bookmarked, setBookmarked] = useState(community.isBookmarked || community.isFavorite || false);
  const scaleAnim = useSharedValue(1);

  // Determine user role
  const getUserRole = () => {
    if (community.isOwner || community.userRole === 'owner' || 
        community.owner === currentUserId || community.createdBy === currentUserId) {
      return 'owner';
    }
    if (community.isAdmin || community.userRole === 'admin') {
      return 'admin';
    }
    if (community.isModerator || community.userRole === 'moderator') {
      return 'moderator';
    }
    return 'member';
  };

  const userRole = getUserRole();
  const roleColor = COMMUNITY_COLORS[userRole];

  const handleBookmark = async (e) => {
    e?.stopPropagation();
    try {
      if (bookmarked) {
        await removeBookmarkCommunityApi(community.id);
      } else {
        await bookmarkCommunityApi(community.id);
      }
      setBookmarked(!bookmarked);
      Vibration.vibrate(10);
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scaleAnim.value}],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.communityCard, animatedStyle]}
    >
      <Pressable
        onPress={() => onPress?.(community)}
        onPressIn={() => {scaleAnim.value = withTiming(0.98, {duration: 100})}}
        onPressOut={() => {scaleAnim.value = withSpring(1)}}
        style={styles.communityCardPressable}
      >
        {/* Left Section - Avatar & Role */}
        <View style={styles.cardLeft}>
          <View style={styles.avatarContainer}>
            {community.coverImage ? (
              <Image source={{uri: community.coverImage}} style={styles.communityAvatar} />
            ) : (
              <LinearGradient
                colors={[roleColor, roleColor + '80']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarText}>
                  {community.name?.charAt(0)?.toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            
            {/* Role Badge */}
            <View style={[styles.roleBadge, {backgroundColor: roleColor}]}>
              <Icon 
                name={
                  userRole === 'owner' ? 'shield' :
                  userRole === 'admin' ? 'shield-checkmark' :
                  userRole === 'moderator' ? 'shield-half' :
                  'person'
                } 
                size={10} 
                color="#FFF" 
              />
            </View>

            {/* Unread Badge */}
            {community.stats?.unreadPosts > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {community.stats.unreadPosts > 99 ? '99+' : community.stats.unreadPosts}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Middle Section - Info */}
        <View style={styles.cardMiddle}>
          <View style={styles.titleRow}>
            <Text style={styles.communityTitle} numberOfLines={1}>
              {community.name}
            </Text>
            {community.isVerified && (
              <MaterialIcons name="verified" size={16} color={COMMUNITY_COLORS.accent} />
            )}
          </View>

          <Text style={styles.communitySubtitle}>
            {formatNumber(community.stats?.memberCount || community.stats?.totalMembers || 0)} members • 
            {formatNumber(community.stats?.postCount || community.stats?.totalPosts || 0)} posts
          </Text>

          <View style={styles.activityRow}>
            <View style={[
              styles.activityIndicator,
              {backgroundColor: community.stats?.lastActivity && 
                new Date() - new Date(community.stats.lastActivity) < 60000 
                ? COMMUNITY_COLORS.online 
                : COMMUNITY_COLORS.offline}
            ]} />
            <Text style={styles.activityText}>
              Last active {getRelativeTime(community.stats?.lastActivity)}
            </Text>
          </View>

          {/* Role Label */}
          <View style={[styles.roleLabel, {backgroundColor: roleColor + '20'}]}>
            <Text style={[styles.roleLabelText, {color: roleColor}]}>
              {userRole.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Right Section - Actions */}
        <View style={styles.cardRight}>
          <TouchableOpacity onPress={handleBookmark} style={styles.actionButton}>
            <Icon 
              name={bookmarked ? "star" : "star-outline"} 
              size={20} 
              color={bookmarked ? COMMUNITY_COLORS.warning : COMMUNITY_COLORS.textMuted} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="chevron-forward" size={20} color={COMMUNITY_COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ===============================
// MAIN COMPONENT - FIXED
// ===============================
const MyCommunities = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const currentUserId = userData?.id || userData?.userId;
  
  // Prevent multiple mounts
  const isInitialized = useRef(false);
  
  console.log('\n🏠 MY COMMUNITIES SCREEN MOUNTED');
  console.log('User ID:', currentUserId);
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [allCommunities, setAllCommunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, owned, moderated, member
  
  // ===============================
  // LIFECYCLE - FIXED
  // ===============================
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    console.log('\n🔄 INITIALIZING MY COMMUNITIES');
    mixpanel.track('My Communities Viewed', {
      user_id: currentUserId,
      timestamp: new Date().toISOString(),
    });
    
    handleInitialDataFetch();
    
    return () => {
      isInitialized.current = false;
    };
  }, []);
  
  // ===============================
  // DATA FETCHING - ENHANCED
  // ===============================
  const handleInitialDataFetch = async () => {
    console.log('\n📊 FETCHING MY COMMUNITIES DATA...');
    setInitialLoading(true);
    
    try {
      const [communitiesResponse, statsResponse] = await Promise.all([
        fetchMyCommunities(),
        fetchMyCommunitiesStats(),
      ]);
      
      console.log('\n✅ DATA FETCH COMPLETE');
    } catch (error) {
      console.error('\n❌ DATA FETCH ERROR:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  const fetchMyCommunities = async () => {
    try {
      const response = await getMyCommunitiesApi({
        page: 1,
        limit: 100,
        includeStats: true,
        includeNotificationSettings: true,
        sortBy: 'lastActivity',
        includeUnreadCounts: true,
      });
      
      if (response?.data?.success) {
        const communities = response.data.data?.communities || [];
        
        // Enhance communities with proper role detection
        const enhancedCommunities = communities.map(community => ({
          ...community,
          // Check if user is owner
          isOwner: community.isOwner || 
                   community.userRole === 'owner' ||
                   community.owner === currentUserId ||
                   community.createdBy === currentUserId ||
                   community.userMembership?.role === 'owner',
          // Check other roles
          isAdmin: community.isAdmin || 
                   community.userRole === 'admin' ||
                   community.userMembership?.role === 'admin',
          isModerator: community.isModerator || 
                       community.userRole === 'moderator' ||
                       community.userMembership?.role === 'moderator',
        }));
        
        console.log(`✅ Fetched ${enhancedCommunities.length} communities`);
        
        // Log role distribution
        const owned = enhancedCommunities.filter(c => c.isOwner).length;
        const moderated = enhancedCommunities.filter(c => c.isAdmin || c.isModerator).length;
        console.log(`📊 Role Distribution: ${owned} owned, ${moderated} moderated`);
        
        setAllCommunities(enhancedCommunities);
        return enhancedCommunities;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Fetch communities error:', error);
      return [];
    }
  };
  
  const fetchMyCommunitiesStats = async () => {
    try {
      const response = await getMyCommunitySmammarayApi();
      
      if (response?.data?.success) {
        const statsData = response.data.data?.summary || response.data.data;
        setStats(statsData);
        return statsData;
      }
    } catch (error) {
      console.error('❌ Fetch stats error:', error);
    }
  };
  
  // ===============================
  // FILTERED COMMUNITIES
  // ===============================
  const filteredCommunities = useMemo(() => {
    let filtered = [...allCommunities];
    
    // Apply tab filter
    switch (activeTab) {
      case 'owned':
        filtered = filtered.filter(c => c.isOwner);
        break;
      case 'moderated':
        filtered = filtered.filter(c => c.isAdmin || c.isModerator);
        break;
      case 'member':
        filtered = filtered.filter(c => !c.isOwner && !c.isAdmin && !c.isModerator);
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort by last activity
    filtered.sort((a, b) => {
      const aTime = new Date(a.stats?.lastActivity || a.joinedAt || 0).getTime();
      const bTime = new Date(b.stats?.lastActivity || b.joinedAt || 0).getTime();
      return bTime - aTime;
    });
    
    return filtered;
  }, [allCommunities, activeTab, searchQuery]);
  
  // ===============================
  // GROUPED COMMUNITIES FOR SECTIONS
  // ===============================
  const groupedCommunities = useMemo(() => {
    if (activeTab !== 'all') {
      return [{
        title: '',
        data: filteredCommunities,
      }];
    }
    
    const owned = allCommunities.filter(c => c.isOwner);
    const moderated = allCommunities.filter(c => (c.isAdmin || c.isModerator) && !c.isOwner);
    const member = allCommunities.filter(c => !c.isOwner && !c.isAdmin && !c.isModerator);
    
    const sections = [];
    
    if (owned.length > 0) {
      sections.push({
        title: 'Communities You Own',
        data: owned,
        type: 'owned',
      });
    }
    
    if (moderated.length > 0) {
      sections.push({
        title: 'Communities You Moderate',
        data: moderated,
        type: 'moderated',
      });
    }
    
    if (member.length > 0) {
      sections.push({
        title: 'Communities You\'re In',
        data: member,
        type: 'member',
      });
    }
    
    return sections;
  }, [allCommunities, activeTab, filteredCommunities]);
  
  // ===============================
  // EVENT HANDLERS
  // ===============================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleInitialDataFetch();
    setRefreshing(false);
  }, []);
  
  const handleCommunityPress = useCallback((community) => {
    console.log(`\n👆 Community Selected: ${community.name}`);
    mixpanel.track('My Community Selected', {
      community_id: community.id,
      community_name: community.name,
      user_role: community.isOwner ? 'owner' : 
                  community.isAdmin ? 'admin' :
                  community.isModerator ? 'moderator' : 'member',
    });
    
    navigation.navigate(Routes.CommunityProfile, {
      communityId: community.id,
      community: community,
      source: 'my_communities',
    });
  }, [navigation]);
  
  // ===============================
  // RENDER FUNCTIONS
  // ===============================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats Dashboard */}
      <StatsDashboard stats={stats} communities={allCommunities} />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={COMMUNITY_COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your communities..."
            placeholderTextColor={COMMUNITY_COLORS.textDim}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color={COMMUNITY_COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          {id: 'all', label: 'All', count: allCommunities.length},
          {id: 'owned', label: 'Owned', count: allCommunities.filter(c => c.isOwner).length},
          {id: 'moderated', label: 'Moderated', count: allCommunities.filter(c => c.isAdmin || c.isModerator).length},
          {id: 'member', label: 'Member', count: allCommunities.filter(c => !c.isOwner && !c.isAdmin && !c.isModerator).length},
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  const renderSectionHeader = ({section}) => {
    if (!section.title) return null;
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  };
  
  const renderCommunity = ({item, index}) => (
    <EnhancedCommunityCard
      community={item}
      onPress={handleCommunityPress}
      index={index}
      currentUserId={currentUserId}
    />
  );
  
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={64} color={COMMUNITY_COLORS.textDim} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No communities found' : 'No communities yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search'
          : activeTab === 'owned' 
            ? 'Create your first community'
            : 'Join or create communities to get started'
        }
      </Text>
      
      {!searchQuery && (
        <View style={styles.emptyActions}>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate(Routes.CommunityDiscovery)}
          >
            <Icon name="compass" size={18} color={COMMUNITY_COLORS.textPrimary} />
            <Text style={styles.emptyButtonText}>Discover</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.emptyButton, styles.createButton]}
            onPress={() => navigation.navigate(Routes.CreateCommunity)}
          >
            <Icon name="add" size={18} color="#FFF" />
            <Text style={[styles.emptyButtonText, {color: '#FFF'}]}>Create</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COMMUNITY_COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COMMUNITY_COLORS.accent} />
          <Text style={styles.loadingText}>Loading your communities...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COMMUNITY_COLORS.background} />
      
      {/* Header */}
      <MainHeader
        title="My Communities"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={COMMUNITY_COLORS.background}
        titleColor={COMMUNITY_COLORS.textPrimary}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate(Routes.CommunityDiscovery)}
            >
              <Icon name="compass-outline" size={22} color={COMMUNITY_COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate(Routes.CreateCommunity)}
            >
              <Icon name="add-circle-outline" size={22} color={COMMUNITY_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* Communities List */}
      <SectionList
        sections={groupedCommunities}
        renderItem={renderCommunity}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COMMUNITY_COLORS.accent}
            colors={[COMMUNITY_COLORS.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
};

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMUNITY_COLORS.background,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textMuted,
  },
  
  // Header
  headerActions: {
    flexDirection: 'row',
    gap: nw(12),
  },
  headerButton: {
    padding: nw(4),
  },
  headerContainer: {
    backgroundColor: COMMUNITY_COLORS.backgroundSecondary,
    paddingBottom: nh(8),
  },
  
  // Simplified Stats Dashboard
  statsDashboard: {
    marginHorizontal: nw(16),
    marginTop: nh(12),
    marginBottom: nh(12),
    backgroundColor: COMMUNITY_COLORS.surface,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: COMMUNITY_COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
  },
  statDot: {
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
  },
  statValue: {
    fontSize: nw(20),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
    marginBottom: nh(4),
  },
  statLabel: {
    fontSize: nw(11),
    color: COMMUNITY_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: nh(32),
    backgroundColor: COMMUNITY_COLORS.border,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMUNITY_COLORS.surface,
    borderRadius: nw(12),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    gap: nw(12),
  },
  searchInput: {
    flex: 1,
    fontSize: nw(15),
    color: COMMUNITY_COLORS.textPrimary,
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: nw(16),
    gap: nw(8),
    paddingBottom: nh(8),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(10),
    paddingHorizontal: nw(12),
    backgroundColor: COMMUNITY_COLORS.surface,
    borderRadius: nw(12),
    gap: nw(6),
  },
  tabButtonActive: {
    backgroundColor: COMMUNITY_COLORS.accent,
  },
  tabText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textMuted,
  },
  tabTextActive: {
    color: COMMUNITY_COLORS.textPrimary,
  },
  tabBadge: {
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: nw(10),
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBadgeText: {
    fontSize: nw(11),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textMuted,
  },
  tabBadgeTextActive: {
    color: COMMUNITY_COLORS.textPrimary,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    backgroundColor: COMMUNITY_COLORS.backgroundSecondary,
  },
  sectionTitle: {
    fontSize: nw(16),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textSecondary,
  },
  sectionCount: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textMuted,
  },
  
  // Community Card
  communityCard: {
    backgroundColor: COMMUNITY_COLORS.surface,
    marginHorizontal: nw(16),
    marginBottom: nh(8),
    borderRadius: nw(12),
    overflow: 'hidden',
  },
  communityCardPressable: {
    flexDirection: 'row',
    padding: nw(16),
  },
  cardLeft: {
    marginRight: nw(12),
  },
  avatarContainer: {
    position: 'relative',
  },
  communityAvatar: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(12),
  },
  avatarPlaceholder: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: nw(24),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -nw(2),
    right: -nw(2),
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COMMUNITY_COLORS.surface,
  },
  unreadBadge: {
    position: 'absolute',
    top: -nw(4),
    right: -nw(4),
    backgroundColor: COMMUNITY_COLORS.danger,
    borderRadius: nw(10),
    minWidth: nw(20),
    height: nw(20),
    paddingHorizontal: nw(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: nw(10),
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    marginBottom: nh(4),
  },
  communityTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textPrimary,
  },
  communitySubtitle: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
    marginBottom: nh(6),
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    marginBottom: nh(6),
  },
  activityIndicator: {
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
  },
  activityText: {
    fontSize: nw(11),
    color: COMMUNITY_COLORS.textDim,
  },
  roleLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: nw(8),
    paddingVertical: nh(2),
    borderRadius: nw(4),
  },
  roleLabelText: {
    fontSize: nw(10),
    fontWeight: 'bold',
  },
  cardRight: {
    justifyContent: 'center',
    gap: nh(8),
  },
  actionButton: {
    padding: nw(4),
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(60),
    paddingHorizontal: nw(32),
  },
  emptyTitle: {
    fontSize: nw(18),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  emptySubtitle: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: nh(24),
  },
  emptyActions: {
    flexDirection: 'row',
    gap: nw(12),
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    paddingHorizontal: nw(20),
    paddingVertical: nh(10),
    backgroundColor: COMMUNITY_COLORS.surface,
    borderRadius: nw(8),
  },
  createButton: {
    backgroundColor: COMMUNITY_COLORS.accent,
  },
  emptyButtonText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textPrimary,
  },
  
  // List
  listContent: {
    paddingBottom: nh(100),
  },
});

export default MyCommunities;