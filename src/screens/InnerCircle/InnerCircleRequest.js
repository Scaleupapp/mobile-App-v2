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
  myInnerCircleRequestAPI,
  widrawInnerCircleRequestAPI,
} from '../../services/apiService';
import Routes from '../../helper/routes';

const InnerCircleRequest = ({navigation, route}) => {
  const [innerCircle, setInnerCircle] = useState([]);
  const [sent, setSentRequest] = useState([]);

  useEffect(() => {
    getInnerCircleList();
  }, []);

  let getInnerCircleList = async () => {
    try {
      let resp = await myInnerCircleRequestAPI();
      setInnerCircle(resp?.data?.reqReceived);
      setSentRequest(resp?.data?.reqSent);
      console.log(resp?.data, 'myInnerCircleRequestAPI');
    } catch (error) {
      console.log(error, 'rerrr');
    }
  };

  const [selected, setSelected] = useState(0);
  const onSelect = number => {
    setSelected(number);
  };

  let acceptRequest = async (id, type) => {
    try {
      let payload = {
        requestId: id,
        action: type,
      };
      let resp = await acceptInnerCircleRequestAPI(payload);
      console.log('🚀 ~ acceptRequest ~ resp:', resp?.data);
      let data = innerCircle.filter(user => user.id !== id);
      setInnerCircle(data);
    } catch (error) {}
  };

  const Widraw = async id => {
    try {
      let payload = {
        requestId: id,
      };
      // console.log('🚀 ~ InnerCircleRequest ~ payload:', payload);
      // let res = await widrawInnerCircleRequestAPI(payload);
      let data = sent?.filter(user => user.id !== id);
      setSentRequest(data);
      // console.log('🚀 ~ InnerCircleRequest ~ res:', res?.data);
    } catch (error) {}
  };

  const RequestView = ({item}) => {
    return (
      <View>
        <View style={styles.card}>
          <Image source={{uri: item?.profilePicture}} style={styles.image} />
          <View>
            <Text variant="medium14" color={COLORS.blue043142}>
              {item?.username}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '90%',
              }}>
              <Text
                variant="medium12"
                color={COLORS.grey999999}
                style={{width: nw(208)}}>
                wants to be a part of your Inner Circle
              </Text>

              <Icon
                type="antdesign"
                name="closecircle"
                color={COLORS.redEA4335}
                size={25}
                onPress={() => acceptRequest(item?.id, 'reject')}
              />
              <Icon
                type="antdesign"
                name="checkcircle"
                color={COLORS.green34A853}
                size={25}
                onPress={() => acceptRequest(item?.id, 'accept')}
              />
            </View>
          </View>
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
          title="Inner Circle Requests"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      {/* <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View> */}

      <View>
        <View style={{marginHorizontal: nw(16), marginBottom: nh(8)}}>
          <ToggleWithUnderline
            options={['RECEIVED', 'SENT']}
            onToggle={number => onSelect(number)}
          />
        </View>
      </View>
      {selected == 0 && innerCircle?.length > 0 ? (
        <FlatList
          data={innerCircle}
          renderItem={({item}) => <RequestView item={item} />}
        />
      ) : (
        selected == 0 && (
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
              No Inner Circle Requests Received
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
              text="Explore Content"
              onPress={() => navigation.navigate(Routes.Home)}
            />
          </View>
        )
      )}
      {selected == 1 && sent?.length > 0 ? (
        <FlatList
          data={sent}
          renderItem={({item}) => {
            console.log('🚀 ~ InnerCircleRequest ~ item:', item);
            return (
              <View>
                <View style={styles.card}>
                  <Image
                    source={{uri: item?.profilePicture}}
                    style={styles.image}
                  />
                  <View>
                    <View
                      style={{
                        width: '90%',
                      }}>
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <Text variant="medium14" color={COLORS.blue043142}>
                          {item?.username}
                        </Text>
                        <Text variant="medium12" color={COLORS.blue043142}>
                          {item?.Timestamp}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <Text
                          variant="medium12"
                          color={COLORS.grey999999}
                          style={{width: '70%'}}>
                          {item?.status}
                        </Text>
                        <Button
                          onPress={() => Widraw(item.id)}
                          height={25}
                          width={90}
                          variant="outline"
                          text="Widraw"
                          textStyle={{fontSize: nh(12)}}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      ) : (
        selected == 1 && (
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
              No Inner Circle Requests Sent
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
              text="Send Requests"
              // onPress={() => navigation.navigate(Routes.Home)}
            />
          </View>
        )
      )}
    </SafeAreaView>
  );
};

export default InnerCircleRequest;

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
    borderColor: COLORS.grey777777,
    borderWidth: 1,
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
