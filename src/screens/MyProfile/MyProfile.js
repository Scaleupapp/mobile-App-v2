import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {images} from '../../assets/images';
import Text from '../../components/Text';
import Button from '../../components/Button';
import AllPostoption from './AllPostoption';
import Routes from '../../helper/routes';
import {useSelector} from 'react-redux';
import {
  bockUser,
  followUser,
  getProfile,
  getProfiledetails,
  unlfollowUser,
} from '../../services/apiService';
import {MenuModal} from '../../components/MenuModal';
import {icons} from '../../assets/icons';

const MyProfile = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const [profile, setProfile] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [follow, setFollow] = useState(false);

  let type = route?.params?.id ? 'other' : 'user';

  // Example color map for badges (from lowest to highest rank).
  // Adjust as needed for your design.
  const badgeColorMap = {
    Novice: '#C0C0C0', // silver/gray
    Explorer: '#2E8B57', // sea-green
    Creator: '#FF8C00', // dark orange
    Specialist: '#800080', // purple
    Influencer: '#008B8B', // dark cyan
    'Subject Matter Expert': '#FFD700', // gold
  };

  useEffect(() => {
    getprofiledetail(1);
  }, [route?.params?.id]);

  const getprofiledetail = async (pageNum) => {
    try {
      // Log the current page number being fetched
      console.log(`Fetching profile details for page: ${pageNum}`);
  
      // Make the API call to fetch profile details
      let resp = await getProfiledetails(
        route?.params?.id ?? userData?.id,
        pageNum,
      );
  
      // Log the entire response object
      console.log('API Response:', resp);
  
      // Optionally, log specific parts of the response for clarity
      console.log('Response Data:', resp?.data);
      console.log('Content Array:', resp?.data?.content);
      console.log('Followers:', resp?.data?.followers);
      console.log('Pagination Info:', resp?.data?.pagination);
  
      // Update the profile state with the new data
      setProfile((prev) => ({
        ...prev, // Spread the existing properties of prev
        ...resp?.data,
        content: [
          ...(prev?.content || []), // Spread the existing content array or use an empty array if it's undefined
          ...(resp?.data?.content || []), // Append the new content from resp.data.content
        ],
      }));
  
      // Log the updated profile state (optional)
      console.log('Updated Profile State:', {
        ...profile,
        ...resp?.data,
        content: [
          ...(profile?.content || []),
          ...(resp?.data?.content || []),
        ],
      });
  
      // Update the follow status
      setFollow(resp?.data?.followers.includes(userData?.username));
  
      // Log the follow status
      console.log(`Is Following: ${resp?.data?.followers.includes(userData?.username)}`);
  
      // Handle pagination by checking if more pages are available
      if (resp?.data?.pagination?.totalPages > pageNum) {
        console.log(`Total Pages: ${resp?.data?.pagination?.totalPages} > Current Page: ${pageNum}`);
        
        setTimeout(() => {
          getprofiledetail(pageNum + 1);
          console.log('API triggered for next page');
        }, 500);
      } else {
        console.log('No more pages to fetch.');
      }
    } catch (error) {
      // Log detailed error information
      console.log('Error fetching profile details:', error);
    } finally {
      // Log the loading state (optional)
      console.log('Setting loading state to false');
      setLoading(false);
    }
  };
  

  const followApi = async () => {
    try {
      setFollow(!follow);
      if (follow) {
        await unlfollowUser(route?.params?.id);
      } else {
        await followUser(route?.params?.id);
      }
    } catch (error) {
      console.log('Follow/unfollow error:', error?.response?.data);
    }
  };

  const wantToBlock = () => {
    setVisible(false);
    bockUser(profile?.id)
      .then(res => {
        console.log('Block user response:', res?.data);
      })
      .catch(err => console.log('Block user error:', err));
  };

  return loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={30} />
      <Text variant="medium12" style={{marginTop: 10}}>
        Profile Loading....
      </Text>
    </View>
  ) : (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <Header
        title={type === 'user' ? 'My Profile' : profile?.username ?? ''}
        onRightIconPress={() => setVisible(!visible)}
        rightIcon={!!route?.params?.id} // show right icon if it's 'other' user
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView nestedScrollEnabled>
            <Image source={images.profilebaground} style={styles.headerImage} />

            {/* Profile Picture Section */}
            {profile?.profilePicture ? (
              <View>
                <Image
                  source={{uri: profile.profilePicture}}
                  style={styles.profilePic}
                  resizeMode="cover"
                />
                {/* If user is SME, show medal icon on top */}
                {profile?.role === 'SME' && (
                  <Image
                    resizeMode="cover"
                    tintColor={'#F6BE00'}
                    source={require('../../assets/icons/medal-star.png')}
                    style={[
                      styles.smeMedal,
                      {
                        tintColor: '#F6BE00', // gold
                      },
                    ]}
                  />
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.profilePic,
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.greyD6D6D6,
                  },
                ]}>
                <Text variant="semibold20" color={COLORS.black333333}>
                  {profile?.firstname
                    ? `${profile?.firstname
                        ?.charAt(0)
                        ?.toUpperCase()}${profile?.lastname
                        ?.charAt(0)
                        ?.toUpperCase()}`
                    : ''}
                </Text>
              </View>
            )}

            {/* Username + SME Icon (superscript) */}
            <View style={styles.usernameContainer}>
              <Text
                variant="semibold20"
                color={COLORS.blue043142}
                style={styles.usernameText}>
                {profile?.username || ''}
              </Text>
            </View>

            {/* Show all badges with distinct colors */}
            <View style={styles.badgesContainer}>
              {profile?.badges?.length > 0 ? (
                profile.badges.map((badge, idx) => {
                  const color = badgeColorMap[badge] || '#A9A9A9'; // fallback color
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.badgeWrapper,
                        {backgroundColor: color + '20'}, // lighten or adjust alpha
                      ]}>
                      <Text
                        variant="medium12"
                        style={{color: color, fontWeight: 'bold'}}>
                        {badge}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.badgeWrapper}>
                  <Text variant="medium12" color={COLORS.grey999999}>
                    No badges
                  </Text>
                </View>
              )}
            </View>

            {/* Bio */}
            <Text
              variant="medium12"
              color={COLORS.grey999999}
              style={{textAlign: 'center', marginBottom: nh(20)}}>
              {profile?.bioAbout}
            </Text>

            {/* Interests */}
            {profile?.bioInterests?.length > 0 && (
              <View style={styles.interestsRow}>
                <FlatList
                  data={profile.bioInterests}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({item}) => (
                    <View style={styles.interestPill}>
                      <Text variant="medium12" color={COLORS.blue043142}>
                        {item}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(interest, index) => `${interest}-${index}`}
                />
              </View>
            )}

            {/* Stats (Posts, Followers, Following) */}
            <View style={styles.statsRow}>
              <Pressable style={{alignItems: 'center'}}>
                <Text variant="bold20" color={COLORS.blue043142}>
                  {profile?.totalPosts ?? ''}
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  Posts
                </Text>
              </Pressable>

              <Pressable
                style={{alignItems: 'center'}}
                onPress={() =>
                  navigation.navigate(Routes.Followers, {
                    id: type === 'user' ? userData.id : route?.params?.id,
                  })
                }>
                <Text variant="bold20" color={COLORS.blue043142}>
                  {profile?.followersCount ?? ''}
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  Followers
                </Text>
              </Pressable>

              <Pressable
                style={{alignItems: 'center'}}
                onPress={() =>
                  navigation.navigate(Routes.Following, {
                    id: type === 'user' ? userData.id : route?.params?.id,
                  })
                }>
                <Text variant="bold20" color={COLORS.blue043142}>
                  {profile?.following?.length ?? 0}
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  Following
                </Text>
              </Pressable>
            </View>

            {/* Buttons (Edit Profile or Follow) */}
            {type === 'user' ? (
              <View style={styles.userButtonRow}>
                <Button
                  text="Edit Profile"
                  width={nw(283)}
                  onPress={() => navigation.navigate(Routes.EditProfile)}
                />
                <Button
                  justIcon={'settings-sharp'}
                  width={50}
                  onPress={() => navigation.navigate(Routes.Settings)}
                />
              </View>
            ) : (
              <View style={{marginTop: nh(30)}}>
                <Button
                  onPress={followApi}
                  text={follow ? 'Following' : 'Follow'}
                />
              </View>
            )}

            {/* All Posts Option */}
            <AllPostoption type={type} data={profile} />
          </ScrollView>
        </View>
      </View>

      {/* Menu Modal for blocking user, etc. */}
      <MenuModal
        visible={visible}
        setVisible={setVisible}
        menuItems={[
          {
            name: 'Block User',
            image: icons.block,
            onPress: () => wantToBlock(),
          },
        ]}
      />
    </SafeAreaView>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  headerImage: {
    height: nh(175),
    width: DEVICE_WIDTH - 32,
    alignSelf: 'center',
  },
  profilePic: {
    height: nw(100),
    width: nw(100),
    borderRadius: nw(50),
    borderWidth: 5,
    borderColor: COLORS.whiteFFFFFF,
    alignSelf: 'center',
    marginTop: -50,
  },
  smeMedal: {
    height: 30,
    width: 30,
    tintColor: '#F6BE00',
    position: 'absolute',
    right: DEVICE_WIDTH / 2 - nw(80),
    top: 20,
  },
  usernameContainer: {
    alignSelf: 'center',
    marginTop: nh(5),
    position: 'relative',
  },
  usernameText: {
    textAlign: 'center',
  },
  smeSuperscript: {
    position: 'absolute',
    top: -5,
    right: -25,
    width: 20,
    height: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: nh(10),
  },
  badgeWrapper: {
    margin: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  interestsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginBottom: nh(20),
  },
  interestPill: {
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: nh(10),
    borderRadius: 8,
    marginRight: 10,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginHorizontal: nw(44),
    marginTop: nh(10),
  },
  userButtonRow: {
    flexDirection: 'row',
    marginTop: nh(30),
    justifyContent: 'space-between',
  },
});
