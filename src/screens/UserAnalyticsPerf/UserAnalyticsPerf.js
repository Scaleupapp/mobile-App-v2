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

export const UserAnalyticsPerf = () => {

  const [data, setData] = useState({
    activity: [],
    interests: [],
    areasOfImprovement: []
  });
  // const [data, setData] = useState({});
  const [expandedActivity, setExpandedActivity] = useState(true);
  const [expandedInterests, setExpandedInterests] = useState(true);
  const [expandedAreas, setExpandedAreas] = useState(true);
  const [moreActivity, setMoreActivity] = useState(false);
  const [moreInterests, seMoreInterests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    UserAnalytics()
      .then(res => {
        setIsLoading(false);
        console.log('🚀 ~ UserAnalyticsPerf ~ res:', res.data);
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
        {interest.interest}
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
            <TouchableOpacity onPress={() => setExpandedAreas(!expandedAreas)}>
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
                    onPress={() => Alert.alert('launching soon...')}
                    // onPress={() => navigationRef.navigate(Routes.QuizScreen)}
                  >
                    <Text style={styles.quizButtonText}>Take Quiz</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                data.areasOfImprovement.map((area, index) => (
                  <Text key={index} style={styles.areaTag}>
                    {area}
                  </Text>
                ))
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
    backgroundColor: COLORS.whiteFFFFFF,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  subContainer: {
    flex: 1,
    marginTop: nh(10),
    paddingHorizontal: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  section: {
    marginBottom: nh(24),
  },
  heading: {
    fontSize: nh(18),
    fontWeight: 'bold',
    marginVertical: nh(10),
    color: COLORS.black333333,
  },
  activityList: {
    paddingBottom: nh(16),
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(8),
    padding: nh(10),
    marginVertical: nh(8),
    alignItems: 'center',
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    borderWidth: nh(1),
    borderColor: 'rgba(214, 214, 214, 0.2)',
  },
  profilePicture: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
  },
  placeholderPicture: {
    width: nw(50),
    height: nh(50),
    borderRadius: nh(25),
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: nh(24),
    color: COLORS.whiteFFFFFF,
  },
  username: {
    fontSize: nh(16),
    fontWeight: 'bold',
    color: COLORS.black333333,
    marginTop: nh(8),
  },
  timestamp: {
    fontSize: nh(12),
    color: '#888',
    marginTop: nh(4),
  },
  count: {
    fontSize: nh(12),
    color: '#555',
    marginTop: nh(4),
  },
  expandButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(8),
    paddingHorizontal: nw(16),
    borderRadius: nh(8),
    marginTop: nh(8),
  },
  expandButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nh(14),
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(10),
  },
  interestTag: {
    margin: nh(4),
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    backgroundColor: '#FDF2CC',
    color: '#2c3e50',
    borderRadius: nh(12),
    alignSelf: 'center',
  },
  quizPrompt: {
    padding: nh(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(8),
    alignItems: 'center',
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    borderWidth: nh(1),
    borderColor: 'rgba(214, 214, 214, 0.2)',
  },
  quizMessage: {
    fontSize: nh(14),
    color: COLORS.black333333,
    textAlign: 'center',
    marginBottom: nh(16),
  },
  quizButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(10),
    paddingHorizontal: nw(20),
    borderRadius: nh(8),
  },
  quizButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nh(14),
    fontWeight: 'bold',
  },
  areaTag: {
    fontSize: nh(14),
    color: COLORS.black333333,
    marginVertical: nh(4),
    paddingHorizontal: nw(10),
    paddingVertical: nh(6),
    backgroundColor: '#e0e7ff',
    borderRadius: nh(8),
  },
});
