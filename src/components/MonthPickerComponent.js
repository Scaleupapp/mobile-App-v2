// MonthPickerComponent.js
import React from 'react';
import PropTypes from 'prop-types';
import MonthPicker from 'react-native-month-year-picker';
import {formatDate} from '../helper/commonFunctions';

const MonthPickerComponent = ({
  pickerState,
  onPickerStateChange,
  handleInputChange,
  field,
  minimumDate = new Date('1970-01-01'),
  maximumDate = new Date(),
}) => {
  const handleDateChange = (event, newDate) => {
    console.log(event, 'eveevn');
    if (event === 'dateSetAction') {
      const selectedDate = newDate || pickerState.date;
      const formattedDate = formatDate(selectedDate);
      onPickerStateChange({
        show: false,
        date: selectedDate,
        format: formattedDate,
      });
      handleInputChange(field, selectedDate);
      console.log('heerer');
    } else {
      onPickerStateChange({
        ...pickerState,
        show: false,
      });
    }
  };

  return (
    pickerState.show && (
      <MonthPicker
        onChange={handleDateChange}
        value={pickerState.date}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    )
  );
};

MonthPickerComponent.propTypes = {
  pickerState: PropTypes.shape({
    show: PropTypes.bool.isRequired,
    date: PropTypes.instanceOf(Date).isRequired,
    format: PropTypes.string.isRequired,
  }).isRequired,
  onPickerStateChange: PropTypes.func.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  field: PropTypes.string.isRequired,
  minimumDate: PropTypes.instanceOf(Date),
  maximumDate: PropTypes.instanceOf(Date),
};

export default MonthPickerComponent;
