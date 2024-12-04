import React from 'react';
import {View, StyleSheet} from 'react-native';
import {nh, nw} from '../helper/scales';
import {COLORS} from '../helper/colors';
import Text from './Text';

export const PostCard = ({item}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardimage}>
        {/* <Image
          source={item.image}
          style={{height: nh(29), width: nw(29)}}
          resizeMode="contain"
        /> */}
      </View>
      <View>
        <Text
          variant="semibold14"
          color={COLORS.blue043142}
          style={{marginBottom: 2, marginTop: -10}}>
          {item?.title}
        </Text>
        <Text
          variant="medium12"
          color={COLORS.grey999999}
          style={{marginBottom: 2}}>
          {item?.description}
        </Text>
        <Text variant="medium12" color={COLORS.grey999999}>
          {item?.posted}
        </Text>
      </View>
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 12,
          backgroundColor: item?.verified
            ? '#D6EEDD'
            : 'rgba(251, 217, 215, 1)',
          // rgba(214, 238, 221, 1)
          alignItems: 'center',
          borderRadius: 5,
          position: 'absolute',
          bottom: -10,
          right: 0,
        }}>
        <Text
          variant="medium12"
          color={item?.verified ? COLORS.green34A853 : COLORS.redEA4335}>
          {item?.verifiedon}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: nh(90),
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    borderRadius: 8,
    marginBottom: nh(40),
    padding: nh(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardimage: {
    height: nh(70),
    width: nh(70),
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(10),
  },
});
