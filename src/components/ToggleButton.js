import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, View, Animated} from 'react-native';
import {COLORS} from '../helper/colors';

const SquareToggle = ({
  selected = 0,

  options = ['Option 1', 'Option 2', 'Option 3'], // Toggle options
  selectedColor = COLORS.whiteFFFFFF, // Selected text color
  unselectedColor = COLORS.yellowF5BE00, // Unselected text color
  selectedBackgroundColor = COLORS.yellowF5BE00, // Selected background color
  unselectedBackgroundColor = '#ffffff', // Unselected background color
  onToggle = () => {}, // Callback for toggle change
  marginBottom = 30,
}) => {
  const handleToggle = index => {
    onToggle(index);
  };

  return (
    <View style={[styles.container, {marginBottom: marginBottom}]}>
      {options.map((option, index) => {
        const isSelected = index === selected;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.toggle,
              isSelected && {
                borderRadius: 4,
                boxShadow: '2 2 5 0  rgba(0, 0, 0, 0.1)',
              },
              {
                backgroundColor: isSelected
                  ? selectedBackgroundColor
                  : unselectedBackgroundColor,
              },
            ]}
            onPress={() => handleToggle(index)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.text,
                {
                  color: isSelected ? selectedColor : unselectedColor,
                },
              ]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  toggle: {
    flex: 1, // Equal width for all toggles
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SquareToggle;
