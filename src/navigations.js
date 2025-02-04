import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useToast} from './components/CustomToast';
import {useNavigation} from '@react-navigation/native';
import {setupAxiosInterceptors} from './services/axiosinstance';
import Routes from './helper/routes';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {icons} from './assets/icons';
import {Image, PermissionsAndroid, View} from 'react-native';
import {isAndroid, nh, nw} from './helper/scales';
import {COLORS} from './helper/colors';
import Text from './components/Text';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import {
  fetchFCMToken,
  getNotification,
  requestUserPermission,
} from './notifications';
import {useSelector} from 'react-redux';
import {SaveFcm} from './services/apiService';

// screens
import SplashScreen from './screens/Onboarding/SplashScreen';
import OnboardingScreen from './screens/Onboarding/Onboarding';
import SignUp from './screens/Signup/Signup';
import Login from './screens/Login/Login';
import ForgotPassword from './screens/Login/ForgotPassword';
import Verification from './screens/Login/Verification';
import Preferences from './screens/Preferences/Preferences';
import EditProfile from './screens/EditProfile/EditProfile';
import WorkExperience from './screens/EditProfile/WorkExperience';
import Education from './screens/EditProfile/Education';
import Certifications from './screens/EditProfile/Certifications';
import Projects from './screens/EditProfile/Projects';
import SetNewPassword from './screens/Login/SetNewPassword';
import Home from './screens/Home/Home';
import BasicDetails from './screens/Signup/BasicDetails';
import Notifications from './screens/Notification/Notification';
import MyProfile from './screens/MyProfile/MyProfile';
import MyPlaylist from './screens/MyProfile/MyPlayList';
import EditPlayList from './screens/MyProfile/EditPlaylist';
import NewPlayList from './screens/MyProfile/NewPlayList';
import SavePost from './screens/Post/SavedPost';
import DraftPost from './screens/Post/DraftPost';
import VerifiedPost from './screens/Post/VerifiedPost';
import PendingPost from './screens/Post/PendingPost';
import DeclinedPost from './screens/Post/DeclinedPost';
import CreatePost from './screens/Post/CreatePost';
import InnerCircleRequest from './screens/InnerCircle/InnerCircleRequest';
import LearningVideo from './screens/LearningVideo/LearningVideo';
import InnerCircle from './screens/InnerCircle/MyInnerCircle';
import Followers from './screens/MyProfile/Followers';
import Following from './screens/MyProfile/Following';
import Likes from './screens/MyProfile/Likes';
import BlockUsers from './screens/MyProfile/BlockUser';
import MenuScreen from './screens/Menuscreen/MenuScreen';
import Settings from './screens/Menuscreen/SettingScreen';
import ChangePassword from './screens/Login/ChangePassword';
import Search from './screens/Search/Search';
import HelpScreen from './screens/Menuscreen/HelpCentre';
import Terms from './screens/Menuscreen/HelpCentre/Terms';
import UserPost from './screens/Post/UserPost';
import {UserAnalyticsPerf} from './screens/UserAnalyticsPerf/UserAnalyticsPerf';
import Conversation from './screens/Chat/Conversation';
import Chat from './screens/Chat/Chat';
import MyBadge from './screens/MyBadge/MyBadge';
import QuizScreen from './screens/Quiz/QuizScreen';
import QuizListScreen from './screens/Quiz/QuizListScreen';
import EditGroupProfile from './screens/Chat/EditGroupProfile';
import GroupChat from './screens/Chat/GroupChat';

