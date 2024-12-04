import React, {useState} from 'react';
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

const InnerCircleRequest = ({navigation, route}) => {
  const [selected, setSelected] = useState(0);
  const onSelect = number => {
    setSelected(number);
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
          title="Inner Circle Requests"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View>

      <View>
        <View style={{marginHorizontal: nw(16), marginBottom: nh(8)}}>
          <ToggleWithUnderline
            options={['RECEIVED', 'SENT']}
            onToggle={number => onSelect(number)}
          />
        </View>
      </View>
      {selected == 0 && (
        <FlatList
          data={['', '', '', '', '']}
          renderItem={() => {
            return (
              <View>
                <View style={styles.card}>
                  <Image source={images.ciclelogo} style={styles.image} />
                  <View>
                    <Text variant="medium14" color={COLORS.blue043142}>
                      Name
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '90%',
                      }}>
                      <Text
                        variant="medium12"
                        color={COLORS.grey999999}
                        style={{width: nw(208)}}>
                        wants to be a part of your Inner Circle
                      </Text>

                      <Icon
                        type="antdesign"
                        name="closecircle"
                        color={COLORS.redEA4335}
                        size={25}
                      />
                      <Icon
                        type="antdesign"
                        name="checkcircle"
                        color={COLORS.green34A853}
                        size={25}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
      {selected == 1 && (
        <FlatList
          data={['', '', '', '', '']}
          renderItem={() => {
            return (
              <View>
                <View style={styles.card}>
                  <Image source={images.ciclelogo} style={styles.image} />
                  <View>
                    <View
                      style={{
                        width: '90%',
                      }}>
                      <View
                        style={{
                          width: '65%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <Text variant="medium14" color={COLORS.blue043142}>
                          Name
                        </Text>
                        <Text variant="medium12" color={COLORS.blue043142}>
                          28/04/24
                        </Text>
                      </View>
                      <Text
                        variant="medium12"
                        color={COLORS.grey999999}
                        style={{width: '70%'}}>
                        Lorem ipsum dolor sit amet, con sectetur adipiscing
                        elit, sit amet, con sectetur
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
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

export default InnerCircleRequest;

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
});
