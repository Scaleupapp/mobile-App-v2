import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ImageBackground,
  FlatList,
  Pressable,
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
import Routes from '../../helper/routes';

const Followers = ({navigation, route}) => {
  const [followers, setFollowers] = useState();

  useEffect(() => {
    getfollowers();
  }, []);

  let getfollowers = async () => {
    try {
      let resp = await getFollowerlist();
      setFollowers(resp?.data?.followerList);
      console.log(resp?.data, 'dta');
    } catch (error) {}
  };

  const UserView = ({item}) => {
    const [follow, setFollow] = useState(item?.isFollowed);

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
          <Image source={{uri: item?.profilePicture}} style={styles.image} />

          <Pressable
            style={{width: nw(188)}}
            onPress={() =>
              navigation.navigate(Routes.MyProfile, {id: item?._id})
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
            text={follow ? 'Following' : 'Follow'}
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
          title="Followers"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View>

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

export default Followers;

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
    // marginBottom: nh(22),

    paddingTop: nh(22),
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
});
