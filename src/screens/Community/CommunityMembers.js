// src/screens/Community/CommunityMembers.js
/**
 * Community Members Screen - Discord Server Members × Reddit Moderators List
 * Complete member management with roles, leaderboard, and bulk operations
 * Production-ready with comprehensive API integration
 * No external tab dependencies - custom implementation
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
  FadeOut,
  Layout,
  interpolate,
  runOnJS,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  BounceIn,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getCommunityMembersApi,
  searchCommunityMembersApi,
  inviteCommunityMembersApi,
  updateMemberRoleApi,
  getCommunityLeaderboardApi,
  bulkMemberOperationsApi,
  exportCommunityMembersApi,
  updateMemberImpactPointsApi,
  getCommunityDetailsApi,
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
import moment from 'moment';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ===============================
// MEMBER COLOR SYSTEM
// ===============================
const MEMBER_COLORS = {
  // Primary Theme
  primary: '#5865F2', // Discord Blurple
  primaryLight: '#7289DA',
  primaryDark: '#4752C4',
  
  accent: '#FF4500', // Reddit Orange
  accentLight: '#FF5700',
  accentDark: '#C44569',
  
  // Role Colors (Discord-inspired)
  owner: '#F47B67', // Owner/Founder
  admin: '#F55767', // Admin
  moderator: '#5865F2', // Moderator
  member: '#3BA55D', // Regular Member
  newMember: '#FAA61A', // New Member
  
  // Status Colors
  online: '#3BA55D',
  idle: '#FAA61A',
  offline: '#747F8D',
  dnd: '#ED4245',
  
  // Background
  background: '#0F0F23',
  surface: '#1A1A2E',
  elevated: '#252538',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B9BBBE',
  textMuted: '#72767D',
  
  // Actions
  promote: '#3BA55D',
  demote: '#FAA61A',
  kick: '#ED4245',
  invite: '#5865F2',
};

// ===============================
// ROLE CONFIGURATIONS
// ===============================
const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    icon: 'crown',
    color: MEMBER_COLORS.owner,
    priority: 1,
  },
  admin: {
    label: 'Admin',
    icon: 'shield-checkmark',
    color: MEMBER_COLORS.admin,
    priority: 2,
  },
  moderator: {
    label: 'Moderator',
    icon: 'shield',
    color: MEMBER_COLORS.moderator,
    priority: 3,
  },
  member: {
    label: 'Member',
    icon: 'person',
    color: MEMBER_COLORS.member,
    priority: 4,
  },
};

// ===============================
// VIEW MODES
// ===============================
const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

// ===============================
// TAB CONFIGURATION
// ===============================
const TABS = {
  MEMBERS: 'members',
  LEADERBOARD: 'leaderboard',
};

// ===============================
// MAIN COMPONENT
// ===============================
const CommunityMembers = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const {communityId} = route.params;
  
  // State Management
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.MEMBERS);
  const [inviteEmails, setInviteEmails] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // User permissions
  const [userRole, setUserRole] = useState('member');
  const canManageRoles = ['owner', 'admin'].includes(userRole);
  const canInvite = ['owner', 'admin', 'moderator'].includes(userRole);
  const canExport = ['owner', 'admin'].includes(userRole);
  
  // Animation Values
  const scrollY = useSharedValue(0);
  const searchBarScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const selectionAnimation = useSharedValue(0);
  const tabIndicatorPosition = useSharedValue(0);
  
  // ===============================
  // API CALLS
  // ===============================
  
  const fetchCommunityDetails = useCallback(async () => {
    try {
      const response = await getCommunityDetailsApi(communityId);
      if (response?.data?.success) {
        setCommunity(response.data.data);
        // Check user's role in this community
        const currentUserMember = response.data.data.members?.find(
          m => m.userId === userData?.id
        );
        if (currentUserMember) {
          setUserRole(currentUserMember.role);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching community:', error);
    }
  }, [communityId, userData]);
  
  const fetchMembers = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      console.log('🔄 Fetching members:', {communityId, page: pageNum});
      
      const params = {
        page: pageNum,
        limit: 20,
        sortBy: 'joinedAt',
        sortOrder: 'desc',
      };
      
      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      
      const response = searchQuery 
        ? await searchCommunityMembersApi(communityId, {
            ...params,
            q: searchQuery,
          })
        : await getCommunityMembersApi(communityId, params);
      
      if (response?.data?.success) {
        const newMembers = response.data.data.members || [];
        
        if (append) {
          setMembers(prev => [...prev, ...newMembers]);
        } else {
          setMembers(newMembers);
        }
        
        setHasMore(newMembers.length === 20);
        setPage(pageNum);
        
        console.log('✅ Members loaded:', newMembers.length);
        
        mixpanel.track('Community_Members_Viewed', {
          communityId,
          memberCount: newMembers.length,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [communityId, selectedRole, searchQuery]);
  
  const fetchLeaderboard = useCallback(async () => {
    try {
      console.log('🔄 Fetching leaderboard:', communityId);
      
      const response = await getCommunityLeaderboardApi(communityId, {
        limit: 50,
        timeframe: '30d',
      });
      
      if (response?.data?.success) {
        setLeaderboard(response.data.data.leaderboard || []);
        console.log('✅ Leaderboard loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
    }
  }, [communityId]);
  
  useEffect(() => {
    fetchCommunityDetails();
    fetchMembers();
    fetchLeaderboard();
  }, []);
  
  useEffect(() => {
    // Re-fetch when filters change
    fetchMembers(1, false);
  }, [selectedRole, searchQuery]);
  
  // ===============================
  // TAB ANIMATION
  // ===============================
  
  useEffect(() => {
    tabIndicatorPosition.value = withSpring(
      activeTab === TABS.MEMBERS ? 0 : SCREEN_WIDTH / 2,
      {damping: 15, stiffness: 150}
    );
  }, [activeTab]);
  
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{translateX: tabIndicatorPosition.value}],
  }));
  
  // ===============================
  // MEMBER ACTIONS
  // ===============================
  
  const handleInviteMembers = useCallback(async () => {
    if (!inviteEmails.trim()) return;
    
    try {
      const emails = inviteEmails.split(',').map(e => e.trim());
      const invites = emails.map(email => ({email}));
      
      const response = await inviteCommunityMembersApi(communityId, {
        invites,
        message: `You've been invited to join ${community?.name}!`,
      });
      
      if (response?.data?.success) {
        Alert.alert('Success', `${emails.length} invitation(s) sent!`);
        setShowInviteModal(false);
        setInviteEmails('');
        
        mixpanel.track('Community_Members_Invited', {
          communityId,
          count: emails.length,
        });
      }
    } catch (error) {
      console.error('❌ Error inviting members:', error);
      Alert.alert('Error', 'Failed to send invitations');
    }
  }, [inviteEmails, communityId, community]);
  
  const handleRoleChange = useCallback(async (memberId, newRole) => {
    try {
      const response = await updateMemberRoleApi(communityId, memberId, {
        role: newRole,
      });
      
      if (response?.data?.success) {
        setMembers(prev => 
          prev.map(m => m.id === memberId ? {...m, role: newRole} : m)
        );
        
        Alert.alert('Success', 'Role updated successfully');
        setShowRoleModal(false);
        setSelectedMember(null);
        
        mixpanel.track('Community_Member_Role_Changed', {
          communityId,
          memberId,
          newRole,
        });
      }
    } catch (error) {
      console.error('❌ Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    }
  }, [communityId]);
  
  const handleBulkAction = useCallback(async (action) => {
    if (selectedMembers.length === 0) return;
    
    try {
      const response = await bulkMemberOperationsApi(communityId, {
        memberIds: selectedMembers,
        operation: action,
      });
      
      if (response?.data?.success) {
        Alert.alert('Success', `${action} completed for ${selectedMembers.length} members`);
        setSelectedMembers([]);
        setIsSelectionMode(false);
        fetchMembers();
        
        mixpanel.track('Community_Bulk_Action', {
          communityId,
          action,
          count: selectedMembers.length,
        });
      }
    } catch (error) {
      console.error('❌ Error performing bulk action:', error);
      Alert.alert('Error', `Failed to ${action} members`);
    }
  }, [selectedMembers, communityId]);
  
  const handleExportMembers = useCallback(async () => {
    try {
      const response = await exportCommunityMembersApi(communityId, {
        format: 'csv',
        includeStats: true,
      });
      
      if (response?.data) {
        // Handle file download
        Alert.alert('Success', 'Member list exported successfully');
        
        mixpanel.track('Community_Members_Exported', {
          communityId,
        });
      }
    } catch (error) {
      console.error('❌ Error exporting members:', error);
      Alert.alert('Error', 'Failed to export members');
    }
  }, [communityId]);
  
  const toggleMemberSelection = useCallback((memberId) => {
    Vibration.vibrate(10);
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  }, []);
  
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMembers(page + 1, true);
    }
  }, [loadingMore, hasMore, page]);
  
  // ===============================
  // ANIMATED STYLES
  // ===============================
  
  const animatedSearchStyle = useAnimatedStyle(() => ({
    transform: [{scale: searchBarScale.value}],
  }));
  
  const animatedSelectionBarStyle = useAnimatedStyle(() => ({
    transform: [{translateY: interpolate(
      selectionAnimation.value,
      [0, 1],
      [100, 0],
      'clamp'
    )}],
    opacity: selectionAnimation.value,
  }));
  
  // ===============================
  // RENDER FUNCTIONS
  // ===============================
  
  const renderMemberGrid = ({item}) => {
    const roleConfig = ROLE_CONFIG[item.role] || ROLE_CONFIG.member;
    const isSelected = selectedMembers.includes(item.id);
    
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.random() * 200)}
        style={styles.gridItem}
      >
        <TouchableOpacity
          style={[
            styles.memberCard,
            isSelected && styles.memberCardSelected,
          ]}
          onPress={() => {
            if (isSelectionMode) {
              toggleMemberSelection(item.id);
            } else {
              navigation.navigate(Routes.MemberProfile, {
                memberId: item.id,
                communityId,
              });
            }
          }}
          onLongPress={() => {
            if (canManageRoles) {
              setIsSelectionMode(true);
              toggleMemberSelection(item.id);
              selectionAnimation.value = withSpring(1);
            }
          }}
        >
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <View style={styles.selectionCheckbox}>
              <Icon 
                name={isSelected ? "checkbox" : "square-outline"} 
                size={20} 
                color={isSelected ? MEMBER_COLORS.primary : MEMBER_COLORS.textMuted}
              />
            </View>
          )}
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{uri: item.avatar || 'https://via.placeholder.com/80'}}
              style={styles.memberAvatar}
            />
            {/* Online Status */}
            <View style={[styles.statusDot, {
              backgroundColor: item.isOnline ? MEMBER_COLORS.online : MEMBER_COLORS.offline
            }]} />
          </View>
          
          {/* Member Info */}
          <Text style={styles.memberName} numberOfLines={1}>
            {item.username}
          </Text>
          
          {/* Role Badge */}
          <View style={[styles.roleBadge, {backgroundColor: roleConfig.color + '20'}]}>
            <Icon name={roleConfig.icon} size={12} color={roleConfig.color} />
            <Text style={[styles.roleText, {color: roleConfig.color}]}>
              {roleConfig.label}
            </Text>
          </View>
          
          {/* Impact Points */}
          <View style={styles.impactContainer}>
            <Icon name="trending-up" size={14} color={MEMBER_COLORS.accent} />
            <Text style={styles.impactPoints}>{item.impactPoints || 0}</Text>
          </View>
          
          {/* Quick Actions */}
          {canManageRoles && !isSelectionMode && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                setSelectedMember(item);
                setShowRoleModal(true);
              }}
            >
              <Icon name="ellipsis-vertical" size={16} color={MEMBER_COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderMemberList = ({item}) => {
    const roleConfig = ROLE_CONFIG[item.role] || ROLE_CONFIG.member;
    const isSelected = selectedMembers.includes(item.id);
    
    return (
      <Animated.View
        entering={SlideInRight.delay(Math.random() * 200)}
      >
        <TouchableOpacity
          style={[
            styles.listItem,
            isSelected && styles.listItemSelected,
          ]}
          onPress={() => {
            if (isSelectionMode) {
              toggleMemberSelection(item.id);
            } else {
              navigation.navigate(Routes.MemberProfile, {
                memberId: item.id,
                communityId,
              });
            }
          }}
          onLongPress={() => {
            if (canManageRoles) {
              setIsSelectionMode(true);
              toggleMemberSelection(item.id);
              selectionAnimation.value = withSpring(1);
            }
          }}
        >
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <Icon 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={20} 
              color={isSelected ? MEMBER_COLORS.primary : MEMBER_COLORS.textMuted}
              style={styles.listCheckbox}
            />
          )}
          
          {/* Avatar */}
          <View style={styles.listAvatarContainer}>
            <Image
              source={{uri: item.avatar || 'https://via.placeholder.com/50'}}
              style={styles.listAvatar}
            />
            <View style={[styles.listStatusDot, {
              backgroundColor: item.isOnline ? MEMBER_COLORS.online : MEMBER_COLORS.offline
            }]} />
          </View>
          
          {/* Member Info */}
          <View style={styles.listInfo}>
            <View style={styles.listNameRow}>
              <Text style={styles.listName}>{item.username}</Text>
              <View style={[styles.listRoleBadge, {backgroundColor: roleConfig.color + '20'}]}>
                <Text style={[styles.listRoleText, {color: roleConfig.color}]}>
                  {roleConfig.label}
                </Text>
              </View>
            </View>
            <Text style={styles.listMeta}>
              Joined {moment(item.joinedAt).fromNow()} • {item.impactPoints || 0} points
            </Text>
          </View>
          
          {/* Actions */}
          {canManageRoles && !isSelectionMode && (
            <TouchableOpacity
              style={styles.listMoreButton}
              onPress={() => {
                setSelectedMember(item);
                setShowRoleModal(true);
              }}
            >
              <Icon name="ellipsis-vertical" size={20} color={MEMBER_COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderLeaderboardItem = ({item, index}) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
    
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50)}
        style={[
          styles.leaderboardItem,
          index < 3 && styles.leaderboardTopItem,
        ]}
      >
        <View style={styles.leaderboardRank}>
          {medal ? (
            <Text style={styles.medalEmoji}>{medal}</Text>
          ) : (
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          )}
        </View>
        
        <Image
          source={{uri: item.avatar || 'https://via.placeholder.com/50'}}
          style={styles.leaderboardAvatar}
        />
        
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>{item.username}</Text>
          <View style={styles.leaderboardStats}>
            <Text style={styles.leaderboardPoints}>
              {item.impactPoints} points
            </Text>
            <Text style={styles.leaderboardContributions}>
              {item.contributions} contributions
            </Text>
          </View>
        </View>
        
        {index < 3 && (
          <LinearGradient
            colors={[MEMBER_COLORS.accent + '20', 'transparent']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.leaderboardGlow}
          />
        )}
      </Animated.View>
    );
  };
  
  // Custom Tab Bar
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setActiveTab(TABS.MEMBERS)}
      >
        <Text style={[
          styles.tabLabel,
          activeTab === TABS.MEMBERS && styles.tabLabelActive
        ]}>
          Members
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setActiveTab(TABS.LEADERBOARD)}
      >
        <Text style={[
          styles.tabLabel,
          activeTab === TABS.LEADERBOARD && styles.tabLabelActive
        ]}>
          Leaderboard
        </Text>
      </TouchableOpacity>
      
      <Animated.View style={[styles.tabIndicator, animatedIndicatorStyle]} />
    </View>
  );
  
  // Members Tab Content
  const renderMembersTab = () => (
    <View style={styles.tabContent}>
      {/* Search & Filter Bar */}
      <Animated.View style={[styles.searchFilterBar, animatedSearchStyle]}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={MEMBER_COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor={MEMBER_COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {['all', 'owner', 'admin', 'moderator', 'member'].map(role => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterChip,
                selectedRole === role && styles.filterChipActive,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[
                styles.filterChipText,
                selectedRole === role && styles.filterChipTextActive,
              ]}>
                {role === 'all' ? 'All' : ROLE_CONFIG[role]?.label || role}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* View Mode Toggle */}
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === VIEW_MODES.GRID && styles.viewModeButtonActive]}
          onPress={() => setViewMode(VIEW_MODES.GRID)}
        >
          <Icon 
            name="grid" 
            size={18} 
            color={viewMode === VIEW_MODES.GRID ? MEMBER_COLORS.primary : MEMBER_COLORS.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === VIEW_MODES.LIST && styles.viewModeButtonActive]}
          onPress={() => setViewMode(VIEW_MODES.LIST)}
        >
          <Icon 
            name="list" 
            size={18} 
            color={viewMode === VIEW_MODES.LIST ? MEMBER_COLORS.primary : MEMBER_COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
      
      {/* Members List/Grid */}
      <FlatList
        data={members}
        renderItem={viewMode === VIEW_MODES.GRID ? renderMemberGrid : renderMemberList}
        keyExtractor={item => item.id}
        numColumns={viewMode === VIEW_MODES.GRID ? 3 : 1}
        key={viewMode} // Force re-render when switching views
        contentContainerStyle={[
          styles.membersList,
          viewMode === VIEW_MODES.GRID && styles.membersGrid,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMembers(1, false);
            }}
            tintColor={MEMBER_COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loadingMore && (
          <ActivityIndicator size="small" color={MEMBER_COLORS.primary} style={styles.loadingMore} />
        )}
        ListEmptyComponent={() => !loading && (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color={MEMBER_COLORS.textMuted} />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        )}
      />
    </View>
  );
  
  // Leaderboard Tab Content
  const renderLeaderboardTab = () => (
    <View style={styles.tabContent}>
      {/* Leaderboard Header */}
      <View style={styles.leaderboardHeader}>
        <LinearGradient
          colors={[MEMBER_COLORS.accent, MEMBER_COLORS.accentDark]}
          style={styles.leaderboardBanner}
        >
          <Icon name="trophy" size={32} color="#FFF" />
          <Text style={styles.leaderboardTitle}>Top Contributors</Text>
          <Text style={styles.leaderboardSubtitle}>Last 30 Days</Text>
        </LinearGradient>
      </View>
      
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.leaderboardList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLeaderboard();
              setRefreshing(false);
            }}
            tintColor={MEMBER_COLORS.primary}
          />
        }
        ListEmptyComponent={() => !loading && (
          <View style={styles.emptyState}>
            <Icon name="trophy-outline" size={64} color={MEMBER_COLORS.textMuted} />
            <Text style={styles.emptyText}>No leaderboard data yet</Text>
          </View>
        )}
      />
    </View>
  );
  
  // Modals
  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowInviteModal(false)}
      >
        <Animated.View 
          entering={FadeInUp}
          style={styles.inviteModalContent}
        >
          <Text style={styles.modalTitle}>Invite Members</Text>
          <Text style={styles.modalSubtitle}>
            Enter email addresses separated by commas
          </Text>
          
          <TextInput
            style={styles.inviteInput}
            placeholder="email1@example.com, email2@example.com"
            placeholderTextColor={MEMBER_COLORS.textMuted}
            value={inviteEmails}
            onChangeText={setInviteEmails}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleInviteMembers}
            >
              <LinearGradient
                colors={[MEMBER_COLORS.primary, MEMBER_COLORS.primaryDark]}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalConfirmText}>Send Invites</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
  
  const renderRoleModal = () => (
    <Modal
      visible={showRoleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRoleModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowRoleModal(false)}
      >
        <Animated.View 
          entering={FadeInUp}
          style={styles.roleModalContent}
        >
          <Text style={styles.modalTitle}>Change Role</Text>
          <Text style={styles.modalSubtitle}>
            {selectedMember?.username}
          </Text>
          
          <View style={styles.roleOptions}>
            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.roleOption,
                  selectedMember?.role === key && styles.roleOptionActive,
                ]}
                onPress={() => handleRoleChange(selectedMember?.id, key)}
                disabled={key === 'owner'} // Can't change owner
              >
                <Icon 
                  name={config.icon} 
                  size={20} 
                  color={selectedMember?.role === key ? config.color : MEMBER_COLORS.textMuted}
                />
                <Text style={[
                  styles.roleOptionText,
                  selectedMember?.role === key && {color: config.color}
                ]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Additional Actions */}
          <View style={styles.additionalActions}>
            <TouchableOpacity
              style={styles.dangerAction}
              onPress={() => {
                Alert.alert(
                  'Remove Member',
                  `Are you sure you want to remove ${selectedMember?.username}?`,
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => handleBulkAction('remove'),
                    },
                  ]
                );
              }}
            >
              <Icon name="remove-circle" size={20} color={MEMBER_COLORS.kick} />
              <Text style={[styles.dangerActionText, {color: MEMBER_COLORS.kick}]}>
                Remove from Community
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
  
  // ===============================
  // LOADING & ERROR STATES
  // ===============================
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={MEMBER_COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MEMBER_COLORS.primary} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // ===============================
  // MAIN RENDER
  // ===============================
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MEMBER_COLORS.background} />
      
      {/* Header */}
      <MainHeader
        title={`${community?.name || 'Community'} Members`}
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={MEMBER_COLORS.background}
        titleColor={MEMBER_COLORS.textPrimary}
        rightComponent={
          <View style={styles.headerActions}>
            {canExport && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleExportMembers}
              >
                <Icon name="download-outline" size={22} color={MEMBER_COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            {canInvite && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowInviteModal(true)}
              >
                <Icon name="person-add" size={22} color={MEMBER_COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      {/* Custom Tab Bar */}
      {renderTabBar()}
      
      {/* Tab Content */}
      {activeTab === TABS.MEMBERS ? renderMembersTab() : renderLeaderboardTab()}
      
      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <Animated.View style={[styles.selectionBar, animatedSelectionBarStyle]}>
          <TouchableOpacity
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedMembers([]);
              selectionAnimation.value = withSpring(0);
            }}
          >
            <Text style={styles.selectionCancel}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.selectionCount}>
            {selectedMembers.length} selected
          </Text>
          
          <View style={styles.selectionActions}>
            {canManageRoles && (
              <>
                <TouchableOpacity
                  style={styles.selectionAction}
                  onPress={() => setShowBulkActions(true)}
                >
                  <Icon name="settings" size={20} color={MEMBER_COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionAction}
                  onPress={() => handleBulkAction('message')}
                >
                  <Icon name="mail" size={20} color={MEMBER_COLORS.textPrimary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      )}
      
      {/* Modals */}
      {renderInviteModal()}
      {renderRoleModal()}
    </SafeAreaView>
  );
};

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MEMBER_COLORS.background,
  },
  
  // Header
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: nw(15),
  },
  
  // Custom Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: MEMBER_COLORS.surface,
    height: nh(48),
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: nw(14),
    fontWeight: '600',
    color: MEMBER_COLORS.textMuted,
  },
  tabLabelActive: {
    color: MEMBER_COLORS.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH / 2,
    height: 3,
    backgroundColor: MEMBER_COLORS.primary,
  },
  tabContent: {
    flex: 1,
    backgroundColor: MEMBER_COLORS.background,
  },
  
  // Search & Filter
  searchFilterBar: {
    paddingHorizontal: nw(15),
    paddingVertical: nh(10),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEMBER_COLORS.surface,
    borderRadius: nw(12),
    paddingHorizontal: nw(15),
    marginBottom: nh(10),
  },
  searchInput: {
    flex: 1,
    height: nh(40),
    fontSize: nw(14),
    color: MEMBER_COLORS.textPrimary,
    marginLeft: nw(10),
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: nw(15),
    paddingVertical: nh(6),
    borderRadius: nw(15),
    backgroundColor: MEMBER_COLORS.surface,
    marginRight: nw(8),
  },
  filterChipActive: {
    backgroundColor: MEMBER_COLORS.primary,
  },
  filterChipText: {
    fontSize: nw(12),
    color: MEMBER_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  
  // View Mode Toggle
  viewModeToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: nw(15),
    paddingBottom: nh(10),
  },
  viewModeButton: {
    padding: nw(8),
    borderRadius: nw(8),
    backgroundColor: MEMBER_COLORS.surface,
    marginLeft: nw(8),
  },
  viewModeButtonActive: {
    backgroundColor: MEMBER_COLORS.primary + '20',
  },
  
  // Members List/Grid
  membersList: {
    paddingHorizontal: nw(15),
    paddingBottom: nh(100),
  },
  membersGrid: {
    paddingHorizontal: nw(10),
  },
  
  // Grid View
  gridItem: {
    flex: 1,
    padding: nw(5),
  },
  memberCard: {
    backgroundColor: MEMBER_COLORS.surface,
    borderRadius: nw(12),
    padding: nw(12),
    alignItems: 'center',
    position: 'relative',
  },
  memberCardSelected: {
    borderWidth: 2,
    borderColor: MEMBER_COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: nh(8),
  },
  memberAvatar: {
    width: nw(60),
    height: nw(60),
    borderRadius: nw(30),
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: nw(16),
    height: nw(16),
    borderRadius: nw(8),
    borderWidth: 2,
    borderColor: MEMBER_COLORS.surface,
  },
  memberName: {
    fontSize: nw(13),
    fontWeight: '600',
    color: MEMBER_COLORS.textPrimary,
    marginBottom: nh(4),
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(3),
    borderRadius: nw(10),
    marginBottom: nh(6),
  },
  roleText: {
    fontSize: nw(10),
    fontWeight: '600',
    marginLeft: nw(3),
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactPoints: {
    fontSize: nw(11),
    color: MEMBER_COLORS.accent,
    marginLeft: nw(3),
    fontWeight: '600',
  },
  moreButton: {
    position: 'absolute',
    top: nw(8),
    right: nw(8),
    padding: nw(4),
  },
  selectionCheckbox: {
    position: 'absolute',
    top: nw(8),
    left: nw(8),
    zIndex: 1,
  },
  
  // List View
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEMBER_COLORS.surface,
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(8),
  },
  listItemSelected: {
    borderWidth: 2,
    borderColor: MEMBER_COLORS.primary,
  },
  listCheckbox: {
    marginRight: nw(12),
  },
  listAvatarContainer: {
    position: 'relative',
    marginRight: nw(12),
  },
  listAvatar: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
  },
  listStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: nw(14),
    height: nw(14),
    borderRadius: nw(7),
    borderWidth: 2,
    borderColor: MEMBER_COLORS.surface,
  },
  listInfo: {
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(4),
  },
  listName: {
    fontSize: nw(15),
    fontWeight: '600',
    color: MEMBER_COLORS.textPrimary,
    marginRight: nw(8),
  },
  listRoleBadge: {
    paddingHorizontal: nw(8),
    paddingVertical: nh(2),
    borderRadius: nw(8),
  },
  listRoleText: {
    fontSize: nw(10),
    fontWeight: '600',
  },
  listMeta: {
    fontSize: nw(12),
    color: MEMBER_COLORS.textMuted,
  },
  listMoreButton: {
    padding: nw(8),
  },
  
  // Leaderboard
  leaderboardHeader: {
    paddingHorizontal: nw(15),
    paddingVertical: nh(15),
  },
  leaderboardBanner: {
    borderRadius: nw(12),
    padding: nw(20),
    alignItems: 'center',
  },
  leaderboardTitle: {
    fontSize: nw(20),
    fontWeight: '700',
    color: '#FFF',
    marginTop: nh(8),
  },
  leaderboardSubtitle: {
    fontSize: nw(14),
    color: '#FFF',
    opacity: 0.8,
    marginTop: nh(4),
  },
  leaderboardList: {
    paddingHorizontal: nw(15),
    paddingBottom: nh(100),
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEMBER_COLORS.surface,
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(8),
    position: 'relative',
    overflow: 'hidden',
  },
  leaderboardTopItem: {
    borderWidth: 1,
    borderColor: MEMBER_COLORS.accent + '40',
  },
  leaderboardGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
  },
  leaderboardRank: {
    width: nw(40),
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: nw(24),
  },
  rankNumber: {
    fontSize: nw(16),
    fontWeight: '700',
    color: MEMBER_COLORS.textSecondary,
  },
  leaderboardAvatar: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    marginHorizontal: nw(12),
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: nw(15),
    fontWeight: '600',
    color: MEMBER_COLORS.textPrimary,
    marginBottom: nh(4),
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardPoints: {
    fontSize: nw(13),
    color: MEMBER_COLORS.accent,
    fontWeight: '600',
    marginRight: nw(10),
  },
  leaderboardContributions: {
    fontSize: nw(12),
    color: MEMBER_COLORS.textMuted,
  },
  
  // Selection Bar
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MEMBER_COLORS.surface,
    paddingHorizontal: nw(15),
    paddingVertical: nh(12),
    borderTopWidth: 1,
    borderTopColor: MEMBER_COLORS.elevated,
  },
  selectionCancel: {
    fontSize: nw(14),
    color: MEMBER_COLORS.primary,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: nw(14),
    color: MEMBER_COLORS.textSecondary,
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionAction: {
    marginLeft: nw(15),
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: MEMBER_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  inviteModalContent: {
    backgroundColor: MEMBER_COLORS.surface,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    padding: nw(20),
    paddingBottom: nh(Platform.OS === 'ios' ? 40 : 20),
  },
  roleModalContent: {
    backgroundColor: MEMBER_COLORS.surface,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    padding: nw(20),
    paddingBottom: nh(Platform.OS === 'ios' ? 40 : 20),
  },
  modalTitle: {
    fontSize: nw(18),
    fontWeight: '700',
    color: MEMBER_COLORS.textPrimary,
    marginBottom: nh(8),
  },
  modalSubtitle: {
    fontSize: nw(14),
    color: MEMBER_COLORS.textSecondary,
    marginBottom: nh(20),
  },
  inviteInput: {
    backgroundColor: MEMBER_COLORS.elevated,
    borderRadius: nw(12),
    padding: nw(15),
    fontSize: nw(14),
    color: MEMBER_COLORS.textPrimary,
    minHeight: nh(80),
    marginBottom: nh(20),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: nw(10),
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: nw(14),
    color: MEMBER_COLORS.textSecondary,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    marginLeft: nw(10),
    borderRadius: nw(8),
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: nw(14),
    color: '#FFF',
    fontWeight: '600',
  },
  roleOptions: {
    marginBottom: nh(20),
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(15),
    borderRadius: nw(8),
    marginBottom: nh(8),
    backgroundColor: MEMBER_COLORS.elevated,
  },
  roleOptionActive: {
    backgroundColor: MEMBER_COLORS.primary + '20',
  },
  roleOptionText: {
    fontSize: nw(14),
    color: MEMBER_COLORS.textPrimary,
    marginLeft: nw(12),
    fontWeight: '500',
  },
  additionalActions: {
    borderTopWidth: 1,
    borderTopColor: MEMBER_COLORS.elevated,
    paddingTop: nh(15),
  },
  dangerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
  },
  dangerActionText: {
    fontSize: nw(14),
    fontWeight: '500',
    marginLeft: nw(10),
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(60),
  },
  emptyText: {
    fontSize: nw(14),
    color: MEMBER_COLORS.textMuted,
    marginTop: nh(12),
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: nw(14),
    color: MEMBER_COLORS.textSecondary,
    marginTop: nh(12),
  },
  loadingMore: {
    paddingVertical: nh(20),
  },
});

export default CommunityMembers;