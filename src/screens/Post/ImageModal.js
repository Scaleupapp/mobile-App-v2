import React, {forwardRef, useMemo} from 'react';
import {Image} from 'react-native';
import {COLORS} from '../../helper/colors';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import Icon from '../../helper/icon';
import {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
  isAndroid,
  nh,
  nw,
} from '../../helper/scales';

const ImageModal = forwardRef(({imageUrl}, ref) => {
  const snapPoints = useMemo(() => ['100%'], []);
  if (!imageUrl) return;
  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      handleComponent={null}
      animateOnMount={false}
      containerStyle={{borderTopLeftRadius: 24}}
      style={{borderRadius: 24, overflow: 'hidden'}}>
      <BottomSheetView
        style={{
          flex: 1,
          backgroundColor: COLORS.whiteFFFFFF,
          alignItems: 'center',
          justifyContent: 'center',
          height: DEVICE_HEIGHT,
          width: DEVICE_WIDTH,
        }}>
        <Icon
          type={'antdesign'}
          color={COLORS.grey777777}
          name="close"
          size={nh(26)}
          style={{
            position: 'absolute',
            top: nh(isAndroid ? 10 : 50),
            right: nw(10),
            zIndex: 1,
          }}
          onPress={() => ref?.current?.close()}
        />
        <Image
          source={{uri: imageUrl}}
          style={{
            height: DEVICE_HEIGHT,
            width: DEVICE_WIDTH,
            resizeMode: 'contain',
          }}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ImageModal;
