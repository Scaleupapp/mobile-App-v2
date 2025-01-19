import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
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

  useEffect(() => {
    getProfileDetail();
  }, []);

  const getProfileDetail = async () => {
    try {
      let {data} = await getProfiledetails(userData?.id, 1);
      const rating = data?.totalRating ?? 0;
      const myMilestone = milestones.find(
        milestone =>
          rating >= milestone.minRating && rating < milestone.maxRating,
      );
      setData({
        totalRating: rating,
        currentMilestone: data?.role === 'SME' ? milestones[5] : myMilestone,
      });
    } catch (error) {
      console.log('Error fetching profile details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!currentMilestone?.next) return 1; // Full progress for highest badge
    const progress =
      (totalRating - currentMilestone.minRating) /
      (currentMilestone.maxRating - currentMilestone.minRating);
    return Math.min(Math.max(progress, 0), 1); // Clamp between 0 and 1
  };

  const getNextMilestoneMessage = () => {
    if (currentMilestone?.next) {
      const pointsNeeded = currentMilestone.maxRating - totalRating;
      return `Points remaining for next level: ${pointsNeeded}`;
    } else {
      return 'Congratulations! You have reached the highest badge!';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="My Badge" onBackPress={() => navigation.goBack()} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.black333333} />
            </View>
          ) : (
            <View style={{alignItems: 'center'}}>
              {/* Circular Progress */}
              <View style={styles.circularProgressContainer}>
                <View
                  style={[
                    styles.circularProgress,
                    {
                      borderWidth: nw(10),
                      borderColor: COLORS.yellowF5BE00,
                      transform: [
                        {rotate: `${getProgressPercentage() * 360}deg`},
                      ],
                    },
                  ]}
                />
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

              {/* Next Level */}
              {currentMilestone.next ? (
                <View style={styles.nextLevelContainer}>
                  <Text variant="semibold20" color={COLORS.blue043142}>
                    {'Next Level: '}
                  </Text>
                  <Text variant="semibold20" color={COLORS.yellowF5BE00}>
                    {currentMilestone.next}
                  </Text>
                </View>
              ) : null}

              {/* Milestone Message */}
              <Text
                variant="medium14"
                color={COLORS.blue043142}
                style={{
                  textAlign: 'center',
                  width: '80%',
                  marginTop: nh(5),
                  marginBottom: nh(30),
                }}>
                {getNextMilestoneMessage()}
              </Text>

              {/* Create Content Button */}
              <Button
                text="Create Content"
                textStyle={styles.buttonText}
                width={DEVICE_WIDTH - nw(32)}
                height={nh(50)}
                onPress={() => navigation.navigate(Routes.CreatePost)}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  loader: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    top: nh(200),
  },
  circularProgressContainer: {
    height: nh(200),
    width: nh(200),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: nh(30),
  },
  circularProgress: {
    height: nh(200),
    width: nh(200),
    borderRadius: nh(100),
    position: 'absolute',
    borderWidth: nw(10),
    borderColor: '#e0e0e0',
  },
  innerCircle: {
    height: nh(150),
    width: nh(150),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(75),
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(10),
  },
  motivationalText: {
    fontSize: nh(16),
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.blue043142,
  },
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
  },
  nextLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneMessage: {
    textAlign: 'center',
    width: '80%',
    marginTop: nh(5),
    marginBottom: nh(30),
    color: COLORS.blue043142,
    fontSize: nh(14),
  },
  buttonText: {
    fontSize: nh(18),
    fontFamily: APP_FONTS.PoppinsMedium,
    fontWeight: '600',
  },
});

export default MyBadge;
