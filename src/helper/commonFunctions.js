import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigationRef} from '../../App';
import {actions} from '../redux/reducers';
import reduxStore from '../redux/store';
import Routes from './routes';

export const logoutUser = async () => {
  try {
    await AsyncStorage.clear();
    reduxStore.dispatch(actions.logout());
    navigationRef.reset({
      index: 0,
      routes: [{name: Routes.LoginStack, params: {initialRoute: Routes.Login}}],
    });
  } catch (error) {
    console.log('🚀 ~ logoutUser ~ error:', error);
  }
};

export const isValidEmail = email => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
};

export const isvalidMobileNumber = number => {
  const mobRegex = /^[5-9]\d{9}$/; // Matches Indian mobile numbers
  return mobRegex.test(number);
};

export const isvalidPassword = pass => {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(pass);
};

// Debounce Function
export const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func?.(...args), delay);
  };
};

// Throttle Function
export const throttle = (func, limit) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func?.(...args);
    }
  };
};

export const formatDate = date => {
  const options = {year: 'numeric', month: 'short'}; // 'short' gives abbreviated month name
  const formattedDate = new Intl.DateTimeFormat('en-US', options)
    .format(date)
    .replace(' ', '-');
  return formattedDate;
};
