import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidGroupAlertBehavior,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  EventType,
} from '@notifee/react-native';
import React from 'react';
import {Platform} from 'react-native';
import {images} from '../assets/images';
// import {
//   decodeForNotifications,
//   generateGifString,
//   getNotificationsMessage,
// } from "../commonFuctions";
// import { Platform } from "react-native";
// import { Client } from "../client";
// import { getRoute } from "./routes";
// import { Credentials } from "../credentials";
// import { ChatroomData } from "./models";

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export const fetchFCMToken = async () => {
  const fcmToken = await messaging().getToken();
  return fcmToken;
};

export const decodeForNotifications = (text: string | undefined) => {
  if (!text) {
    return;
  }
  const arr: any[] = [];
  const parts = text?.split(/(?:<<)?([\w\s🤖@]+\|route:\/\/\S+>>)/g);
  const TEMP_REGEX_USER_TAGGING =
    /(?:<<)?((?<name>[^<>|]+)\|route:\/\/(?<route>[^?]+(\?.+)?)>>)/g;

  if (parts) {
    for (const matchResult of parts) {
      if (matchResult.match(TEMP_REGEX_USER_TAGGING)) {
        const match = TEMP_REGEX_USER_TAGGING.exec(matchResult);
        if (match !== null) {
          const {name, route} = match?.groups!;
          arr.push({key: name, route: route});
        }
      } else {
        arr.push({key: matchResult, route: null});
      }
    }
    let decodedText = '';
    for (let i = 0; i < arr.length; i++) {
      decodedText = decodedText + arr[i].key;
    }
    return decodedText;
  } else {
    return text;
  }
};

export const generateGifString = (message: string) => {
  if (!message) {
    return '';
  }
  let originalString: string = message;
  let searchString: string =
    '* This is a gif message. Please update your app *';
  let replacementString: string = '';

  let resultString: string = originalString.replace(
    searchString,
    replacementString,
  );

  return resultString?.trim();
};

export const getNotification = async (remoteMessage: any) => {
  console.log('getNotification ', JSON.stringify(remoteMessage));
  const isIOS = Platform.OS === 'ios' ? true : false;

  // const message = isIOS
  //   ? generateGifString(remoteMessage?.notification?.body)
  //   : generateGifString(remoteMessage?.data?.sub_title);
  // const decodedMsg = decodeForNotifications(message)

  const decodedMsg = remoteMessage?.body || remoteMessage?.notification?.body;

  const channelId = await notifee.createChannel({
    id: 'important',
    name: 'Important Notifications',
    importance: AndroidImportance.HIGH,
  });

  // if (!remoteMessage?.data?.route) {
  //   return;
  // }

  // const route = await getRoute(remoteMessage?.data?.route);
  // const navigationRoute = route?.params?.navigationRoute;

  await notifee.displayNotification({
    title: remoteMessage?.title || remoteMessage?.data?.title,
    subtitle: remoteMessage?.subtitle || remoteMessage?.data?.subtitle,
    body: decodedMsg,
    data: remoteMessage?.data,
    id: remoteMessage?.messageId,
    android: {
      channelId,
      // color: '#9c27b0',
      // largeIcon: images.ciclelogo,
      // smallIcon: images.ciclelogo,
      smallIcon: 'ic_launcher', // Set the small icon
      // pressAction is needed if you want the notification to open the app when pressed
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      importance: AndroidImportance.HIGH,
    },
  });
};
