import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {getTimeAgo} from '../../helper/commonFunctions';
import {COLORS} from '../../helper/colors';
import Header from '../../components/Header';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import {UserAnalytics} from '../../services/apiService';

export const UserAnalyticsPerf = ({navigation}) => {
  const [data, setData] = useState({});
  const [expandedActivity, setExpandedActivity] = useState(true);
  const [expandedInterests, setExpandedInterests] = useState(true);
  const [expandedAreas, setExpandedAreas] = useState(true);
  const [moreActivity, setMoreActivity] = useState(false);
  const [moreInterests, seMoreInterests] = useState(false);
  const [moreImp, seMoreImp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    UserAnalytics()
      .then(res => {
        setIsLoading(false);
        setData(res?.data);
      })
      .catch(e => {
        console.log('🚀 ~ UserAnalyticsPerf ~ err:', e?.response?.data);
        setIsLoading(false);
      });
  }, []);

  const renderActivityItem = ({item}) => (
    <Pressable
      style={styles.activityCard}
      onPress={() =>
        navigationRef.navigate(Routes.OtherProfile, {
          id: item?.userId,
        })
      }>
      {item.profilePicture ? (
        <Image
          source={{uri: item.profilePicture}}
          style={styles.profilePicture}
        />
      ) : (
        <View style={styles.placeholderPicture}>
          <Text style={styles.initial}>{item.username[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={{marginLeft: nh(10)}}>
        <Text style={styles.username}>{item.username}</Text>
        <View style={{flexDirection: 'row'}}>
          <Text style={styles.timestamp}>{'Last viewed: '}</Text>
          <Text style={styles.count}>{getTimeAgo(item.timestamp)}</Text>
        </View>
        <View style={{flexDirection: 'row'}}>
          <Text style={styles.timestamp}>{'Profile views: '}</Text>
          <Text style={styles.count}>{item.count}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderInterestTag = (interest, index) => {
    const topic = interest?.interest || interest?.topic;
    const calculateFontSize = count => {
      const minFontSize = 18;
      const maxFontSize = 40;
      if (!count || typeof count !== 'number') {
        return minFontSize; // Default to the smallest size if count is invalid
      }
      return Math.min(Math.max(count, minFontSize), maxFontSize);
    };
    const fontSize = calculateFontSize(interest?.count);
    return (
      <Text key={index} style={[styles.interestTag, {fontSize: nh(fontSize)}]}>
        {topic}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="Analytics & Performance" />
      {isLoading ? (
        <View style={styles.emptyList}>
          <ActivityIndicator
            size="large"
            color={COLORS.blue043142}
            style={styles.loadingIndicator}
          />
        </View>
      ) : Object.keys(data)?.length > 0 ? (
        <ScrollView style={styles.subContainer}>
          {/* Profile Views Section */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => {
                setExpandedActivity(!expandedActivity);
                setMoreActivity(false);
              }}>
              <Text style={styles.heading}>
                {expandedActivity ? '▼ Profile Views' : '▶ Profile Views'}
              </Text>
            </TouchableOpacity>
            {expandedActivity && (
              <>
                <FlatList
                  data={
                    moreActivity ? data.activity : data.activity.slice(0, 2)
                  }
                  renderItem={renderActivityItem}
                  keyExtractor={(_, index) => index.toString()}
                  contentContainerStyle={styles.activityList}
                  scrollEnabled={false}
                />
                {data.activity.length > 2 && (
                  <TouchableOpacity
                    onPress={() => setMoreActivity(!moreActivity)}
                    style={styles.expandButton}>
                    <Text style={styles.expandButtonText}>
                      {moreActivity ? 'Show Less' : 'Show More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Interests Section */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => {
                setExpandedInterests(!expandedInterests);
                seMoreInterests(false);
              }}>
              <Text style={styles.heading}>
                {expandedInterests ? '▼ Interests' : '▶ Interests'}
              </Text>
            </TouchableOpacity>
            {expandedInterests && (
              <>
                <View style={styles.interestsContainer}>
                  {(moreInterests
                    ? data.interests
                    : data.interests.slice(0, 7)
                  ).map((interest, index) =>
                    renderInterestTag(interest, index),
                  )}
                </View>
                {data.interests.length > 7 && (
                  <TouchableOpacity
                    onPress={() => seMoreInterests(!moreInterests)}
                    style={styles.expandButton}>
                    <Text style={styles.expandButtonText}>
                      {moreInterests ? 'Show Less' : 'Show More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Areas of Improvement Section */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => {
                setExpandedAreas(!expandedAreas);
                seMoreImp(false);
              }}>
              <Text style={styles.heading}>
                {expandedAreas
                  ? '▼ Areas of Improvement'
                  : '▶ Areas of Improvement'}
              </Text>
            </TouchableOpacity>
            {expandedAreas &&
              (data.areasOfImprovement.length === 0 ? (
                <View style={styles.quizPrompt}>
                  <Text style={styles.quizMessage}>
                    No areas of improvement found. Participate in a quiz to
                    evaluate your performance and identify areas for
                    improvement!
                  </Text>
                  <TouchableOpacity
                    style={styles.quizButton}
                    onPress={() => navigation.navigate(Routes.QuizList)}>
                    <Text style={styles.quizButtonText}>Take Quiz</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.interestsContainer}>
                    {(moreImp
                      ? data.areasOfImprovement
                      : data.areasOfImprovement.slice(0, 7)
                    ).map((interest, index) =>
                      renderInterestTag(interest, index),
                    )}
                  </View>
                  {data.areasOfImprovement.length > 7 && (
                    <TouchableOpacity
                      onPress={() => seMoreImp(!moreImp)}
                      style={styles.expandButton}>
                      <Text style={styles.expandButtonText}>
                        {moreImp ? 'Show Less' : 'Show More'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyList}>
          <Text
            style={{
              color: COLORS.gray_color,
              width: '100%',
              textAlign: 'center',
              fontSize: 20,
              fontWeight: '500',
            }}>
            {'No data available'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -15}, {translateY: -15}],
    zIndex: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F7F9FC', // Softer background
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFCFF', // Lighter, more modern yellow-blue gradient
  },
  subContainer: {
    flex: 1,
    marginTop: nh(10),
    paddingHorizontal: nw(16),
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: nh(24),
    backgroundColor: '#FFFFFF',
    borderRadius: nh(15),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    paddingBottom: nh(16),
    paddingHorizontal: nw(12),
  },
  heading: {
    fontSize: nh(18),
    fontWeight: '700',
    marginVertical: nh(10),
    color: '#2C3E50',
    paddingVertical: nh(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECF4',
  },
  activityList: {
    paddingBottom: nh(16),
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: nh(12),
    padding: nh(15),
    marginVertical: nh(8),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E9ECF4',
  },
  profilePicture: {
    width: nw(60),
    height: nw(60),
    borderRadius: nw(30),
    borderWidth: 2,
    borderColor: '#E9ECF4',
  },
  placeholderPicture: {
    width: nw(60),
    height: nh(60),
    borderRadius: nh(30),
    backgroundColor: '#3498DB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3498DB',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  initial: {
    fontSize: nh(24),
    color: COLORS.whiteFFFFFF,
    fontWeight: '600',
  },
  username: {
    fontSize: nh(16),
    fontWeight: '700',
    color: '#2C3E50',
  },
  timestamp: {
    fontSize: nh(12),
    color: '#7F8C8D',
  },
  count: {
    fontSize: nh(12),
    color: '#2980B9',
    fontWeight: '600',
    marginLeft: nh(5),
  },
  expandButton: {
    alignSelf: 'center',
    backgroundColor: '#F5BE00',
    paddingVertical: nh(10),
    paddingHorizontal: nw(20),
    borderRadius: nh(10),
    marginTop: nh(12),
    shadowColor: '#3498DB',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  expandButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nh(14),
    fontWeight: '600',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(10),
  },
  interestTag: {
    margin: nh(4),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    backgroundColor: '#F0F4F8',
    color: '#2C3E50',
    borderRadius: nh(15),
    alignSelf: 'center',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quizPrompt: {
    padding: nh(20),
    backgroundColor: '#FFFFFF',
    borderRadius: nh(15),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E9ECF4',
  },
  quizMessage: {
    fontSize: nh(14),
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: nh(16),
    lineHeight: nh(22),
  },
  quizButton: {
    backgroundColor: '#3498DB',
    paddingVertical: nh(12),
    paddingHorizontal: nw(25),
    borderRadius: nh(10),
    shadowColor: '#3498DB',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quizButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nh(14),
    fontWeight: '700',
  },
});
