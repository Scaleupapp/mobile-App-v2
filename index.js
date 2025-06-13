/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import {getNotification} from './src/notifications';
import {initMixpanel} from './src/helper/mixpanelClient';
// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  getNotification(remoteMessage);
  return Promise.resolve();
});

initMixpanel();

AppRegistry.registerComponent(appName, () => App);
