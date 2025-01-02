import React from 'react';
import {View, StyleSheet} from 'react-native';
import {nh, nw} from '../helper/scales';
import {COLORS} from '../helper/colors';
import Text from './Text';
import Icon from '../helper/icon';

export const Card = ({
  title,
  subtitle,
  text1,
  text2,
  checked,
  onEdit,
  onDelete,
  type = '',
}) => {

  const getStatusText = (type, checked) => {
    if (type === 'work') {
      return checked ? 'Worked' : 'Working';
    } else if (type === 'education') {
      return checked ? 'Completed' : 'Pursuing';
    } else {
      return checked ? 'Completed' : 'Pursuing';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardimage}>
        <Icon
          type={type == 'work' || type == 'project' ? 'antdesign' : 'entypo'}
          name={
            type == 'work'
              ? 'profile'
              : type == 'project'
              ? 'filetext1'
              : 'graduation-cap'
          }
          size={28}
          color={COLORS.blue043142}
        />
      </View>
      <View>
        <Text variant="semibold14" color={COLORS.blue043142}>
          {title}
        </Text>
        <Text
          variant="medium12"
          color={COLORS.blue043142}
          style={{width: nw(250)}}
          numberOfLines={1}>
          {subtitle}
        </Text>
        <Text variant="medium12" color={COLORS.grey999999}>
          {text1} {text2 && '|'} {text2}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          top: 5,
          right: 5,
          flexDirection: 'row',
          width: nw(40),
          // backgroundColor: 'red',
          justifyContent: 'space-between',
        }}>
        <Icon
          onPress={onEdit}
          type={'feather'}
          // type={'antdesign'}
          // color={COLORS.grey646464}
          name={'edit'}
          size={nw(15)}
        />
        <Icon
          onPress={onDelete}
          type={'antdesign'}
          // type={'feather'}
          // color={COLORS.grey646464}
          name={'delete'}
          size={nw(15)}
        />
      </View>
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 12,
          backgroundColor: checked ? '#D6EEDD' : 'rgba(251, 217, 215, 1)',
          // rgba(214, 238, 221, 1)
          alignItems: 'center',
          borderRadius: 5,
          position: 'absolute',
          bottom: -10,
          right: 0,
        }}>
        <Text
          variant="medium12"
          color={checked ? COLORS.green34A853 : COLORS.redEA4335}>
          {getStatusText(type, checked)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: nh(80),
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    borderRadius: 8,
    marginBottom: nh(15),
    padding: nh(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardimage: {
    height: nh(50),
    width: nh(50),
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(10),
  },
});
