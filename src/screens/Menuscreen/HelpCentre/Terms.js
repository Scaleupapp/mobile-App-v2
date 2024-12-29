import {
  ScrollView,
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import React from 'react';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import {COLORS} from '../../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../../helper/scales';

const Terms = ({route}) => {
  const {title, body} = route?.params;

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title={title} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView
            style={{flexGrow: 1}}
            contentContainerStyle={{justifyContent: 'space-between'}}>
            <Text variant="semibold18" style={styles.txt}>
              {'Welcome to ScaleUp!'}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 20,
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                marginBottom: 50,
              }}>
              <Text
                variant="semibold14"
                style={[styles.txt, {textAlign: 'left'}]}>
                {body}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    height: nh(40),
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    borderRadius: nh(10),
    width: DEVICE_WIDTH - nw(32),
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: nh(15),
  },
  main: {
    flex: 1,
    backgroundColor: COLORS.blue043142,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  txt: {
    color: COLORS.black333333,
    alignSelf: 'center',
    marginTop: 20,
  },
});

export default Terms;
