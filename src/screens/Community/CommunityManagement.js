// src/screens/Community/CommunityManagement.js
'use strict';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
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
import PostView from '../Home/Post';

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
  const posts = Array.isArray(root.posts)
    ? root.posts
    : Array.isArray(root.data?.posts)
    ? root.data.posts
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
  if (!payload) return [];
  if (Array.isArray(payload.members)) return payload.members;
  if (Array.isArray(payload.data?.members)) return payload.data.members;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const ManagementHero = ({community, membership, onShare, onPreview, onInvite}) => {
  const cover = community?.coverImage?.url;
  const avatar = community?.avatar?.url;
  const visibility = community?.privacy?.visibility;
  const joinMethod = community?.privacy?.joinMethod;
  const createdAt = community?.createdAt;
  const creator = community?.creator;

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
              {community?.tagline || 'Keep your members engaged, informed, and growing.'}
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

        <View style={styles.heroActionsRow}>
          <TouchableOpacity style={styles.heroActionButton} onPress={onPreview} activeOpacity={0.85}>
            <Icon name="eye" size={nw(16)} color={PALETTE.primary} />
            <Text style={styles.heroActionLabel}>Preview community</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroActionButton} onPress={onShare} activeOpacity={0.85}>
            <Icon name="share-social" size={nw(16)} color={PALETTE.primary} />
            <Text style={styles.heroActionLabel}>Share invite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroActionButton} onPress={onInvite} activeOpacity={0.85}>
            <Icon name="person-add" size={nw(16)} color={PALETTE.primary} />
            <Text style={styles.heroActionLabel}>Invite members</Text>
          </TouchableOpacity>
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

const FeedCard = ({post}) => (
  <View style={styles.feedCard}>
    <PostView item={post} isVideoVisible={false} />
  </View>
);

const MemberRow = ({member}) => {
  const name = member?.user
    ? `${member.user.firstname || ''} ${member.user.lastname || ''}`.trim() || member.user.username
    : member?.name || 'Member';
  const role = member?.role || 'member';
  const avatar = member?.user?.profilePicture;

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

  const fetchCommunityDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCommunityDetailsApi(communityId);
      const data = response?.data || {};
      setCommunity(data.community || null);
      setMembership(data.userMembership || null);
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

  const handleShare = useCallback(() => {
    if (!community) return;
    const shareUrl = community?.slug ? `https://scaleup.app/community/${community.slug}` : undefined;
    Share.share({
      title: community.name,
      message: shareUrl
        ? `Help me grow ${community.name}! Invite link: ${shareUrl}`
        : `Help me grow ${community.name} on ScaleUp.`,
    }).catch(() => {});
  }, [community]);

  const handlePreview = useCallback(() => {
    navigation.navigate(Routes.CommunityDetail, {communityId});
  }, [communityId, navigation]);

  const handleInvite = useCallback(() => {
    if (community?.institutionalInfo?.website) {
      Linking.openURL(community.institutionalInfo.website).catch(() => {});
    } else {
      handleShare();
    }
  }, [community?.institutionalInfo?.website, handleShare]);

  const metrics = useMemo(() => {
    const stats = community?.stats || {};
    return {
      members: formatNumber(stats.memberCount),
      weekly: formatNumber(stats.weeklyActivity),
      engagement: stats.engagementRate ? `${Math.round(stats.engagementRate)}%` : '—',
      growth: stats.monthlyGrowth ? `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth}%` : '—',
    };
  }, [community?.stats]);

  const membersPreview = useMemo(() => members.slice(0, 6), [members]);
  const moderationFeed = useMemo(() => feed.slice(0, 5), [feed]);

  const checklistItems = useMemo(() => {
    if (!community) return [];
    const items = [];
    const hasWelcome = Boolean(community.welcomeMessage);
    const hasGuidelines = Boolean(community.guidelines);
    const hasCover = Boolean(community.coverImage?.url);
    const hasTags = Array.isArray(community.tags) && community.tags.length > 0;

    items.push({ label: 'Set a welcome message', done: hasWelcome, icon: 'chatbubble-ellipses-outline' });
    items.push({ label: 'Share community guidelines', done: hasGuidelines, icon: 'shield-half-outline' });
    items.push({ label: 'Upload a cover image', done: hasCover, icon: 'image-outline' });
    items.push({ label: 'Add community tags', done: hasTags, icon: 'pricetag-outline' });
    return items;
  }, [community]);

  if (loading && !community) {
    return <Skeleton />;
  }

  const managementHeader = (
    <ManagementHero
      community={community}
      membership={membership}
      onShare={handleShare}
      onPreview={handlePreview}
      onInvite={handleInvite}
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
            <InsightCard icon="pulse" value={metrics.weekly} label="Weekly check-ins" />
          </View>
          <View style={styles.insightRow}>
            <InsightCard icon="stats-chart" value={metrics.engagement} label="Engagement rate" />
            <InsightCard icon="trending-up" value={metrics.growth} label="30-day growth" />
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
            onPress={() => navigation.navigate(Routes.CommunitySettings, { communityId })}
          />
          <QuickActionCard
            icon="analytics"
            title="Track engagement"
            subtitle="Check growth and activity trends"
            onPress={() => navigation.navigate(Routes.CommunityDetail, { communityId })}
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
          {hasMoreFeed ? (
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
                <MemberRow key={member.id || member.user?.id || member.user?._id} member={member} />
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
          {checklistItems.map((item) => (
            <View key={item.label} style={styles.checklistRow}>
              <Icon
                name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={nw(18)}
                color={item.done ? PALETTE.primary : PALETTE.subtle}
              />
              <Text style={styles.checklistLabel}>{item.label}</Text>
            </View>
          ))}
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
    marginHorizontal: nw(20),
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
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(18),
    gap: nw(10),
  },
  heroActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nw(6),
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    borderRadius: nw(16),
  },
  heroActionLabel: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
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
  feedCard: {
    marginBottom: nh(14),
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
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
    paddingVertical: nh(8),
  },
  checklistLabel: {
    color: PALETTE.muted,
    fontSize: nw(12),
  },
  notesInput: {
    marginTop: nh(10),
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    padding: nw(14),
    color: PALETTE.subtle,
    minHeight: nh(100),
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
