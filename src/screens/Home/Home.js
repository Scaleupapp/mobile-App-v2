// import {StyleSheet, Text, View} from 'react-native';
// import React from 'react';
// import {logoutUser} from '../../helper/commonFunctions';

// type Props = {};

// const Home = (props: Props) => {
//   return (
//     <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
//       <Text>Home</Text>
//       <Text onPress={logoutUser}>Logout</Text>
//     </View>
//   );
// };

// export default Home;

// const styles = StyleSheet.create({});

import React from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {FlatList} from 'react-native-gesture-handler';
import {images} from '../../assets/images';
import {Image} from 'react-native';
import Post from './Post';

const Home = ({navigation, route}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <MainHeader />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Text variant="semibold16" style={{paddingLeft: nw(16)}}>
            Announcements
          </Text>
          <View style={{height: nh(70)}}>
            <FlatList
              data={['', '', '', '', '', '', '', '', '', '', '', '', '', '']}
              horizontal
              contentContainerStyle={{paddingLeft: nw(16), marginTop: nh(15)}}
              showsHorizontalScrollIndicator={false}
              renderItem={({}) => {
                return (
                  <Image
                    source={images.ciclelogo}
                    style={{
                      height: nh(50),
                      width: nw(50),
                    }}
                    resizeMode="contain"
                  />
                );
              }}
            />
          </View>
          <Text variant="semibold16">Post</Text>
          <Post />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Home;

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
    // paddingHorizontal: nw(16),
    paddingTop: nh(20),
  },
});