const Stack = createNativeStackNavigator();
const LoginStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LoginNavigator = ({route}) => {
  return (
    <LoginStack.Navigator
      initialRouteName={route.params?.initialRoute || Routes.SplashScreen}>
      <LoginStack.Screen
        name={Routes.SplashScreen}
        component={SplashScreen}
        options={{headerShown: false}}
      />
      <LoginStack.Screen
        name={Routes.OnboardingScreen}
        component={OnboardingScreen}
        options={{headerShown: false}}
      />
      <LoginStack.Screen
        name={Routes.SignUp}
        component={SignUp}
        options={{headerShown: false}}
      />

      <LoginStack.Screen
        name={Routes.Login}
        component={Login}
        options={{headerShown: false}}
      />
      <LoginStack.Screen
        name={Routes.ForgotPassword}
        component={ForgotPassword}
        options={{headerShown: false}}
      />
      <LoginStack.Screen
        name={Routes.Verification}
        component={Verification}
        options={{headerShown: false}}
      />

      <LoginStack.Screen
        name={Routes.SetNewPassword}
        component={SetNewPassword}
        options={{headerShown: false}}
      />
    </LoginStack.Navigator>
  );
};

const TabNavigator = props => {
  const initialRouteName = props?.route?.params?.route || 'MainHome';
  const setBottomIcon = (img, focused) => {
    if (focused)
      return (
        <View
          style={{
            top: nh(-20),
            height: nw(50),
            width: nw(50),
            borderRadius: nw(25),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.whiteFFFFFF,
          }}>
          <View
            style={{
              backgroundColor: COLORS.blue043142,
              height: nw(40),
              width: nw(40),
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: nw(20),
              borderWidth: nw(1),
              borderColor: COLORS.whiteFFFFFF,
              boxShadow: '0 0 10 0  rgba(4, 49, 66, 0.35)',
              elevation: 3,
            }}>
            <Image
              source={img}
              tintColor={'white'}
              style={{
                height: nw(20),
                width: nw(20),
              }}
            />
          </View>
        </View>
      );
    return (
      <View style={{marginTop: nh(isAndroid ? 10 : 15)}}>
        <Image source={img} style={{height: nw(30), width: nw(30)}} />
      </View>
    );
  };

  const setBottomIconText = (iconText, focused) => {
    if (!focused) return;
    return (
      <Text
        variant="bold12"
        style={{
          color: COLORS.whiteFFFFFF,
          lineHeight: nh(14),
        }}>
        {iconText}
      </Text>
    );
  };

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={props => {
        return {
          tabBarLabelPosition: 'below-icon',
          headerShown: false,
          headerTransparent: true,
          tabBarHideOnKeyboard: true,
          showIcon: true,
          tabBarStyle: {
            backgroundColor: COLORS.blue043142,
            // paddingTop: 5,
          },
          tabBarItemStyle: {
            // paddingBottom: nh(15),
            // marginBottom: 10,
          },
        };
      }}>
      <Tab.Screen
        name={'MainHome'}
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: ({focused}) => setBottomIconText('Home', focused),
          tabBarIcon: ({focused}) =>
            setBottomIcon(focused ? icons.home1 : icons.home2, focused),
        }}
      />
      <Tab.Screen
        name={Routes.Search}
        component={Search}
        options={{
          headerShown: false,
          tabBarLabel: ({focused}) => setBottomIconText('Search', focused),
          tabBarIcon: ({focused}) =>
            setBottomIcon(focused ? icons.search1 : icons.search2, focused),
        }}
      />
      <Tab.Screen
        name={Routes.CreatePost}
        component={CreatePost}
        options={{
          headerShown: false,
          tabBarLabel: ({focused}) => setBottomIconText('Create', focused),
          tabBarIcon: ({focused}) =>
            setBottomIcon(focused ? icons.add1 : icons.add2, focused),
        }}
      />
      <Tab.Screen
        name={Routes.LearningVideo}
        component={LearningVideo}
        options={{
          headerShown: false,
          tabBarLabel: ({focused}) => setBottomIconText('Videos', focused),
          tabBarIcon: ({focused}) =>
            setBottomIcon(focused ? icons.book1 : icons.book2, focused),
        }}
      />
      <Tab.Screen
        name={Routes.MyProfile}
        component={MyProfile}
        options={{
          headerShown: false,
          tabBarLabel: ({focused}) => setBottomIconText('Profile', focused),
          tabBarIcon: ({focused}) =>
            setBottomIcon(focused ? icons.account1 : icons.account2, focused),
        }}
      />
      {/* <Tab.Screen
        name={Routes.QuizList}
        component={QuizListScreen}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Quiz', focused),
          tabBarIcon: ({focused}) =>
            setBottomIcon(
              focused ? icons.quizActive : icons.quizInactive,
              focused,
            ),
        }}
      /> */}
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const {showToast} = useToast(); // Access useToast hook here
  const navigation = useNavigation();
  const userdata = useSelector(state => state?.userData);

  useEffect(() => {
    setupAxiosInterceptors(showToast, navigation);
  }, []);

  if (isAndroid) {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  useEffect(() => {
    if (userdata?.token) {
      pushAPI();
    }
  }, [userdata]);

  const pushAPI = async () => {
    const isPermissionEnabled = await requestUserPermission();
    // console.log('🚀 ~ pushAPI ~ isPermissionEnabled:', isPermissionEnabled);
    if (isPermissionEnabled) {
      // You only need to register if auto-registration is disabled
      // if (!isAndroid) await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await fetchFCMToken();
      // console.log('🚀 ~ pushAPI ~ fcmToken:', fcmToken);

      if (fcmToken) {
        try {
          const {data} = await SaveFcm({FcmToken: fcmToken});
        } catch (error) {
          console.log('fireeee ', error);
        }
      }
    }
  };
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const val = await getNotification(remoteMessage);
      return val;
    });

    notifee.onForegroundEvent(async ({type, detail}) => {
      console.log(
        'onForegroundEvent detail?.notification?.data?.route ',
        type,
        detail,
      );
      if (detail?.notification?.data?.route != undefined) {
        if (type === EventType.PRESS) {
          if (!!navigation) {
            navigation.navigate(detail?.notification?.data?.route);
          }
        }
      }
    });
    notifee.onBackgroundEvent(async ({type, detail}) => {
      console.log(
        'onBackgroundEvent detail?.notification?.data?.route ',
        type,
        detail,
      );

      if (detail?.notification?.data?.route != undefined) {
        if (type === EventType.PRESS) {
          if (!!navigation) {
            navigation.navigate(detail?.notification?.data?.route);
          }
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
      }}
      initialRouteName={Routes.LoginStack}>
      <Stack.Screen
        name={Routes.LoginStack}
        component={LoginNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Preferences}
        component={Preferences}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.BasicDetails}
        component={BasicDetails}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Home}
        component={TabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Notifications}
        component={Notifications}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.EditProfile}
        component={EditProfile}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.WorkExperience}
        component={WorkExperience}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Education}
        component={Education}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Certifications}
        component={Certifications}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Projects}
        component={Projects}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.CreatePost}
        component={CreatePost}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.MenuScreen}
        component={MenuScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.OtherProfile}
        component={MyProfile}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.MyPlaylist}
        component={MyPlaylist}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.EditPlayList}
        component={EditPlayList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.NewPlayList}
        component={NewPlayList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.SavePost}
        component={SavePost}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.DraftPost}
        component={DraftPost}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.VerifiedPost}
        component={VerifiedPost}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.PendingPost}
        component={PendingPost}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.DeclinedPost}
        component={DeclinedPost}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name={Routes.InnerCircleRequest}
        component={InnerCircleRequest}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.InnerCircle}
        component={InnerCircle}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Followers}
        component={Followers}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Following}
        component={Following}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Likes}
        component={Likes}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.BlockUsers}
        component={BlockUsers}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Settings}
        component={Settings}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.ChangePassword}
        component={ChangePassword}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.HelpScreen}
        component={HelpScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Terms}
        component={Terms}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.UserPost}
        component={UserPost}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.UserAnalyticsPerf}
        component={UserAnalyticsPerf}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.MyBadge}
        component={MyBadge}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name={Routes.Conversation}
        component={Conversation}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.Chat}
        component={Chat}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.QuizScreen}
        component={QuizScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.QuizList}
        component={QuizListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.EditGroupProfile}
        component={EditGroupProfile}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={Routes.GroupChat}
        component={GroupChat}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};
