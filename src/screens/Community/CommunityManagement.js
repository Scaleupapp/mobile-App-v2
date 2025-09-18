// src/screens/Community/CommunityManagement.js
'use strict';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import {
  getCommunityDetailsApi,
  getCommunityMembersApi,
  getCommunityFeedApi,
} from '../../services/apiService';
import { throttle } from '../../helper/commonFunctions';
import Routes from '../../helper/routes';

const FEED_PAGE_SIZE = 10;

const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!num) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return `${num}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const parseFeedResponse = (response, page) => {
  const root = response?.data ?? {};
  
  // Try multiple possible locations for posts
  const posts = Array.isArray(root.posts)
    ? root.posts
    : Array.isArray(root.data?.posts)
    ? root.data.posts
    : Array.isArray(root.feed)
    ? root.feed
    : Array.isArray(root.data?.feed)
    ? root.data.feed
    : Array.isArray(root.content)
    ? root.content
    : [];

  const pagination = root?.pagination || root?.data?.pagination || {};
  const hasMoreExplicit =
    pagination?.hasMore ?? pagination?.has_more ?? pagination?.hasNext ?? pagination?.has_next;
  const fallbackHasMore = posts.length >= FEED_PAGE_SIZE;
  const hasMore = typeof hasMoreExplicit === 'boolean' ? hasMoreExplicit : fallbackHasMore;
  const nextPage = hasMore ? page + 1 : page;

  return {posts, hasMore, nextPage};
};

const extractMembers = (payload) => {
  let members = [];
  if (!payload) {
    members = [];
  } else if (Array.isArray(payload.members)) {
    members = payload.members;
  } else if (Array.isArray(payload.data?.members)) {
    members = payload.data.members;
  } else if (Array.isArray(payload.data)) {
    members = payload.data;
  } else if (Array.isArray(payload)) {
    members = payload;
  }

  return members;
};

const getNestedValue = (obj, path) => {
  if (!obj) {
    return undefined;
  }

  return path.split('.').reduce((acc, segment) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    return acc[segment];
  }, obj);
};

const ManagementHero = ({community, membership}) => {
  const cover = community?.coverImage?.url || community?.coverImage;
  const avatar = community?.avatar?.url || community?.avatar;
  const visibility = community?.privacy?.visibility || community?.privacy;
  const joinMethod = community?.privacy?.joinMethod || community?.joinMethod;
  const createdAt = community?.createdAt;
  const creator = community?.createdBy || community?.owner;

  return (
    <View style={styles.heroWrapper}>
      <LinearGradient colors={[PALETTE.primary + 'E6', PALETTE.primary + 'AA']} style={styles.heroGradient}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroAvatarShell}>
            {avatar ? (
              <Image source={{uri: avatar}} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroAvatarInitial}>{community?.name?.[0] || '?'}</Text>
              </View>
            )}
          </View>
          <View style={styles.heroHeaderText}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {community?.name || 'Community'}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {community?.tagline || community?.description || 'Keep your members engaged, informed, and growing.'}
            </Text>
            <View style={styles.heroChipsRow}>
              {visibility ? (
                <View style={styles.heroChip}>
                  <Icon name={visibility === 'public' ? 'earth' : 'lock-closed'} size={nw(12)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.heroChipText}>{visibility}</Text>
                </View>
              ) : null}
              {joinMethod ? (
                <View style={styles.heroChip}>
                  <Icon name="people" size={nw(12)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.heroChipText}>
                    {joinMethod === 'approval'
                      ? 'Approvals on'
                      : joinMethod === 'invite_only'
                      ? 'Invite only'
                      : 'Instant join'}
                  </Text>
                </View>
              ) : null}
              {community?.verificationStatus === 'verified' ? (
                <View style={styles.heroChip}>
                  <Icon name="shield-checkmark" size={nw(12)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.heroChipText}>Verified</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Created</Text>
            <Text style={styles.heroMetaValue}>{formatDate(createdAt)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Owner</Text>
            <Text style={styles.heroMetaValue} numberOfLines={1}>
              {creator ? `${creator.firstname || ''} ${creator.lastname || ''}`.trim() || creator.username : '—'}
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Role</Text>
            <Text style={styles.heroMetaValue}>{membership?.role || 'member'}</Text>
          </View>
        </View>

      </LinearGradient>

      {cover ? <Image source={{uri: cover}} style={styles.heroCoverImage} /> : null}
    </View>
  );
};

const InsightCard = ({icon, value, label, trend}) => (
  <View style={styles.insightCard}>
    <View style={styles.insightIconWrap}>
      <Icon name={icon} size={nw(18)} color={PALETTE.primary} />
    </View>
    <View style={styles.insightTextBlock}>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightLabel}>{label}</Text>
      {trend ? <Text style={styles.insightTrend}>{trend}</Text> : null}
    </View>
  </View>
);

const QuickActionCard = ({icon, title, subtitle, onPress}) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.quickActionIcon}>
      <Icon name={icon} size={nw(20)} color={PALETTE.primary} />
    </View>
    <View style={styles.quickActionText}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
    <Icon name="chevron-forward" size={nw(18)} color={PALETTE.subtle} />
  </TouchableOpacity>
);

// Custom FeedCard component without PostView dependency
const FeedCard = ({post}) => {
  if (!post) return null;

  // Extract safe text from potentially encrypted content
  const extractText = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data.text) return data.text;
    if (data.content) return data.content;
    return '';
  };

  const postId = post?.id || post?._id;
  const postType = post?.postType || 'text';
  const authorName = post?.author?.username || 
                    post?.author?.name || 
                    `${post?.author?.firstname || ''} ${post?.author?.lastname || ''}`.trim() ||
                    'Anonymous';
  const authorAvatar = post?.author?.profilePicture || post?.author?.avatar;
  const postTitle = extractText(post?.title);
  const postContent = extractText(post?.content);
  const truncatedContent = postContent.length > 150 
    ? postContent.substring(0, 150) + '...' 
    : postContent;
  
  const metrics = post?.metrics || {};
  const upvotes = metrics.upvotes || 0;
  const downvotes = metrics.downvotes || 0;
  const comments = metrics.comments || 0;
  const shares = metrics.shares || 0;
  
  const createdAt = post?.publishedAt || post?.createdAt;
  const formattedDate = formatDate(createdAt);

  // Type-specific content
  const renderTypeSpecificContent = () => {
    switch (postType) {
      case 'poll':
        const pollQuestion = extractText(post?.poll?.question || post?.preview?.pollQuestion || postTitle);
        const options = post?.poll?.options || post?.preview?.pollOptions || [];
        return (
          <View style={styles.feedCardPoll}>
            <Text style={styles.feedCardPollLabel}>📊 Poll</Text>
            <Text style={styles.feedCardPollQuestion}>{pollQuestion}</Text>
            <Text style={styles.feedCardPollOptions}>{options.length} options</Text>
          </View>
        );
      
      case 'event':
        const eventTitle = extractText(post?.event?.title || post?.preview?.eventTitle || postTitle);
        const eventDate = post?.event?.startDate || post?.preview?.eventDate;
        const eventVenue = post?.event?.location?.venue || post?.preview?.eventLocation?.venue;
        return (
          <View style={styles.feedCardEvent}>
            <Text style={styles.feedCardEventLabel}>📅 Event</Text>
            <Text style={styles.feedCardEventTitle}>{eventTitle}</Text>
            {eventDate && <Text style={styles.feedCardEventDate}>{formatDate(eventDate)}</Text>}
            {eventVenue && <Text style={styles.feedCardEventVenue}>📍 {eventVenue}</Text>}
          </View>
        );
      
      case 'announcement':
        return (
          <View style={styles.feedCardAnnouncement}>
            <Text style={styles.feedCardAnnouncementLabel}>📢 Announcement</Text>
            {postTitle && <Text style={styles.feedCardTitle}>{postTitle}</Text>}
            {truncatedContent && <Text style={styles.feedCardContent}>{truncatedContent}</Text>}
          </View>
        );
      
      default:
        return (
          <>
            {postTitle && <Text style={styles.feedCardTitle}>{postTitle}</Text>}
            {truncatedContent && <Text style={styles.feedCardContent}>{truncatedContent}</Text>}
          </>
        );
    }
  };

  return (
    <View style={styles.feedCardContainer}>
      <View style={styles.feedCardHeader}>
        <View style={styles.feedCardAuthorInfo}>
          {authorAvatar ? (
            <Image source={{uri: authorAvatar}} style={styles.feedCardAvatar} />
          ) : (
            <View style={styles.feedCardAvatarFallback}>
              <Text style={styles.feedCardAvatarText}>{authorName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.feedCardAuthor}>{authorName}</Text>
            <Text style={styles.feedCardDate}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.feedCardTypeBadge}>
          <Text style={styles.feedCardType}>{postType}</Text>
        </View>
      </View>
      
      <View style={styles.feedCardBody}>
        {renderTypeSpecificContent()}
      </View>
      
      <View style={styles.feedCardStats}>
        <Text style={styles.feedCardStat}>👍 {upvotes}</Text>
        <Text style={styles.feedCardStat}>👎 {downvotes}</Text>
        <Text style={styles.feedCardStat}>💬 {comments}</Text>
        <Text style={styles.feedCardStat}>📤 {shares}</Text>
      </View>
    </View>
  );
};

const MemberRow = ({member}) => {
  const name = member?.user
    ? `${member.user.firstname || ''} ${member.user.lastname || ''}`.trim() || member.user.username
    : member?.name || 'Member';
  const role = member?.role || 'member';
  const avatar = member?.user?.profilePicture || member?.user?.avatar;

  return (
    <View style={styles.memberRow}>
      {avatar ? (
        <Image source={{uri: avatar}} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberAvatarFallback}>
          <Text style={styles.memberAvatarText}>{name?.[0] || '?'}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        <Text style={styles.memberRoleText}>{role}</Text>
      </View>
    </View>
  );
};

const EmptyState = ({title, subtitle}) => (
  <View style={styles.emptyState}>
    <Icon name="compass-outline" size={nw(36)} color={PALETTE.subtle} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const Skeleton = () => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
    <View style={styles.heroSkeleton}>
      <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
    </View>
    <View style={styles.sectionCard}>
      <View style={[styles.skeletonLine, {width: '40%', marginBottom: nh(12)}]} />
      <View style={[styles.skeletonLine, {width: '90%', marginBottom: nh(8)}]} />
      <View style={[styles.skeletonLine, {width: '75%'}]} />
    </View>
    <View style={styles.sectionCard}>
      <View style={[styles.skeletonLine, {width: '30%', marginBottom: nh(12)}]} />
      <View style={[styles.skeletonLine, {width: '100%', marginBottom: nh(8)}]} />
      <View style={[styles.skeletonLine, {width: '95%'}]} />
    </View>
  </SafeAreaView>
);

const CommunityManagement = ({route, navigation}) => {
  const {communityId} = route.params;

  const [community, setCommunity] = useState(null);
  const [membership, setMembership] = useState(null);
  const [feed, setFeed] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [engagementModalVisible, setEngagementModalVisible] = useState(false);

  const fetchCommunityDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCommunityDetailsApi(communityId);
      
      // FIX: Access the nested data structure correctly
      const responseData = response?.data?.data || {};
      
      setCommunity(responseData.community || null);
      setMembership(responseData.userMembership || null);
    } catch (error) {
      console.log('Community management detail error', error?.response?.data || error?.message);
      Alert.alert('Error', 'Unable to load community details right now.');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const fetchFeed = useCallback(
    async ({pageParam = 1, replace = false} = {}) => {
      if (replace) setFeedLoading(true);
      else setLoadingMore(true);

      try {
        const response = await getCommunityFeedApi(communityId, {page: pageParam, limit: FEED_PAGE_SIZE});
        const {posts, hasMore, nextPage} = parseFeedResponse(response, pageParam);
        
        setFeed((prev) => (replace ? posts : [...prev, ...posts]));
        setHasMoreFeed(hasMore);
        setFeedPage(nextPage);
      } catch (error) {
        console.log('Community management feed error', error?.response?.data || error?.message);
      } finally {
        if (replace) {
          setFeedLoading(false);
          setRefreshing(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [communityId],
  );

  const fetchMembers = useCallback(async () => {
    if (membersLoading || members.length) return;
    setMembersLoading(true);
    try {
      const response = await getCommunityMembersApi(communityId);
      setMembers(extractMembers(response?.data));
    } catch (error) {
      console.log('Community management members error', error?.response?.data || error?.message);
    } finally {
      setMembersLoading(false);
    }
  }, [communityId, members.length, membersLoading]);

  useEffect(() => {
    fetchCommunityDetails().then(() => {
      fetchFeed({pageParam: 1, replace: true});
      fetchMembers();
    });
  }, [fetchCommunityDetails, fetchFeed, fetchMembers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMoreFeed(true);
    fetchCommunityDetails().then(() => {
      fetchFeed({pageParam: 1, replace: true});
      fetchMembers();
    });
  }, [fetchCommunityDetails, fetchFeed, fetchMembers]);

  const handleLoadMore = useCallback(
    throttle(() => {
      if (hasMoreFeed && !feedLoading && !loadingMore) {
        fetchFeed({pageParam: feedPage, replace: false});
      }
    }, 900),
    [fetchFeed, feedLoading, feedPage, hasMoreFeed, loadingMore],
  );

  const handleTrackEngagement = useCallback(() => {
    setEngagementModalVisible(true);
  }, []);

  const handleCloseEngagement = useCallback(() => {
    setEngagementModalVisible(false);
  }, []);

  const metrics = useMemo(() => {
    const stats = community?.stats || {};
    return {
      members: formatNumber(stats.memberCount || stats.totalMembers),
      weekly: formatNumber(stats.weeklyActivity || stats.activeWeeklyUsers || stats.activeThisWeek),
      engagement: stats.engagementRate ? `${Math.round(stats.engagementRate)}%` : '—',
      growth: stats.monthlyGrowth || stats.memberGrowthRate || '—',
    };
  }, [community?.stats]);

  const feedBreakdown = useMemo(() => {
    return feed.reduce(
      (acc, item) => {
        const type = (item?.postType || '').toLowerCase();

        if (type === 'poll') {
          acc.polls += 1;
        } else if (type === 'event') {
          acc.events += 1;
        } else {
          acc.posts += 1;
        }

        return acc;
      },
      {posts: 0, polls: 0, events: 0},
    );
  }, [feed]);

  const resolveStatValue = useCallback(
    (paths, fallback) => {
      const stats = community?.stats;
      if (!stats) {
        return fallback;
      }

      for (const path of paths) {
        const value = getNestedValue(stats, path);
        if (value !== undefined && value !== null) {
          return value;
        }
      }

      return fallback;
    },
    [community?.stats],
  );

  const engagementStats = useMemo(() => {
    const membersValue = resolveStatValue(
      ['memberCount', 'totalMembers', 'members.total'],
      members.length,
    );
    const postsValue = resolveStatValue(
      ['postCount', 'posts.total', 'posts.count', 'totalPosts'],
      feedBreakdown.posts,
    );
    const pollsValue = resolveStatValue(
      ['pollCount', 'polls.total', 'polls.count', 'posts.poll', 'contentBreakdown.polls'],
      feedBreakdown.polls,
    );
    const eventsValue = resolveStatValue(
      ['eventCount', 'events.total', 'events.count', 'posts.event', 'contentBreakdown.events'],
      feedBreakdown.events,
    );
    const weeklyFallback =
      community?.stats?.weeklyActivity ||
      community?.stats?.activeWeeklyUsers ||
      community?.stats?.activeThisWeek ||
      0;
    const weeklyValue = resolveStatValue(
      ['weeklyActivity', 'activeWeeklyUsers', 'activeThisWeek'],
      weeklyFallback,
    );

    return [
      {
        key: 'members',
        label: 'Members',
        value: formatNumber(membersValue),
      },
      {
        key: 'posts',
        label: 'Posts',
        value: formatNumber(postsValue),
      },
      {
        key: 'polls',
        label: 'Polls',
        value: formatNumber(pollsValue),
      },
      {
        key: 'events',
        label: 'Events',
        value: formatNumber(eventsValue),
      },
      {
        key: 'weekly',
        label: 'Active this week',
        value: formatNumber(weeklyValue),
      },
    ];
  }, [resolveStatValue, feedBreakdown, members.length, community?.stats]);

  const membersPreview = useMemo(() => members.slice(0, 6), [members]);
  const moderationFeed = useMemo(() => feed.slice(0, 5), [feed]);

  if (loading && !community) {
    return <Skeleton />;
  }

  const managementHeader = (
    <ManagementHero
      community={community}
      membership={membership}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PALETTE.primary}
          />
        }>
        {managementHeader}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key health metrics</Text>
          <View style={styles.insightRow}>
            <InsightCard icon="people" value={metrics.members} label="Total members" />
            <InsightCard icon="pulse" value={metrics.weekly} label="Weekly activity" />
          </View>
          <View style={styles.insightRow}>
            <InsightCard icon="stats-chart" value={metrics.engagement} label="Engagement rate" />
            <InsightCard icon="trending-up" value={metrics.growth} label="Growth rate" />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <QuickActionCard
            icon="paper-plane"
            title="Share announcement"
            subtitle="Create a post to reach everyone"
            onPress={() =>
              navigation.navigate(Routes.CreateCommunityPost, {
                communityId,
                communityName: community?.name,
              })
            }
          />
          <QuickActionCard
            icon="settings"
            title="Review settings"
            subtitle="Update privacy, features, or branding"
            onPress={() =>
              navigation.navigate(Routes.CommunitySettings, {
                communityId,
                communityName: community?.name,
              })
            }
          />
          <QuickActionCard
            icon="analytics"
            title="Track engagement"
            subtitle="Check growth and activity trends"
            onPress={handleTrackEngagement}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Moderate recent posts</Text>
          {feedLoading && !feed.length ? (
            <ActivityIndicator color={PALETTE.primary} style={{marginTop: nh(12)}} />
          ) : moderationFeed.length ? (
            moderationFeed.map((post) => <FeedCard key={post.id || post._id} post={post} />)
          ) : (
            <EmptyState title="No posts yet" subtitle="Once members post, you can moderate from here." />
          )}
          {hasMoreFeed && feed.length > 0 ? (
            <TouchableOpacity style={styles.moreButton} onPress={handleLoadMore}>
              <Text style={styles.moreButtonText}>Load more posts</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Membership snapshot</Text>
          {membersLoading && !members.length ? (
            <ActivityIndicator color={PALETTE.primary} style={{marginTop: nh(12)}} />
          ) : membersPreview.length ? (
            <View style={styles.membersGrid}>
              {membersPreview.map((member) => (
                <MemberRow key={member.id || member.user?.id || member.user?._id || member._id} member={member} />
              ))}
            </View>
          ) : (
            <EmptyState title="No members yet" subtitle="Invite a few peers to get things started." />
          )}
          {members.length > membersPreview.length ? (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => navigation.navigate(Routes.CommunityDetail, { communityId })}
            >
              <Text style={styles.moreButtonText}>View all members</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Setup checklist</Text>
          <View style={styles.comingSoonContainer}>
            <Icon name="time-outline" size={nw(18)} color={PALETTE.subtle} />
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </View>
          <Text style={styles.comingSoonSubtext}>
            We'll surface guided setup tasks here to help you launch faster.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Community notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            editable={false}
            placeholder="Keep notes for your mod team (coming soon)."
            placeholderTextColor={PALETTE.subtle}
          />
        </View>
      </ScrollView>

      <Modal
        visible={engagementModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEngagement}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseEngagement} />
          <View style={styles.engagementCard}>
            <Text style={styles.engagementTitle}>Engagement snapshot</Text>
            <View style={styles.engagementStatsList}>
              {engagementStats.map((stat) => (
                <View key={stat.key} style={styles.engagementStatRow}>
                  <Text style={styles.engagementStatLabel}>{stat.label}</Text>
                  <Text style={styles.engagementStatValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseEngagement}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scrollContent: {
    paddingBottom: nh(32),
  },
  heroWrapper: {
    marginHorizontal: nw(16),
    marginTop: nh(18),
    borderRadius: nw(28),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0D1E2F',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  heroGradient: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(22),
    backgroundColor: PALETTE.primary,
  },
  heroCoverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarShell: {
    width: nw(64),
    height: nw(64),
    borderRadius: nw(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: nw(20),
  },
  heroAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: nw(20),
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarInitial: {
    color: PALETTE.primary,
    fontSize: nw(24),
    fontWeight: '700',
  },
  heroHeaderText: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(22),
    fontWeight: '700',
    marginBottom: nh(6),
  },
  heroSubtitle: {
    color: COLORS.whiteFFFFFF + 'CC',
    fontSize: nw(12),
    lineHeight: nh(18),
  },
  heroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
    marginTop: nh(12),
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: nw(14),
  },
  heroChipText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(11),
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(20),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: nw(18),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
  },
  heroMetaItem: {
    flex: 1,
  },
  heroMetaLabel: {
    color: COLORS.whiteFFFFFF + 'AA',
    fontSize: nw(11),
  },
  heroMetaValue: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(13),
    fontWeight: '600',
    marginTop: nh(2),
  },
  heroDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.whiteFFFFFF + '22',
    marginHorizontal: nw(12),
  },
  sectionCard: {
    marginHorizontal: nw(20),
    marginTop: nh(18),
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(16),
  },
  sectionTitle: {
    color: PALETTE.primary,
    fontSize: nw(14),
    fontWeight: '700',
    marginBottom: nh(12),
  },
  insightRow: {
    flexDirection: 'row',
    gap: nw(12),
    marginBottom: nh(12),
  },
  insightCard: {
    flex: 1,
    backgroundColor: PALETTE.background,
    borderRadius: nw(16),
    paddingHorizontal: nw(14),
    paddingVertical: nh(14),
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: nh(6),
  },
  insightIconWrap: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTextBlock: {},
  insightValue: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  insightLabel: {
    color: PALETTE.muted,
    fontSize: nw(11),
  },
  insightTrend: {
    color: PALETTE.accent,
    fontSize: nw(11),
    marginTop: nh(4),
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
    paddingVertical: nh(14),
    borderBottomWidth: 1,
    borderColor: PALETTE.border,
  },
  quickActionIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    backgroundColor: PALETTE.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  quickActionSubtitle: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(4),
  },
  
  // FeedCard Styles
  feedCardContainer: {
    backgroundColor: PALETTE.background,
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(10),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(10),
  },
  feedCardAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feedCardAvatar: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    marginRight: nw(8),
  },
  feedCardAvatarFallback: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: PALETTE.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
  },
  feedCardAvatarText: {
    color: PALETTE.primary,
    fontSize: nw(14),
    fontWeight: '600',
  },
  feedCardAuthor: {
    fontSize: nw(13),
    color: PALETTE.primary,
    fontWeight: '600',
  },
  feedCardDate: {
    fontSize: nw(11),
    color: PALETTE.subtle,
    marginTop: nh(2),
  },
  feedCardTypeBadge: {
    backgroundColor: PALETTE.primary + '10',
    paddingHorizontal: nw(8),
    paddingVertical: nh(3),
    borderRadius: nw(8),
  },
  feedCardType: {
    fontSize: nw(10),
    color: PALETTE.primary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  feedCardBody: {
    marginBottom: nh(10),
  },
  feedCardTitle: {
    fontSize: nw(14),
    fontWeight: '600',
    color: PALETTE.primary,
    marginBottom: nh(6),
  },
  feedCardContent: {
    fontSize: nw(12),
    color: PALETTE.muted,
    lineHeight: nh(18),
  },
  feedCardStats: {
    flexDirection: 'row',
    gap: nw(16),
    paddingTop: nh(8),
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  feedCardStat: {
    fontSize: nw(11),
    color: PALETTE.subtle,
  },
  
  // Poll specific styles
  feedCardPoll: {
    backgroundColor: PALETTE.primary + '08',
    padding: nw(10),
    borderRadius: nw(8),
  },
  feedCardPollLabel: {
    fontSize: nw(11),
    color: PALETTE.primary,
    fontWeight: '600',
    marginBottom: nh(4),
  },
  feedCardPollQuestion: {
    fontSize: nw(13),
    color: PALETTE.primary,
    fontWeight: '500',
    marginBottom: nh(4),
  },
  feedCardPollOptions: {
    fontSize: nw(11),
    color: PALETTE.muted,
  },
  
  // Event specific styles
  feedCardEvent: {
    backgroundColor: PALETTE.accent + '15',
    padding: nw(10),
    borderRadius: nw(8),
  },
  feedCardEventLabel: {
    fontSize: nw(11),
    color: PALETTE.primary,
    fontWeight: '600',
    marginBottom: nh(4),
  },
  feedCardEventTitle: {
    fontSize: nw(13),
    color: PALETTE.primary,
    fontWeight: '500',
    marginBottom: nh(4),
  },
  feedCardEventDate: {
    fontSize: nw(11),
    color: PALETTE.muted,
  },
  feedCardEventVenue: {
    fontSize: nw(11),
    color: PALETTE.muted,
    marginTop: nh(2),
  },
  
  // Announcement specific styles
  feedCardAnnouncement: {
    backgroundColor: PALETTE.accent + '10',
    padding: nw(10),
    borderRadius: nw(8),
  },
  feedCardAnnouncementLabel: {
    fontSize: nw(11),
    color: PALETTE.accent,
    fontWeight: '700',
    marginBottom: nh(6),
  },
  
  moreButton: {
    marginTop: nh(10),
    alignSelf: 'flex-start',
    paddingHorizontal: nw(14),
    paddingVertical: nh(8),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary + '12',
  },
  moreButtonText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  membersGrid: {
    gap: nh(12),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    marginRight: nw(12),
  },
  memberAvatarFallback: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    backgroundColor: PALETTE.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  memberAvatarText: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  memberRoleText: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(2),
  },
  comingSoonContainer: {
    marginTop: nh(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  comingSoonText: {
    color: PALETTE.muted,
    fontSize: nw(13),
    fontWeight: '600',
  },
  comingSoonSubtext: {
    marginTop: nh(6),
    color: PALETTE.subtle,
    fontSize: nw(12),
    lineHeight: nh(18),
  },
  notesInput: {
    marginTop: nh(10),
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    padding: nw(14),
    color: PALETTE.subtle,
    minHeight: nh(100),
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(20),
  },
  engagementCard: {
    width: '100%',
    maxWidth: nw(320),
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  engagementTitle: {
    fontSize: nw(16),
    fontWeight: '700',
    color: PALETTE.primary,
    marginBottom: nh(12),
    textAlign: 'center',
  },
  engagementStatsList: {
    gap: nh(10),
  },
  engagementStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(4),
  },
  engagementStatLabel: {
    fontSize: nw(13),
    color: PALETTE.muted,
  },
  engagementStatValue: {
    fontSize: nw(14),
    fontWeight: '600',
    color: PALETTE.primary,
  },
  modalCloseButton: {
    marginTop: nh(18),
    alignSelf: 'center',
    paddingHorizontal: nw(20),
    paddingVertical: nh(10),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary,
  },
  modalCloseText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(40),
    paddingHorizontal: nw(18),
  },
  emptyTitle: {
    color: PALETTE.primary,
    fontSize: nw(15),
    fontWeight: '700',
    marginTop: nh(12),
  },
  emptySubtitle: {
    color: PALETTE.muted,
    fontSize: nw(12),
    textAlign: 'center',
    marginTop: nh(6),
    lineHeight: nh(18),
  },
  heroSkeleton: {
    marginHorizontal: nw(20),
    marginTop: nh(18),
    borderRadius: nw(28),
    paddingVertical: nh(60),
    backgroundColor: PALETTE.primary + '0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonLine: {
    height: nh(14),
    backgroundColor: PALETTE.border,
    borderRadius: nw(10),
  },
});

export default CommunityManagement;
