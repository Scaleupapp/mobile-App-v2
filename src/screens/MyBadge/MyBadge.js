import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import {useSelector} from 'react-redux';
import {getProfiledetails} from '../../services/apiService';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import {COLORS} from '../../helper/colors';
import Header from '../../components/Header';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {APP_FONTS} from '../../assets/fonts';
import Routes from '../../helper/routes';
import mixpanel from '../../helper/mixpanelClient';

/**
 * Milestone array stays the same
 */
const milestones = [
  {minRating: 0, maxRating: 10, badge: 'Novice', next: 'Explorer'},
  {minRating: 10, maxRating: 150, badge: 'Explorer', next: 'Creator'},
  {minRating: 150, maxRating: 300, badge: 'Creator', next: 'Specialist'},
  {minRating: 300, maxRating: 600, badge: 'Specialist', next: 'Influencer'},
  {
    minRating: 600,
    maxRating: 1000,
    badge: 'Influencer',
    next: 'Subject Matter Expert',
  },
  {
    minRating: 1000,
    maxRating: Infinity,
    badge: 'Subject Matter Expert',
    next: null,
  },
];

const motivationalMessages = {
  Novice: 'You’ve just begun! Keep exploring to level up!',
  Explorer: 'Great work! Create more to achieve your next badge.',
  Creator: 'Impressive! Aim for the Specialist badge!',
  Specialist: 'You’re making waves! Influencer badge is within reach.',
  Influencer: 'You’re a leader! Almost an expert!',
  'Subject Matter Expert': 'You’ve reached the pinnacle of expertise. Kudos!',
};

