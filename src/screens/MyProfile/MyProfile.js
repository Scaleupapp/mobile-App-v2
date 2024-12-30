import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
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
import {FlatList} from 'react-native-gesture-handler';

const MyProfile = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const [profile, setProfile] = useState();
  console.log('🚀 ~ MyProfile ~ profile:', profile);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [follow, setFollow] = useState(false);
  // console.log('🚀 ~ MyProfile ~ userReducer:', userData);
  // const {username, firstname} = userReducer;
  let type = route?.params?.id ? 'other' : 'user';

  useEffect(() => {
    getprofiledetail();
  }, [route?.params?.id]);
  const getprofiledetail = async () => {
    try {
      let resp = await getProfiledetails(route?.params?.id ?? userData?.id);

      setProfile(resp?.data);
      setFollow(resp?.data?.followers.includes(userData?.username));
    } catch (error) {
      console.log('🚀 ~ getprofiledetails ~ error:', error);
    } finally {
      setLoading(false);
    }
    console.log('🚀 ~ getprofiledetail ~ resp?.data:', resp?.data);
  };
  const followApi = async () => {
    try {
      setFollow(!follow);
      let res = follow
        ? await unlfollowUser(route?.params?.id)
        : await followUser(route?.params?.id);
    } catch (error) {
      console.log('🚀 ~ followApi ~ error:', error?.response?.data);
    }
  };
  const wantToBlock = () => {
    setVisible(false);
    bockUser(profile?.id)
      .then(res => {
        console.log(res?.data, 'blockuserData=====d>');
      })
      .catch(err => console.log('sndjksn ', err));
  };

  return loading ? (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <ActivityIndicator size={30} />
      <Text variant="medium12" style={{marginTop: 10}}>
        {' '}
        Profile Loading....
      </Text>
    </View>
  ) : (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <>
        <Header
          title={type == 'user' ? 'My Profile' : profile?.username ?? ''}
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={route?.params?.id ? true : false} // Provide your right icon
          // onBackPress={handleBackPress}
          onRightIconPress={() => setVisible(!visible)}
        />
        <View style={styles.layer1}>
          <View style={styles.layer2}>
            <ScrollView nestedScrollEnabled>
              <Image source={images.profilebaground} style={styles.images} />
              {profile?.profilePicture ? (
                <View>
                  <Image
                    source={{uri: profile?.profilePicture}}
                    style={styles.imagecircle}
                    resizeMode="cover"
                  />
                  {profile?.role === 'SME' && (
                    <Image
                      resizeMode="cover"
                      tintColor={'#F6BE00'}
                      source={require('../../assets/icons/medal-star.png')}
                      style={{
                        height: 30,
                        width: 30,
                        // backgroundColor: 'white',
                        // borderRadius: 9,
                        position: 'absolute',
                        right: DEVICE_WIDTH / 2 - nw(80),
                        top: 20,
                      }}
                    />
                  )}
                </View>
              ) : (
                <View
                  style={[
                    styles.imagecircle,
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
                          .toUpperCase()}${profile?.lastname
                          ?.charAt(0)
                          .toUpperCase()}`
                      : ''}
                  </Text>
                </View>
              )}

              <Text
                variant="semibold20"
                color={COLORS.blue043142}
                style={{textAlign: 'center'}}>
                {profile?.username}
              </Text>

              <Text
                variant="medium14"
                color={COLORS.grey777777}
                style={{
                  textAlign: 'center',
                  backgroundColor: COLORS.blue043142 + 10,
                  paddingHorizontal: 10, // Optional padding for better readability
                  paddingVertical: 2,
                  alignSelf: 'center',
                  borderRadius: 8,
                  marginBottom: 3,
                }}>
                {profile?.role != 'SME' &&
                  profile?.badges[profile?.badges?.length - 1]}
              </Text>
              <Text
                variant="medium12"
                color={COLORS.grey999999}
                style={{textAlign: 'center', marginBottom: nh(20)}}>
                {profile?.bioAbout}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  justifyContent: 'center',
                }}>
                <FlatList
                  data={profile?.bioInterests}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({item}) => {
                    // console.log('🚀 ~ MyProfile ~ u:', item);
                    return (
                      <View style={styles.yellowview}>
                        <Text variant="medium12" color={COLORS.blue043142}>
                          {item}
                        </Text>
                      </View>
                    );
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',

                  justifyContent: 'space-between',
                  alignContent: 'center',
                  marginHorizontal: nw(44),
                }}>
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
                      id: type == 'user' ? userData?.id : route?.params?.id,
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
                      id: type == 'user' ? userData?.id : route?.params?.id,
                    })
                  }>
                  <Text variant="bold20" color={COLORS.blue043142}>
                    {profile?.following.length ?? ''}
                  </Text>
                  <Text variant="medium16" color={COLORS.blue043142}>
                    Following
                  </Text>
                </Pressable>
              </View>
              {type == 'user' ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: nh(30),
                    justifyContent: 'space-between',
                  }}>
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
              <AllPostoption type={type} data={profile?.content} />
            </ScrollView>
          </View>
        </View>
        <MenuModal
          visible={visible}
          setVisible={setVisible}
          menuItems={[
            {
              name: 'Block User',
              // icon: icons.block,
              image: icons.block,
              onPress: () => wantToBlock(),
            },
          ]}
        />
      </>
    </SafeAreaView>
  );
};

export default MyProfile;

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
    borderTopRightRadius: 25,
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
  images: {
    height: nh(175),
    width: DEVICE_WIDTH - 32,
    alignSelf: 'center',
  },
  imagecircle: {
    height: nw(100),
    width: nw(100),
    borderRadius: nw(50),
    borderWidth: 5,
    borderColor: COLORS.whiteFFFFFF,
    alignSelf: 'center',
    marginTop: -50,
  },
  yellowview: {
    backgroundColor: 'rgba(245, 190, 0, 0.15)',

    paddingVertical: 6,
    paddingHorizontal: nh(10),
    borderRadius: 8,
    marginRight: 10,

    marginBottom: nh(20),
  },
});
