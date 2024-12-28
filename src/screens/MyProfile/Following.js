import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ImageBackground,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {images} from '../../assets/images';
import CustomTextInput from '../../components/TextInput';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Icon from '../../helper/icon';
import {
  followUser,
  getFollowerlist,
  unlfollowUser,
} from '../../services/apiService';
import {Pressable} from 'react-native';
import Routes from '../../helper/routes';
import {useSelector} from 'react-redux';

const Following = ({navigation, route}) => {
  const [followers, setFollowers] = useState();
  const userData = useSelector(state => state?.userData);
  console.log('🚀 ~ Following ~ userData:', userData?.id);

  useEffect(() => {
    getfollowers();
  }, []);

  let getfollowers = async () => {
    try {
      let resp = await getFollowerlist(route?.params?.id);
      setFollowers(resp?.data?.followingList);
    } catch (error) {}
  };

  const UserView = ({item}) => {
    const [follow, setFollow] = useState(true);

    const followApi = async () => {
      try {
        setFollow(!follow);
        let res = follow
          ? await unlfollowUser(item?._id)
          : await followUser(item?._id);
        console.log('🚀 ~ followApi ~ res:', res?.data);
      } catch (error) {
        console.log('🚀 ~ followApi ~ error:', error?.response?.data);
      }
    };
    return (
      <View>
        <View style={styles.card}>
          {item?.profilePicture ? (
            <Image source={{uri: item?.profilePicture}} style={styles.image} />
          ) : (
            <View
              style={[
                styles.image,
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.greyD6D6D6,
                },
              ]}>
              <Text variant="semibold18" color={COLORS.black333333}>
                {`${item?.username?.charAt(0).toUpperCase()}`}
              </Text>
            </View>
          )}

          <Pressable
            style={{width: nw(188)}}
            onPress={() =>
              navigation.navigate(Routes.MyProfile, {
                id: item?._id,
                type: 'other',
              })
            }>
            <Text variant="medium14" color={COLORS.blue043142}>
              {item?.username}
            </Text>

            {/* <Text
            variant="medium12"
            color={COLORS.grey999999}
            style={{width: nw(208)}}>
            Designation
          </Text> */}
          </Pressable>

          <Button
            text={follow ? 'Unfollow' : 'Follow'}
            variant={follow ? 'outline' : 'solid'}
            width={nw(100)}
            height={nh(35)}
            textStyle={{fontSize: 14}}
            onPress={() => followApi()}
          />
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={images.ellipse}
        style={styles.semicirlce}
        resizeMode="stretch">
        <Header
          title="Following"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      {/* <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View> */}

      <FlatList
        data={followers}
        renderItem={({item}) => <UserView item={item} />}
      />

      {/* <View>
          <Image
            source={images.notification}
            resizeMode="contain"
            style={styles.notimage}
          />

          <Text
            variant="semibold20"
            color={COLORS.blue043142}
            style={{textAlign: 'center', marginTop: nh(30)}}>
            You’re All Caught Up{' '}
          </Text>
          <Text
            variant="medium14"
            color={COLORS.grey999999}
            style={{
              textAlign: 'center',
              marginTop: nh(5),
              marginBottom: nh(20),
            }}>
            No new notifications right now. Check back later or explore more
            content in the meantime.
          </Text>
          <Button text="Explore Content" />
        </View> */}
    </SafeAreaView>
  );
};

export default Following;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  semicirlce: {
    width: DEVICE_WIDTH,
    height: nh(120),
    marginBottom: nh(20),
  },
  image: {
    height: nh(50),
    width: nh(50),
    borderRadius: nh(25),
    marginRight: 10,
    // marginBottom: nh(22),
    borderWidth: 1,
    borderColor: COLORS.grey777777,
  },
  card: {
    flexDirection: 'row',
    boxShadow: '0 2 5 0 #00000026',

    alignItems: 'center',
    paddingHorizontal: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
    // borderRadius: nh(10),
    paddingBottom: 15,

    paddingTop: nh(22),
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
});
