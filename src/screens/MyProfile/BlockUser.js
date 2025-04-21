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
import {blockUSerList, userUnBlock} from '../../services/apiService';

const BlockUsers = ({navigation, route}) => {
  const [pofileData, setProfileData] = useState([]);

  useEffect(() => {
    blockUSerList().then(res => {
      console.log('🚀 ~ blockUSerList ~ res:', res.data);
      setProfileData(res?.data);
    });
  }, []);

  const unBlockUesrList = item => {
    userUnBlock(item).then(res => {
      blockUSerList().then(res => {
        setProfileData(res?.data);
      });
    });
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
          title="Blocked Users"
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
        data={pofileData}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => {
          return (
            <View key={index}>
              <View style={styles.card}>
                {item?.profilePicture ? (
                  <Image
                    source={{uri: item?.profilePicture}}
                    style={styles.image}
                  />
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

                <View style={{width: nw(195)}}>
                  <Text variant="medium14" color={COLORS.blue043142}>
                    {item?.username}
                  </Text>

                  {/* <Text
                    variant="medium12"
                    color={COLORS.grey999999}
                    style={{width: nw(208)}}>
                    {item?.type}
                  </Text> */}
                </View>

                <Button
                  onPress={() => {
                    unBlockUesrList(item?._id);
                  }}
                  text="Unblock"
                  variant="outline"
                  width={nw(90)}
                  height={nh(35)}
                  textStyle={{fontSize: 14}}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text
              style={{
                color: COLORS.gray_color,
                width: '100%',
                textAlign: 'center',
                fontSize: 20,
                fontWeight: '500',
              }}>
              {'No Blocked Users Found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default BlockUsers;

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
    width: nw(50),
    borderRadius: nh(25),
    marginRight: 10,
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
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
});
