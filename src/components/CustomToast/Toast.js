// Toast.js
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {COLORS} from '../../helper/colors';
import {APP_FONTS} from '../../assets/fonts';
import Icon from '../../helper/icon';
import {nh} from '../../helper/scales';

const Toast = ({visible, message}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      isVisible={visible}
      animationIn={'zoomIn'}
      animationOut={'zoomOut'}
      animationInTiming={100}
      animationOutTiming={500}>
      <View
        style={{
          backgroundColor: COLORS.whiteFFFFFF,
          borderRadius: 8,
          position: 'absolute',
          width: '100%',
          ...(message?.position == 'top' ? {top: 50} : {bottom: 50}),
          paddingVertical: 12,
          alignItems: 'center',
          flexDirection: 'row',
        }}>
        <Icon
          type={'antdesign'}
          color={
            message?.type == 'success' ? COLORS.green34A853 : COLORS.redEA4335
          }
          name={message?.type == 'success' ? 'checkcircle' : 'closecircle'}
          size={nh(22)}
          style={{
            marginHorizontal: 10,
          }}
        />

        <Text style={styles.toastText}>{message?.title}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  toastText: {
    color: COLORS.black333333,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: APP_FONTS.PoppinsMedium,
    letterSpacing: 0.3,
  },
});

export default Toast;
