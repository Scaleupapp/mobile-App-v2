import React from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import Text from '../../components/Text';
import Button from '../../components/Button';

const CreatePost = ({navigation, route}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="New Post"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <CustomTextInput label="Heading" />
          <CustomTextInput label="Topics (Press comma after every category)" />
          <CustomTextInput label="label" textinputType="L" />
          <CustomTextInput label="Hashtags (Add # before each word)" />
          <Text variant="medium14" color={COLORS.greyBBBBBB}>
            Upload Image/Video/Doc/GIF
          </Text>
          <View style={{marginTop: nh(10), width: nw(96)}}>
            <Button
              leftIcon={'upload'}
              text="Upload"
              variant="outline"
              width={nw(96)}
              height={nh(35)}
              textStyle={{fontSize: 14}}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              width: DEVICE_WIDTH / 2 - 30,
              justifyContent: 'space-between',
              marginTop: nh(30),
            }}>
            <Button
              variant="outline"
              text="Cancel"
              width={nw(85)}
              height={nh(35)}
              textStyle={{fontSize: 14}}
            />
            <Button
              text="Next"
              width={nw(65)}
              height={nh(35)}
              textStyle={{fontSize: 14}}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreatePost;

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
    borderTopRightRadius: nh(25),
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
});
