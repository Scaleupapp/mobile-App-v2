import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import {COLORS} from '../helper/colors';
import Icon from '../helper/icon';
import {nh} from '../helper/scales';

const ToggleWithIconUnderline = ({
  options = [
    {
      type: 'text', // Specifies whether the toggle displays text or an icon
      label: 'All', // Text for this toggle
    },
    {
      type: 'icon', // Specifies this toggle uses icons
      activeIcon: 'bookmark-sharp', // React component for active icon
      inactiveIcon: 'bookmark-outline',
      typeIcon: 'ionicon',
      // React component for inactive icon
    },
    {
      type: 'icon', // Specifies this toggle uses icons
      activeIcon: 'note-edit', // React component for active icon
      inactiveIcon: 'note-edit-outline',
      typeIcon: 'material-community', // React component for inactive icon
    },
    // {
    //   type: 'icon', // Specifies this toggle uses icons
    //   activeIcon: 'check-decagram', // React component for active icon
    //   inactiveIcon: 'check-decagram-outline',
    //   typeIcon: 'material-community',
    //   // React component for inactive icon
    // },
    // {
    //   type: 'icon', // Specifies this toggle uses icons
    //   activeIcon: 'settings-sharp', // React component for active icon
    //   inactiveIcon: 'settings-sharp', // React component for inactive icon
    // },
    // {
    //   type: 'icon', // Specifies this toggle uses icons
    //   activeIcon: 'settings-sharp', // React component for active icon
    //   inactiveIcon: 'settings-sharp', // React component for inactive icon
    // },
    {
      type: 'icon', // Specifies this toggle uses icons
      activeIcon: 'video', // React component for active icon
      inactiveIcon: 'video', // React component for inactive icon
      typeIcon: 'octicons',
    },
  ], // Array of toggle options (objects)
  selectedTextColor = COLORS.yellowF5BE00, // Selected text color
  unselectedTextColor = '#808080', // Unselected text color (gray)
  selectedUnderlineColor = COLORS.yellowF5BE00, // Selected underline color
  unselectedUnderlineColor = '#E9E9E9', // Unselected underline color (light gray)
  selectedUnderlineHeight = 2, // Thickness of selected underline
  unselectedUnderlineHeight = 0, // Thickness of unselected underline
  onToggle = () => {}, // Callback for toggle change
}) => {
  const [selected, setSelected] = useState(0);

  const handleToggle = index => {
    setSelected(index);
    onToggle(index);
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = index === selected;

        return (
          <TouchableOpacity
            key={index}
            style={styles.toggle}
            onPress={() => handleToggle(index)}
            activeOpacity={0.8}>
            {option.type === 'text' ? (
              <Text
                style={[
                  styles.text,
                  {color: isSelected ? selectedTextColor : unselectedTextColor},
                ]}>
                {option.label}
              </Text>
            ) : option.type === 'icon' ? (
              <View>
                {isSelected
                  ? option.activeIcon && (
                      <Icon
                        type={option.typeIcon}
                        name={option.activeIcon}
                        color={COLORS.yellowF5BE00}
                      />
                    )
                  : option.inactiveIcon && (
                      <Icon
                        type={option.typeIcon}
                        name={option.inactiveIcon}
                        color={COLORS.grey999999}
                      />
                    )}
              </View>
            ) : null}
            <View
              style={[
                styles.underline,
                {
                  backgroundColor: isSelected
                    ? selectedUnderlineColor
                    : unselectedUnderlineColor,
                  height: isSelected
                    ? selectedUnderlineHeight
                    : unselectedUnderlineHeight,
                  borderRadius: isSelected ? 5 : 0,
                  marginTop: isSelected ? nh(9) : nh(10),
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: nh(30),
  },
  toggle: {
    flex: 1, // Each toggle takes equal space
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4, // Space between text and underline
  },
  underline: {
    width: '100%', // Full width underline
  },
});

export default ToggleWithIconUnderline;
