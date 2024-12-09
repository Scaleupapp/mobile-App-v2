import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useToast} from './components/CustomToast';
import {useNavigation} from '@react-navigation/native';
import {setupAxiosInterceptors} from './services/axiosinstance';
import Routes from './helper/routes';
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
import InnerCircle from './screens/InnerCircle/MyInnerCircle';
import Followers from './screens/MyProfile/Followers';
import Following from './screens/MyProfile/Following';
import Likes from './screens/MyProfile/Likes';
import BlockUsers from './screens/MyProfile/BlockUser';

const Stack = createNativeStackNavigator();
const LoginStack = createNativeStackNavigator();

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

export const RootNavigator = () => {
  const {showToast} = useToast(); // Access useToast hook here
  const navigation = useNavigation();

  useEffect(() => {
    setupAxiosInterceptors(showToast, navigation);
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
        component={Home}
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
    </Stack.Navigator>
  );
};
