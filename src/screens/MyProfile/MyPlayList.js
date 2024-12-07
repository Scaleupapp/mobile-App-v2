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
import {VideoList} from './VideoList';
import {navigationRef} from '../../../App';

const MyPlaylist = ({navigation, route}) => {
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
        onBackPress={() => navigation.goBack()}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView>
            <Image source={images.profilebaground} style={styles.images} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              UI/UX Design
            </Text>
            <Text
              variant="medium12"
              color={COLORS.grey999999}
              style={{marginBottom: nh(20)}}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt
            </Text>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: nh(30),
                justifyContent: 'space-between',
              }}>
              <Button text="Play All" width={nw(163)} />
              <Button
                justIcon={'settings-sharp'}
                width={nw(50)}
                onPress={() => navigationRef.navigate('EditPlayList')}
              />
              <Button
                justIcon={'settings-sharp'}
                width={nw(50)}
                onPress={() => navigationRef.navigate('NewPlayList')}
              />
              <Button justIcon={'settings-sharp'} width={nw(50)} />
            </View>
            <VideoList fullpage={true} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MyPlaylist;

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
    marginBottom: nh(10),
  },
});
