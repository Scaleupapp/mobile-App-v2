import React from 'react';
import {View, StyleSheet} from 'react-native';
import {nh, nw} from '../helper/scales';
import {COLORS} from '../helper/colors';
import Text from './Text';
import Icon from '../helper/icon';
import {navigationRef} from '../../App';
import Routes from '../helper/routes';
import {useNavigation} from '@react-navigation/native';

export const VideoCard = ({item, fullpage, tick}) => {
  const navigation = useNavigation();
  return (
    <View style={styles.card}>
      <View style={{flexDirection: 'row'}}>
        {fullpage && (
          <Icon
            type="ionicon"
            name="reorder-two"
            size={21}
            color={COLORS.blue043142}
            style={{marginRight: nw(10)}}
          />
        )}
        <View style={styles.cardimage}>
          {/* <Image
          source={item.image}
          style={{height: nh(29), width: nw(29)}}
          resizeMode="contain"
        /> */}
        </View>
        <View>
          <Text variant="semibold14" color={COLORS.blue043142}>
            {item?.title}
          </Text>
          <Text
            variant="medium12"
            color={COLORS.grey777777}
            style={{marginBottom: 2}}>
            {item?.description}
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            {item?.posted}
          </Text>
        </View>
      </View>
      {tick ? (
        <Icon
          type="material-community"
          name="checkbox-blank-outline"
          size={21}
          color={COLORS.blue043142}
          onPress={() => navigation.navigate(Routes.MyPlaylist)}
        />
      ) : (
        <Icon
          type="entypo"
          name="dots-three-vertical"
          size={21}
          color={COLORS.blue043142}
          onPress={() => navigation.navigate(Routes.MyPlaylist)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: nh(85),
    // boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    // borderWidth: 1,
    // borderColor: 'rgba(214, 214, 214, 0.2)',
    borderRadius: 8,
    marginBottom: nh(15),
    // padding: nh(10),
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardimage: {
    height: nh(85),
    width: nh(150),
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(12),
  },
});
