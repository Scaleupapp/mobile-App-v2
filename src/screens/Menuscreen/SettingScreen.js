import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ImageBackground,
  FlatList,
  ScrollView,
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
import Routes from '../../helper/routes';

const Settings = ({navigation, route}) => {
  const menuItems = [
    {
      heading: '',
      data: [
        {
          title: 'Notifications',
          icon: 'bell-icon',
          navKey: 'Notifications',
        },
      ],
    },
    {
      heading: 'Account',
      data: [
        {
          title: 'Change Password',
          icon: 'password-icon',
          navKey: Routes.ChangePassword,
        },
        {title: 'Your Activity', icon: 'activity-icon', navKey: 'YourActivity'},
        {title: 'Language', icon: 'language-icon', navKey: 'Language'},
        {title: 'Theme', icon: 'theme-icon', navKey: 'Theme'},
        {title: 'Block List', icon: 'theme-icon', navKey: Routes.BlockUsers},
      ],
    },
    {
      heading: 'Posts',
      data: [
        {title: 'Saved', icon: 'saved-icon', navKey: Routes.SavePost},
        {title: 'Drafts', icon: 'drafts-icon', navKey: Routes.DraftPost},
        {title: 'Verified', icon: 'verified-icon', navKey: Routes.VerifiedPost},
        {
          title: 'Not Verified',
          icon: 'not-verified-icon',
          navKey: Routes.PendingPost,
        },
        {
          title: 'Post Visibility',
          icon: 'visibility-icon',
          navKey: 'PostVisibility',
        },
        {
          title: 'Performance & Analytics',
          icon: 'analytics-icon',
          navKey: 'PerformanceAnalytics',
        },
      ],
    },
    {
      heading: 'Rewards',
      data: [
        {
          title: 'Achievements',
          icon: 'achievements-icon',
          navKey: 'Achievements',
        },
      ],
    },
    {
      heading: 'Help',
      data: [
        {title: 'Report an Issue', icon: 'report-icon', navKey: 'ReportIssue'},
        {title: 'Help Center', icon: 'help-center-icon', navKey: 'HelpCenter'},
        {title: 'Feedback', icon: 'feedback-icon', navKey: 'Feedback'},
      ],
    },

    {
      heading: '',
      data: [{title: 'Log out', icon: 'logout-icon', navKey: 'Logout'}],
    },
  ];

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
          title="Settings"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {menuItems.map(item => (
          <>
            <Text
              variant="medium12"
              color={COLORS.greyBBBBBB}
              style={{marginLeft: nw(16), marginBottom: nh(15)}}>
              {item?.heading}
            </Text>
            <FlatList
              scrollEnabled={false}
              data={item?.data}
              contentContainerStyle={{marginBottom: nh(15)}}
              renderItem={({item}) => {
                return (
                  <Pressable
                    style={styles.card}
                    onPress={() => navigation.navigate(item?.navKey)}>
                    <View style={{flexDirection: 'row'}}>
                      <View style={styles.image}>
                        <Image
                          source={images.ciclelogo}
                          style={{width: nw(14), height: nh(17)}}
                        />
                      </View>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {item.title}
                      </Text>
                    </View>
                    <Icon
                      type="material"
                      name="keyboard-arrow-right"
                      color={COLORS.grey777777}
                      style={{marginRight: nw(10)}}
                    />
                  </Pressable>
                );
              }}
            />
          </>
        ))}
      </ScrollView>
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

export default Settings;

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
    height: nh(30),
    width: nw(30),
    borderRadius: nh(5),
    marginRight: nw(10),
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // boxShadow: '0 2 5 0 #00000026',

    alignItems: 'center',
    paddingHorizontal: nw(16),
    // borderBottomWidth: 1,
    // borderBottomColor: '#E9E9E9',
    // borderRadius: nh(10),
    // paddingBottom: 15,
    marginBottom: nh(15),

    // paddingTop: nh(22),
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
});