const MyBadge = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRating: 0,
    currentMilestone: milestones[0],
  });

  const {totalRating, currentMilestone} = data;

  // Animated value for the circular progress ring
  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getProfileDetail();
  }, []);

  useEffect(() => {
    // Animate ring once data is loaded
    if (!loading) {
      Animated.timing(animationValue, {
        toValue: getProgressPercentage(),
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [loading, currentMilestone, totalRating]);

  const getProfileDetail = async () => {
    try {
      const {data: profileData} = await getProfiledetails(userData?.id, 1);
      const rating = profileData?.totalRating ?? 0;

      // If the user is SME, directly set them to the last milestone
      const myMilestone =
        profileData?.role === 'SME'
          ? milestones[milestones.length - 1]
          : milestones.find(
              milestone =>
                rating >= milestone.minRating && rating < milestone.maxRating,
            ) || milestones[milestones.length - 1];
      // fallback if not found

      setData({
        totalRating: rating,
        currentMilestone: myMilestone,
      });
    } catch (error) {
      console.log('Error fetching profile details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!currentMilestone?.next) return 1; // Full progress if highest badge
    const progress =
      (totalRating - currentMilestone.minRating) /
      (currentMilestone.maxRating - currentMilestone.minRating);
    return Math.min(Math.max(progress, 0), 1);
  };

  const getNextMilestoneMessage = () => {
    if (currentMilestone?.next) {
      const pointsNeeded = currentMilestone.maxRating - totalRating;
      return `Points to reach next level: ${pointsNeeded}`;
    } else {
      return 'Congratulations! You have reached the highest badge!';
    }
  };

  // Determine if current milestone is SME
  const isSME = currentMilestone.badge === 'Subject Matter Expert';

  /**
   * Return an array of milestone objects with status:
   *  - 'completed': rating >= milestone.maxRating
   *  - 'current':   user's current milestone
   *  - 'upcoming':  not yet reached
   * However, if isSME is true, mark all as completed.
   */
  const getMilestonesStatus = () => {
    if (isSME) {
      // If user is SME, they have completed the entire journey
      return milestones.map(m => ({...m, status: 'completed'}));
    } else {
      return milestones.map(m => {
        if (totalRating >= m.maxRating) return {...m, status: 'completed'};
        if (m.badge === currentMilestone.badge)
          return {...m, status: 'current'};
        return {...m, status: 'upcoming'};
      });
    }
  };

  const renderMilestoneTimeline = () => {
    const statuses = getMilestonesStatus();

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineScrollContent}
        style={styles.timelineScroll}>
        {statuses.map((m, index) => {
          const isActive = m.status === 'current' || m.status === 'completed';
          const nextIsActive =
            statuses[index + 1] &&
            (statuses[index + 1].status === 'current' ||
              statuses[index + 1].status === 'completed');

          return (
            <View key={m.badge} style={styles.milestoneItem}>
              {/* Connector line */}
              {index !== 0 && (
                <View
                  style={[
                    styles.lineConnector,
                    (isActive || nextIsActive) && styles.lineConnectorActive,
                  ]}
                />
              )}

              {/* Milestone circle + label */}
              <View style={styles.milestoneCircleContainer}>
                <View
                  style={[
                    styles.milestoneCircle,
                    isActive && styles.milestoneCircleActive,
                  ]}>
                  <Text
                    variant="medium10"
                    color={isActive ? COLORS.whiteFFFFFF : COLORS.blue043142}
                    style={{textAlign: 'center'}}>
                    {m.badge[0]}
                  </Text>
                </View>
                <Text
                  variant="medium10"
                  style={[
                    styles.milestoneLabel,
                    isActive && {color: COLORS.yellowF5BE00},
                  ]}>
                  {m.badge}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // Interpolate ring rotation from 0 to 360
  const sweepAngle = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="My Badge" onBackPress={() => navigation.goBack()} />

      {/* Main content card */}
      <View style={styles.cardContainer}>
        {/* Journey Timeline */}
        <View style={styles.timelineContainer}>
          <Text variant="semibold16" style={styles.timelineTitle}>
            Your Journey
          </Text>
          {renderMilestoneTimeline()}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.black333333} />
        ) : (
          <View style={{alignItems: 'center'}}>
            {/* Circular progress ring */}
            <View style={styles.progressWrapper}>
              {/* Base Circle */}
              <View style={styles.baseCircle} />
              {/* Animated Overlay Circle */}
              <Animated.View
                style={[
                  styles.overlayCircle,
                  {
                    transform: [{rotate: sweepAngle}],
                  },
                ]}
              />
              {/* Inner Circle Content */}
              <View style={styles.innerCircle}>
                <Text style={styles.motivationalText}>
                  {motivationalMessages[currentMilestone.badge]}
                </Text>
              </View>
            </View>

            {/* Score and Badge */}
            <View style={styles.scoreContainer}>
              <Image
                source={require('../../assets/images/score.png')}
                style={styles.scoreImage}
              />
              <Text variant="bold22" color={COLORS.whiteFFFFFF}>
                {totalRating}
              </Text>
            </View>

            <Text variant="bold32" color={COLORS.blue043142}>
              {currentMilestone.badge}
            </Text>

            {/* If SME -> Show "covered entire journey" else next-level info */}
            {isSME ? (
              <Text variant="medium14" style={styles.milestoneMessage}>
                You have covered the entire journey!
              </Text>
            ) : (
              <>
                {currentMilestone.next && (
                  <View style={styles.nextLevelContainer}>
                    <Text variant="semibold18" style={styles.nextLevelText}>
                      Next Level:
                    </Text>
                    <Text variant="semibold18" style={styles.nextLevelBadge}>
                      {currentMilestone.next}
                    </Text>
                  </View>
                )}
                <Text variant="medium14" style={styles.milestoneMessage}>
                  {getNextMilestoneMessage()}
                </Text>
              </>
            )}

            {/* Create Content Button */}
            <Button
              text="Create Content"
              textStyle={styles.buttonText}
              width={DEVICE_WIDTH - nw(32)}
              height={nh(50)}
              onPress={() => {
                mixpanel.track('Create Content');
                navigation.navigate(Routes.CreatePost);
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const CIRCLE_SIZE = nh(200);
const BORDER_WIDTH = 10;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingTop: nh(20),
    paddingHorizontal: nw(16),
  },

  /***** TIMELINE *****/
  timelineContainer: {
    marginBottom: nh(20),
  },
  timelineTitle: {
    color: COLORS.blue043142,
    marginBottom: nh(8),
  },
  timelineScroll: {
    marginBottom: nh(10),
  },
  timelineScrollContent: {
    alignItems: 'center',
    paddingRight: nw(16),
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineConnector: {
    width: nw(30),
    height: 2,
    backgroundColor: '#D9D9D9',
    marginHorizontal: nw(5),
  },
  lineConnectorActive: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  milestoneCircleContainer: {
    alignItems: 'center',
  },
  milestoneCircle: {
    width: nh(28),
    height: nh(28),
    borderRadius: nh(14),
    borderWidth: 2,
    borderColor: COLORS.yellowF5BE00,
    backgroundColor: COLORS.whiteFFFFFF,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCircleActive: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  milestoneLabel: {
    color: COLORS.blue043142,
    marginTop: nh(4),
  },

  /***** PROGRESS RING *****/
  progressWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(30),
  },
  baseCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#e0e0e0',
  },
  overlayCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderTopWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
    borderColor: COLORS.yellowF5BE00,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  innerCircle: {
    width: CIRCLE_SIZE - nh(50),
    height: CIRCLE_SIZE - nh(50),
    borderRadius: (CIRCLE_SIZE - nh(50)) / 2,
    backgroundColor: COLORS.whiteFFFFFF,
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(10),
  },
  motivationalText: {
    fontSize: nh(14),
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.blue043142,
  },

  /***** SCORE *****/
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00,
    padding: nw(12),
    borderRadius: nh(25),
    marginBottom: nh(10),
  },
  scoreImage: {
    height: nh(40),
    width: nw(40),
    marginRight: nw(10),
    resizeMode: 'contain',
  },

  /***** NEXT LEVEL *****/
  nextLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextLevelText: {
    color: COLORS.blue043142,
    marginRight: nw(5),
  },
  nextLevelBadge: {
    color: COLORS.yellowF5BE00,
  },
  milestoneMessage: {
    textAlign: 'center',
    width: '80%',
    marginTop: nh(5),
    marginBottom: nh(30),
    color: COLORS.blue043142,
  },
  buttonText: {
    fontSize: nh(18),
    fontFamily: APP_FONTS.PoppinsMedium,
    fontWeight: '600',
  },
});

export default MyBadge;
