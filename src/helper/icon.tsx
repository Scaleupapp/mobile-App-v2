import React, {memo} from 'react';
import {GestureResponderEvent, TouchableOpacity, ViewStyle} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Zocial from 'react-native-vector-icons/Zocial';
import Fontisto from 'react-native-vector-icons/Fontisto';

type IconType =
  | 'font-awesome'
  | 'font-awesome-5'
  | 'ionicon'
  | 'material'
  | 'feather'
  | 'antdesign'
  | 'entypo'
  | 'material-community'
  | 'foundation'
  | 'evil-icons'
  | 'simple-line'
  | 'octicons'
  | 'zocial'
  | 'fontisto';

interface IconProps {
  name: string;
  type: IconType;
  size?: number;
  color?: string;
  onPress?: ((event: GestureResponderEvent) => void) | null;
  style?: ViewStyle;
}

const Icon = ({
  name,
  type,
  size = 24,
  color = '#000',
  onPress,
  style,
}: IconProps) => {
  let IconComponent: React.ElementType;

  switch (type) {
    case 'font-awesome':
      IconComponent = FontAwesome;
      break;
    case 'font-awesome-5':
      IconComponent = FontAwesome5;
      break;
    case 'ionicon':
      IconComponent = Ionicons;
      break;
    case 'material':
      IconComponent = MaterialIcons;
      break;
    case 'feather':
      IconComponent = Feather;
      break;
    case 'antdesign':
      IconComponent = AntDesign;
      break;
    case 'entypo':
      IconComponent = Entypo;
      break;
    case 'material-community':
      IconComponent = MaterialCommunityIcons;
      break;
    case 'foundation':
      IconComponent = Foundation;
      break;
    case 'evil-icons':
      IconComponent = EvilIcons;
      break;
    case 'simple-line':
      IconComponent = SimpleLineIcons;
      break;
    case 'octicons':
      IconComponent = Octicons;
      break;
    case 'zocial':
      IconComponent = Zocial;
      break;
    case 'fontisto':
      IconComponent = Fontisto;
      break;
    default:
      IconComponent = Ionicons; // Default to Ionicons if no type is specified
      break;
  }

  return (
    <TouchableOpacity
      disabled={onPress ? false : true}
      onPress={onPress}
      style={style}>
      <IconComponent name={name} size={size} color={color} type={type} />
    </TouchableOpacity>
  );
};

export default memo(Icon);
