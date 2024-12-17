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
  acceptInnerCircleRequestAPI,
  declineInnerCircleRequestAPI,
  myInnerCircleAPI,
  myInnerCircleRequestAPI,
} from '../../services/apiService';
import Routes from '../../helper/routes';

const InnerCircle = ({navigation, route}) => {
  const [innerCircle, setInnerCircle] = useState([]);
  useEffect(() => {
    getInnerCircleList();
  }, []);

  let getInnerCircleList = async () => {
    try {
      let resp = await myInnerCircleAPI();
      setInnerCircle(resp?.data);
      console.log(resp?.data, 'myInnerCircleRequestAPI');
    } catch (error) {
      console.log(error, 'rerrr');
    }
  };
  let declineRequest = async id => {
    try {
      let payload = {
        targetUserId: id,
      };
      let resp = await declineInnerCircleRequestAPI(payload);
      console.log('🚀 ~ acceptRequest ~ resp:', resp?.data);
      let data = innerCircle.filter(user => user.userId !== id);
      setInnerCircle(data);
    } catch (error) {}
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
          title="Inner Circle"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View>

      {innerCircle?.length > 0 ? (
        <FlatList
          data={innerCircle}
          renderItem={({item}) => {
            return (
              <View>
                <View style={styles.card}>
                  <Image
                    source={{uri: item?.profilePicture}}
                    style={styles.image}
                  />

                  <View style={{width: nw(195)}}>
                    <Text variant="medium14" color={COLORS.blue043142}>
                      {item?.username}
                    </Text>

                    {/* <Text
                    variant="medium12"
                    color={COLORS.grey999999}
                    style={{width: nw(208)}}>
                    Designation
                  </Text> */}
                  </View>

                  <Button
                    text="Remove"
                    variant="outline"
                    width={nw(90)}
                    height={nh(35)}
                    textStyle={{fontSize: 14}}
                    onPress={() => declineRequest(item?.userId)}
                  />
                </View>
              </View>
            );
          }}
        />
      ) : (
        <View>
          <Image
            source={images.norequest}
            resizeMode="contain"
            style={styles.notimage}
          />

          <Text
            variant="semibold20"
            color={COLORS.blue043142}
            style={{textAlign: 'center', marginTop: nh(30)}}>
            No one added in Inner Circle
          </Text>
          <Text
            variant="medium14"
            color={COLORS.grey999999}
            style={{
              textAlign: 'center',
              marginTop: nh(5),
              marginBottom: nh(20),
            }}>
            It’s quiet here. Why not create your first post and share your
            thoughts with the community?
          </Text>
          <Button
            text="View Requests"
            onPress={() => navigation.navigate(Routes.InnerCircleRequest)}
          />
        </View>
      )}
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

export default InnerCircle;

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
