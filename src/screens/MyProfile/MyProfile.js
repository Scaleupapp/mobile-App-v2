import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ScrollView,
  Pressable,
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
import {getProfile} from '../../services/apiService';

const MyProfile = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const [profile, setProfile] = useState();
  console.log('🚀 ~ MyProfile ~ profile:', profile);
  // console.log('🚀 ~ MyProfile ~ userReducer:', userData);
  // const {username, firstname} = userReducer;
  let type = route?.params?.type ?? 'user';

  useEffect(() => {
    getprofiledetails();
  }, []);
  const getprofiledetails = async () => {
    try {
      let resp = await getProfile(route?.params?.id ?? '');

      setProfile(resp?.data?.userProfileInfo);
      console.log(resp?.data?.userProfileInfo, 'dgdgdgdggd');
    } catch (error) {
      console.log('🚀 ~ getprofiledetails ~ error:', error);
    }
  };
  console.log(profile);
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title={type == 'user' ? 'My Profile' : profile?.username ?? ''}
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView>
            <Image source={images.profilebaground} style={styles.images} />
            {profile?.profilePicture ? (
              <Image
                source={{uri: profile?.profilePicture}}
                style={styles.imagecircle}
                resizeMode="cover"
              />
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
              variant="medium16"
              color={COLORS.grey777777}
              style={{textAlign: 'center'}}>
              {/* {profile} */}
            </Text>
            <Text
              variant="medium12"
              color={COLORS.grey999999}
              style={{textAlign: 'center', marginBottom: nh(20)}}>
              {profile?.bio?.bioAbout}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'center',
              }}>
              {profile?.topicsOfInterest?.map(u => (
                <View style={styles.yellowview}>
                  <Text variant="medium12" color={COLORS.blue043142}>
                    {u}
                  </Text>
                </View>
              ))}
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
                  {profile?.contentCount ?? ''}
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  posts
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
                  followers
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
                  {profile?.followingCount ?? ''}
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  following
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
                <Button text="Follow" />
              </View>
            )}
            <AllPostoption type={type} data={profile?.content} />
          </ScrollView>
        </View>
      </View>
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
