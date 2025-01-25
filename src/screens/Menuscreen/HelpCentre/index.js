import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  FlatList,
} from 'react-native';
import {COLORS} from '../../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../../helper/scales';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import Routes from '../../../helper/routes';
import Strings from '../../../helper/strings';
import ConfirmDelete from '../ConfirmDelete';

const HelpScreen = ({navigation, route}) => {
  const [open, setOpen] = useState(false);
  const menu = [
    {
      title: 'FAQs',
      subTitle: 'Find answers to your queries instantly',
      nav: () =>
        navigation.navigate(Routes.Terms, {title: 'FAQs', body: Strings.FAQs}),
    },
    {
      title: 'Terms of Use',
      subTitle: 'Learn more about ScaleUp',
      nav: () =>
        navigation.navigate(Routes.Terms, {
          title: 'Terms of Use',
          body: Strings.Terms,
        }),
    },
    {
      title: 'Privacy Policy',
      subTitle: 'We respect your data',
      nav: () =>
        navigation.navigate(Routes.Terms, {
          title: 'Privacy Policy',
          body: Strings.privacy,
        }),
    },
    {
      title: 'Platform Guidelines',
      subTitle: 'Maintaining the authenticity of ScaleUp',
      nav: () =>
        navigation.navigate(Routes.Terms, {
          title: 'Platform Guidelines',
          body: Strings.guidelines,
        }),
    },
    {
      title: 'Delete Account',
      subTitle: 'Is there a problem? Get solution instantly',
      nav: () => setOpen(true),
    },
  ];
  const Card = ({item}) => {
    return (
      <Pressable style={styles.card} onPress={item.nav}>
        <View>
          <Text
            variant="medium14"
            color={COLORS.grey777777}
            style={{marginLeft: nw(46)}}>
            {item.title}
          </Text>
          <Text
            variant="medium12"
            color={COLORS.grey777777}
            style={{marginLeft: nw(46)}}>
            {item.subTitle}
          </Text>
        </View>
        {/* <Icon
          type="material"
          name="keyboard-arrow-right"
          color={COLORS.grey777777}
          style={{marginRight: nw(10)}}
        /> */}
      </Pressable>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="Help Centre" />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList data={menu} renderItem={({item}) => <Card item={item} />} />
        </View>
      </View>
      <ConfirmDelete isVisible={open} setvisibleModal={setOpen} />
    </SafeAreaView>
  );
};

export default HelpScreen;

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
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    borderRadius: nh(10),
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: nh(15),
    paddingVertical: nh(10),
    backgroundColor: COLORS.whiteFFFFFF,
    elevation: 3,
  },
});
