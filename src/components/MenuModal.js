import React from 'react';
import {FlatList, Image, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../helper/colors';
import Text from './Text';
import Modal from 'react-native-modal';
import {nh, nw} from '../helper/scales';
import Icon from '../helper/icon';

export const MenuModal = ({visible, setVisible, menuItems, style = false}) => {
  const modalStyle = {
    position: 'absolute',
    top: nh(70),
    right: nh(20),
  };

  const renderMenuItem = ({item}) => (
    <TouchableOpacity
      onPress={() => item?.onPress()}
      style={{flexDirection: 'row', marginTop: nh(16)}}>
      {item?.icon ? (
        <Icon
          name={item.icon}
          size={19}
          color={COLORS.grey999999}
          style={{marginRight: 7}}
        />
      ) : null}
      {item?.image ? (
        <Image
          // tintColor={'black'}
          source={item.image}
          style={{marginRight: 7, height: 19, width: 19}}
        />
      ) : null}
      <Text variant="medium12" color={COLORS.black333333}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      isVisible={visible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      transparent={true}
      style={style ? style : modalStyle}
      onBackdropPress={() => setVisible(false)}
      onRequestClose={() => setVisible(false)} // To handle back press or close
    >
      <View
        style={{
          backgroundColor: COLORS.whiteFFFFFF,
          flex: 1,
          // width: nw(250),
          // height: nh(187),
          paddingHorizontal: nw(16),
          paddingBottom: nh(16),
          borderRadius: 8,
          boxShadow: '2 4 4 0 rgba(0, 0, 0, 0.15)',
        }}>
        <View style={{}}>
          <FlatList
            data={menuItems}
            renderItem={renderMenuItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </View>
    </Modal>
  );
};
