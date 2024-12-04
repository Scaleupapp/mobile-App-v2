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
import CustomTextInput from '../../components/TextInput';

const EditPlayList = ({navigation, route}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="Edit Playlists"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Image source={images.profilebaground} style={styles.images} />
          <CustomTextInput label="Title" />
          <CustomTextInput label="Description" textinputType="L" />
          <CustomTextInput label="Visibility" width={nw(160)} />
          <View style={{marginTop: 20}} />
          <Button text="Save" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditPlayList;

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
    marginBottom: nh(15),
  },
});
