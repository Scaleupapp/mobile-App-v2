import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import {COLORS} from '../helper/colors';

const ToggleWithUnderline = ({
  options = ['Option 1', 'Option 2', 'Option 3'], // Toggle options
  selectedTextColor = COLORS.yellowF5BE00, // Selected text color
  unselectedTextColor = '#808080', // Unselected text color (gray)
  selectedUnderlineColor = COLORS.yellowF5BE00, // Selected underline color
  unselectedUnderlineColor = '#E9E9E9', // Unselected underline color (light gray)
  selectedUnderlineHeight = 4, // Thickness of selected underline
  unselectedUnderlineHeight = 1, // Thickness of unselected underline
  onToggle = () => {}, // Callback for toggle change
  select = 0,
}) => {
  const [selected, setSelected] = useState(select);

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
            <Text
              style={[
                styles.text,
                {color: isSelected ? selectedTextColor : unselectedTextColor},
              ]}>
              {option}
            </Text>
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

export default ToggleWithUnderline;
