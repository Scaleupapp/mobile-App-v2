import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ScrollView,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {images} from '../../assets/images';
import Text from '../../components/Text';
import Button from '../../components/Button';

import AllPostoption from './AllPostoption';

const MyProfile = ({navigation, route}) => {
  let type = 'user';
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="My Profile"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView>
            <Image source={images.profilebaground} style={styles.images} />
            <Image
              source={images.ciclelogo}
              style={styles.imagecircle}
              resizeMode="cover"
            />

            <Text
              variant="semibold20"
              color={COLORS.blue043142}
              style={{textAlign: 'center'}}>
              Sophie Turner
            </Text>

            <Text
              variant="medium16"
              color={COLORS.grey777777}
              style={{textAlign: 'center'}}>
              Sophie Turner
            </Text>
            <Text
              variant="medium12"
              color={COLORS.grey999999}
              style={{textAlign: 'center', marginBottom: nh(20)}}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt
            </Text>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'center',
              }}>
              {['', '', ''].map(() => (
                <View style={styles.yellowview}>
                  <Text variant="medium12" color={COLORS.blue043142}>
                    Design
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
              <View style={{alignItems: 'center'}}>
                <Text variant="bold20" color={COLORS.blue043142}>
                  100
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  posts
                </Text>
              </View>
              <View style={{alignItems: 'center'}}>
                <Text variant="bold20" color={COLORS.blue043142}>
                  1000
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  followers
                </Text>
              </View>
              <View style={{alignItems: 'center'}}>
                <Text variant="bold20" color={COLORS.blue043142}>
                  1000
                </Text>
                <Text variant="medium16" color={COLORS.blue043142}>
                  following
                </Text>
              </View>
            </View>
            {type == 'user' ? (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: nh(30),
                  justifyContent: 'space-between',
                }}>
                <Button text="Edit Profile" width={nw(283)} />
                <Button justIcon={'settings-sharp'} width={50} />
              </View>
            ) : (
              <View style={{marginTop: nh(30)}}>
                <Button text="Follow" />
              </View>
            )}
            <AllPostoption type={type} />
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
    height: nh(100),
    width: nw(100),
    borderRadius: nh(50),
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
