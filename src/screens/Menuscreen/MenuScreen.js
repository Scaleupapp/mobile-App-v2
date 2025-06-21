import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  Alert,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import Text from '../../components/Text';
import Icon from '../../helper/icon';
import {FlatList} from 'react-native-gesture-handler';
import Routes from '../../helper/routes';
import {logoutUser} from '../../helper/commonFunctions';
import mixpanel from '../../helper/mixpanelClient';

const MenuScreen = ({navigation, route}) => {
  const menu = [
    {
      title: 'Learning Intelligence',
      nav: Routes.LearningIntelligenceHub,
      subtitle: 'AI insights, knowledge vault & analytics',
    },
    /*
    {
      title: 'Areas of Improvement',
      nav: Routes.AreasOfImprovement,
     
    },
    {
      title: 'My AI Vault',
      nav: Routes.LearningVault,
     
    },
    */
    {
      title: 'My Badge',
      nav: Routes.MyBadge,
    },
    {
      title: 'My Profile',
      nav: Routes.MyProfile,
    },
    {
      title: 'My Inner Circle',
      nav: Routes.InnerCircleRequest,
    },
    /*
    {
      title: 'Performance & Analytics',
      nav: Routes.UserAnalyticsPerf,
    },
    */
    {
      title: 'Help Centre',
      nav: Routes.HelpScreen,
    },
    {
      title: 'Settings',
      nav: Routes.Settings,
    },
  ];

  const Card = ({item}) => {
    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          mixpanel.track(`Click on ${item?.title}`);
          if (item?.title === 'Logout') {
            Alert.alert(
              'Logout',
              'Are you sure you want to log out?',
              [
                {
                  text: 'Cancel',
                  onPress: () => {},
                  style: 'cancel',
                },
                {
                  text: 'Yes',
                  onPress: () => logoutUser(),
                },
              ],
              {cancelable: true},
            );
          } else {
            navigation.navigate(item.nav);
          }
        }}>
        <View style={styles.cardContent}>
          <Text
            variant="medium14"
            color={COLORS.grey777777}
            style={{marginLeft: nw(46)}}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text
              variant="regular11"
              color={COLORS.grey999999}
              style={{marginLeft: nw(46), marginTop: 2}}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <Icon
          type="material"
          name="keyboard-arrow-right"
          color={COLORS.grey777777}
          style={{marginRight: nw(10)}}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="" rightIcon={false} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <View>
            <FlatList
              data={menu}
              renderItem={({item}) => <Card item={item} />}
            />
          </View>
          <Card
            item={{
              title: 'Logout',
              nav: '',
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MenuScreen;

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
  card: {
    marginBottom: nh(15),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: nh(10),
    minHeight: nh(40),
    backgroundColor: COLORS.whiteFFFFFF,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    elevation: 3,
    paddingVertical: nh(8),
  },
  cardContent: {
    flex: 1,
  },
});