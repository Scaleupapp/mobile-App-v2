import {Dimensions, PixelRatio, Platform} from 'react-native';

const {width, height} = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const normalize = (size: number) =>
  PixelRatio.roundToNearestPixel(size * (width / guidelineBaseWidth));
export const nh = (size: number) =>
  PixelRatio.roundToNearestPixel(size * (height / guidelineBaseHeight));
export const nw = (size: number) =>
  PixelRatio.roundToNearestPixel(size * (width / guidelineBaseWidth));
export const DEVICE_WIDTH = width;
export const DEVICE_HEIGHT = height;
export const isAndroid = Platform.OS === 'android';
