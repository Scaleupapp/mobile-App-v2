import React, {forwardRef, useMemo, useState} from 'react';
import {ActivityIndicator, Image} from 'react-native';
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
import Video from 'react-native-video';
import {View} from 'react-native';

const ImageModal = forwardRef(({type, URL}, ref) => {
  const snapPoints = useMemo(() => ['100%'], []);
  const [videoDimensions, setVideoDimensions] = useState({width: 0, height: 0});
  const [loading, setLoading] = useState(type == 'Video' ? true : false);

  const onLoad = data => {
    const {width, height} = data.naturalSize;
    setLoading(false);
    setVideoDimensions({width, height});
  };

  if (!URL) return;

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
        {loading ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}>
            <ActivityIndicator size="large" color={COLORS.black333333} />
          </View>
        ) : (
          <>
            {type == 'Video' ? (
              <Video
                controls
                onLoad={onLoad}
                source={{uri: URL}}
                style={
                  videoDimensions?.height
                    ? {
                        aspectRatio: Number(
                          videoDimensions.width / videoDimensions.height,
                        ),
                        width: DEVICE_WIDTH,
                        backgroundColor: COLORS.whiteFFFFFF,
                      }
                    : {
                        height: DEVICE_HEIGHT,
                        width: DEVICE_WIDTH,
                        backgroundColor: COLORS.whiteFFFFFF,
                      }
                }
                resizeMode="cover"
                onBuffer={e => console.log('bufeer ', e)}
                onError={e => console.log('sdsds ', e)}
              />
            ) : (
              <Image
                source={{uri: URL}}
                style={{
                  height: DEVICE_HEIGHT,
                  width: DEVICE_WIDTH,
                  resizeMode: 'contain',
                }}
              />
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ImageModal;
