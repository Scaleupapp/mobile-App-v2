// src/utils/mixpanelClient.js
import {Mixpanel} from 'mixpanel-react-native';
import {API} from '../services/apiConstent';

const mixpanel = new Mixpanel(API.MIXPANEL, false);

let isInitialized = false;

export const initMixpanel = async () => {
  if (!isInitialized) {
    await mixpanel.init();
    isInitialized = true;
  }
};

export default mixpanel;
