import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {Image} from 'react-native';
import Text from '../../components/Text';
import Routes from '../../helper/routes';

const Conversation = ({navigation, route}) => {
  const Card = () => {
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate(Routes.Chat)}>
        <Image source={{uri: ''}} style={styles.image} />
        <View style={{flex: 9}}>
          <Text variant="medium12" color={COLORS.blue043142}>
            Ankita
          </Text>
          <Text variant="medium12" color={COLORS.grey999999}>
            shhhdhdhhdhd dhhdh fff
          </Text>
        </View>
        <View style={{flex: 3, alignItems: 'center'}}>
          <Text variant="medium12" color={COLORS.blue043142}>
            09:10am
          </Text>
          <View
            style={{
              height: nh(20),
              minWidth: nh(20),
              borderRadius: nh(10),
              backgroundColor: '#34A853',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: nw(5),
            }}>
            <Text variant="medium12" color={COLORS.whiteFFFFFF}>
              5
            </Text>
          </View>
        </View>
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
      <Header
        title="Chat"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList data={['', '', '', '']} renderItem={() => <Card />} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Conversation;

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
    marginBottom: nh(15),
    alignItems: 'center',
    flex: 1,
  },
});
