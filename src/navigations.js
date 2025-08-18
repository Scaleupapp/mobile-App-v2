import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useToast} from './components/CustomToast';
import {useNavigation} from '@react-navigation/native';
import {setupAxiosInterceptors} from './services/axiosinstance';
import Routes from './helper/routes';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {icons} from './assets/icons';
import {Dimensions, Image, PermissionsAndroid, View, ActivityIndicator} from 'react-native';
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {APP_FONTS} from './assets/fonts/index.js';

// --- Screen Imports ---
// Onboarding & Auth
import SplashScreen from './screens/Onboarding/SplashScreen';
import OnboardingScreen from './screens/Onboarding/Onboarding';
import SignUp from './screens/Signup/Signup';
import Login from './screens/Login/Login';
import ForgotPassword from './screens/Login/ForgotPassword';
import Verification from './screens/Login/Verification';
import SetNewPassword from './screens/Login/SetNewPassword';
import ChangePassword from './screens/Login/ChangePassword';
import BasicDetails from './screens/Signup/BasicDetails';
import Preferences from './screens/Preferences/Preferences';

// Core Features
import Home from './screens/Home/Home';
import Search from './screens/Search/Search';
import Notifications from './screens/Notification/Notification';
import CreatePost from './screens/Post/CreatePost';
import CommunityHome from './screens/Community/CommunityHome';
import CommunityDiscovery from './screens/Community/CommunityDiscovery';
import CommunityProfile from './screens/Community/CommunityProfile';  
import MyCommunities from './screens/Community/MyCommunities';
import CreateCommunity from './screens/Community/CreateCommunity';
import CreateCommunityPost from './screens/Community/CreatePost';
import CommunityPostDetail from './screens/Community/CommunityPostDetail';

// Profile & User
import MyProfile from './screens/MyProfile/MyProfile';
import EditProfile from './screens/EditProfile/EditProfile';
import WorkExperience from './screens/EditProfile/WorkExperience';
import Education from './screens/EditProfile/Education';
import Certifications from './screens/EditProfile/Certifications';
import Projects from './screens/EditProfile/Projects';
import MyPlaylist from './screens/MyProfile/MyPlayList';
import EditPlayList from './screens/MyProfile/EditPlaylist';
import NewPlayList from './screens/MyProfile/NewPlayList';
import Followers from './screens/MyProfile/Followers';
import Following from './screens/MyProfile/Following';
import Likes from './screens/MyProfile/Likes';
import BlockUsers from './screens/MyProfile/BlockUser';
import MyBadge from './screens/MyBadge/MyBadge';
import {UserAnalyticsPerf} from './screens/UserAnalyticsPerf/UserAnalyticsPerf';

// Post Management
import SavePost from './screens/Post/SavedPost';
import DraftPost from './screens/Post/DraftPost';
import VerifiedPost from './screens/Post/VerifiedPost';
import PendingPost from './screens/Post/PendingPost';
import DeclinedPost from './screens/Post/DeclinedPost';
import UserPost from './screens/Post/UserPost';

// Inner Circle
import InnerCircleRequest from './screens/InnerCircle/InnerCircleRequest';
import InnerCircle from './screens/InnerCircle/MyInnerCircle';

// Learning & Videos
import LearningVideo from './screens/LearningVideo/LearningVideo';
import LearningVault from './screens/LearningVault/LearningVault';
import AreasOfImprovement from './screens/AreasOfImprovement/AreasOfImprovement';
import TopicInsight from './screens/TopicInsight/TopicInsight';
import LearningIntelligenceHub from './screens/LearningIntelligence/LearningIntelligenceHub';

// Menu & Settings
import MenuScreen from './screens/Menuscreen/MenuScreen';
import Settings from './screens/Menuscreen/SettingScreen';
import HelpScreen from './screens/Menuscreen/HelpCentre';
import Terms from './screens/Menuscreen/HelpCentre/Terms';
import SupportQueryScreen from './screens/Menuscreen/QueryScreen';
import MyQueriesScreen from './screens/Menuscreen/QuerylistScreen';

// Chat
import Conversation from './screens/Chat/Conversation';
import Chat from './screens/Chat/Chat';
import EditGroupProfile from './screens/Chat/EditGroupProfile';
import GroupChat from './screens/Chat/GroupChat';
import GroupProfile from './screens/Chat/GroupProfile';
import GroupRequest from './screens/Chat/groupRequest';

// Quiz
import QuizScreen from './screens/Quiz/QuizScreen';
import QuizListScreen from './screens/Quiz/QuizListScreen';
import QuizFeedbackScreen from './screens/Quiz/QuizFeedBack';
import CreateQuizScreen from './screens/Quiz/CreateQuizScreen';
import EditQuizScreen from './screens/Quiz/EditQuizScreen';
import CreatorDashboardScreen from './screens/Quiz/CreatorDashboardScreen';
import QuizAnalyticsScreen from './screens/Quiz/QuizAnalyticsScreen';
import QuizAccessRequestsScreen from './screens/Quiz/QuizAccessRequestsScreen';
import AIPaymentModal from './screens/Quiz/AIPaymentModal';
import MyQuizzesScreen from './screens/Quiz/MyQuizzesScreen';
import QuizParticipantsScreen from './screens/Quiz/QuizParticipantsScreen.js';

// Flashcards
import FlashcardHub from './screens/Flashcards/FlashcardHub';
import CreateDeck from './screens/Flashcards/CreateDeck';
import UploadDocument from './screens/Flashcards/UploadDocument';
import DeckDetails from './screens/Flashcards/DeckDetails';
import FlashcardViewer from './screens/Flashcards/FlashcardViewer';
import BrowsePublicDecks from './screens/Flashcards/BrowsePublicDecks';
import AddEditCard from './screens/Flashcards/AddEditCard';
import FlashcardAnalytics from './screens/Flashcards/FlashcardAnalytics';
import MyDecks from './screens/Flashcards/MyDecks';
import StudySummary from './screens/Flashcards/StudySummary';
import CramMode from './screens/Flashcards/CramMode';
import CramFlashcardViewer from './screens/Flashcards/CramFlashcardViewer.js';

// AI Study Buddy
import AIStudyBuddyHub from './screens/AIStudyBuddy/AIStudyBuddyHub';
import AIStudyBuddyNewSession from './screens/AIStudyBuddy/AIStudyBuddyNewSession';
import AIStudyBuddyChat from './screens/AIStudyBuddy/AIStudyBuddyChat';
import AIStudyBuddyActiveSessions from './screens/AIStudyBuddy/AIStudyBuddyActiveSessions';
import AIStudyBuddySessionDetails from './screens/AIStudyBuddy/AIStudyBuddySessionDetails';
import AIStudyBuddySessionHistory from './screens/AIStudyBuddy/AIStudyBuddySessionHistory';
import AIStudyBuddyAnalytics from './screens/AIStudyBuddy/AIStudyBuddyAnalytics';
import AIStudyBuddyBookmarks from './screens/AIStudyBuddy/AIStudyBuddyBookmarks';
import AIStudyBuddySearch from './screens/AIStudyBuddy/AIStudyBuddySearch';

// IntelliTest
import IntelliTestHub from './screens/IntelliTest/IntelliTestHub';
import IntelliTestExamSelection from './screens/IntelliTest/IntelliTestExamSelection.js';
import IntelliTestAssessment from './screens/IntelliTest/IntelliTestAssessmentConfig.js';
import IntelliStartTestAssessment from './screens/IntelliTest/IntelliTestAssessment';
import IntelliTestQuestionGeneration from './screens/IntelliTest/IntelliTestQuestionGeneration';
import IntelliTestSessionHistory from './screens/IntelliTest/IntelliTestSessionHistory';
import IntelliTestAnalyticsDashboard from './screens/IntelliTest/IntelliTestAnalyticsDashboard';

// --- Navigators ---
const Stack = createNativeStackNavigator();
const LoginStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Login Flow Navigator ---
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

// --- Bottom Tab Navigator ---

// A helper function to render the focused state style for tab icons
const FocusedIconWrapper = ({children}) => (
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
        // Shadow for Android (elevation) and iOS (shadow properties)
        elevation: 5,
        shadowColor: 'rgba(4, 49, 66, 0.35)',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.8,
        shadowRadius: 8,
      }}>
      {children}
    </View>
  </View>
);

// A helper function to render the unfocused state style for tab icons
const UnfocusedIconWrapper = ({children, tabname}) => (
  <View style={{marginTop: nh(isAndroid ? 10 : 15), width: nw(30), height: nw(30), alignItems: 'center', justifyContent: 'center'}}>
    {tabname === 'create' && <NewBadge />}
    {children}
  </View>
);


// A helper function to render the "New" badge on icons
const NewBadge = () => (
  <View
    style={{
      backgroundColor: 'orange',
      borderRadius: 10,
      paddingHorizontal: 4,
      paddingVertical: 1,
      position: 'absolute',
      right: -5, 
      top: -5,
      zIndex: 1,
    }}>
    <Text
      style={{
        color: 'white',
        fontSize: 8,
        fontFamily: APP_FONTS.PoppinsBold,
      }}>
      New
    </Text>
  </View>
);

// Custom icon renderer for vector-based icons
const setBottomIconWithVectorIcon = (
  IconComponent,
  iconName,
  focused,
  tabname,
) => {
  if (focused) {
    return (
      <FocusedIconWrapper>
        <IconComponent name={iconName} size={nw(20)} color="white" />
      </FocusedIconWrapper>
    );
  }
  return (
    <UnfocusedIconWrapper tabname={tabname}>
      <IconComponent name={iconName} size={nw(24)} color="white" />
    </UnfocusedIconWrapper>
  );
};

// Custom icon renderer for image-based icons
const setBottomIconWithImage = (img, focused, tabname) => {
  if (focused) {
    return (
      <FocusedIconWrapper>
        <Image
          source={img}
          tintColor={'white'}
          style={{height: nw(20), width: nw(20)}}
        />
      </FocusedIconWrapper>
    );
  }
  return (
    <UnfocusedIconWrapper tabname={tabname}>
      <Image
        source={img}
        style={{height: nw(30), width: nw(30)}}
        tintColor={'white'}
      />
    </UnfocusedIconWrapper>
  );
};

// Custom label renderer for focused tabs
const setBottomIconText = (iconText, focused) => {
  if (!focused) return null;
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

const TabNavigator = props => {
  const initialRouteName = props?.route?.params?.route || 'MainHome';

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        tabBarLabelPosition: 'below-icon',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.blue043142,
          height: nh(isAndroid ? 60 : 80), // Standardized height
        },
        tabBarItemStyle: {
          paddingBottom: nh(isAndroid ? 5 : 20), // Adjust padding for notch
        },
      }}>
      <Tab.Screen
        name={'MainHome'}
        component={Home}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Home', focused),
          tabBarIcon: ({focused}) =>
            setBottomIconWithImage(
              focused ? icons.home1 : icons.home2,
              focused,
              'home',
            ),
        }}
      />
      <Tab.Screen
        name={Routes.Search}
        component={Search}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Search', focused),
          tabBarIcon: ({focused}) =>
            setBottomIconWithImage(
              focused ? icons.search1 : icons.search2,
              focused,
              'search',
            ),
        }}
      />
      <Tab.Screen
        name={Routes.CommunityHub}
        component={CommunityHome}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Nexus', focused),
          tabBarIcon: ({focused}) =>
            setBottomIconWithVectorIcon(
              FontAwesome5, // Using FontAwesome5 for a better community icon
              'users', // The 'users' icon clearly represents community
              focused,
              'nexus',
            ),
        }}
      />
      <Tab.Screen
        name={Routes.CreatePost}
        component={CreatePost}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Create', focused),
          tabBarIcon: ({focused}) =>
            setBottomIconWithImage(
              focused ? icons.add1 : icons.add2,
              focused,
              'create',
            ),
        }}
      />
      <Tab.Screen
        name={Routes.FlashcardHub}
        component={FlashcardHub}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Flashcard', focused),
          tabBarIcon: ({focused}) =>
            setBottomIconWithImage(
              focused ? icons.book1 : icons.book2,
              focused,
              'Flashcard',
            ),
        }}
      />
      <Tab.Screen
        name={Routes.QuizList}
        component={QuizListScreen}
        options={{
          tabBarLabel: ({focused}) => setBottomIconText('Quiz', focused),
          tabBarIcon: ({focused}) =>
            setBottomIconWithImage(
              focused ? icons.quizActive : icons.quizInactive,
              focused,
              'Quiz',
            ),
        }}
      />
    </Tab.Navigator>
  );
};

// --- Main App Navigator (Root) ---
export const RootNavigator = () => {
  const {showToast} = useToast();
  const navigation = useNavigation();
  const userdata = useSelector(state => state?.userData);

  // Setup Axios interceptors for API calls
  useEffect(() => {
    setupAxiosInterceptors(showToast, navigation);
  }, [navigation, showToast]);

  // Request notification permissions on Android
  useEffect(() => {
    if (isAndroid) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
  }, []);

  // Handle FCM token registration and saving
  useEffect(() => {
    const pushAPI = async () => {
      const isPermissionEnabled = await requestUserPermission();
      if (isPermissionEnabled) {
        const fcmToken = await fetchFCMToken();
        if (fcmToken) {
          try {
            await SaveFcm({FcmToken: fcmToken});
            console.log('FCM Token saved successfully.');
          } catch (error) {
            console.error('Failed to save FCM Token:', error);
          }
        }
      }
    };

    if (userdata?.token) {
      pushAPI();
    }
  }, [userdata]);

  // Setup notification listeners
  useEffect(() => {
    // Listener for foreground messages
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      await getNotification(remoteMessage);
    });

    // Listener for when a foreground notification is pressed
    const unsubscribeForegroundEvent = notifee.onForegroundEvent(
      async ({type, detail}) => {
        if (
          type === EventType.PRESS &&
          detail?.notification?.data?.route &&
          !!navigation
        ) {
          navigation.navigate(detail.notification.data.route);
        }
      },
    );

    // Listener for when a background notification is pressed.
    // This handler is set once and does not return an unsubscribe function.
    notifee.onBackgroundEvent(async ({type, detail}) => {
      if (
        type === EventType.PRESS &&
        detail?.notification?.data?.route &&
        !!navigation
      ) {
        // Note: Navigation from a background event can be tricky.
        // Ensure the app is fully mounted before navigating.
        navigation.navigate(detail.notification.data.route);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeOnMessage();
      unsubscribeForegroundEvent();
      // No need to unsubscribe from the background event listener
    };
  }, [navigation]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={Routes.LoginStack}>
      {/* Authentication Flow */}
      <Stack.Screen name={Routes.LoginStack} component={LoginNavigator} />

      {/* Post-Login Setup */}
      <Stack.Screen name={Routes.Preferences} component={Preferences} />
      <Stack.Screen name={Routes.BasicDetails} component={BasicDetails} />

      {/* Main App Flow with Bottom Tabs */}
      <Stack.Screen name={Routes.Home} component={TabNavigator} />

      {/* Other Screens (Alphabetical for maintainability) */}
      <Stack.Screen
        name={Routes.AddEditCard}
        component={AddEditCard}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddyActiveSessions}
        component={AIStudyBuddyActiveSessions}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddyAnalytics}
        component={AIStudyBuddyAnalytics}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddyBookmarks}
        component={AIStudyBuddyBookmarks}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddyChat}
        component={AIStudyBuddyChat}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddyHub}
        component={AIStudyBuddyHub}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddyNewSession}
        component={AIStudyBuddyNewSession}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddySearchMessages}
        component={AIStudyBuddySearch}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddySessionDetails}
        component={AIStudyBuddySessionDetails}
      />
      <Stack.Screen
        name={Routes.AIStudyBuddySessionHistory}
        component={AIStudyBuddySessionHistory}
      />
      <Stack.Screen
        name={Routes.AIPayment}
        component={AIPaymentModal}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name={Routes.AreasOfImprovement}
        component={AreasOfImprovement}
      />
      <Stack.Screen name={Routes.BlockUsers} component={BlockUsers} />
      <Stack.Screen name={Routes.Certifications} component={Certifications} />
      <Stack.Screen name={Routes.ChangePassword} component={ChangePassword} />
      <Stack.Screen name={Routes.Chat} component={Chat} />
      <Stack.Screen name={Routes.CommunityHub} component={CommunityHome} />
      <Stack.Screen name={Routes.Conversation} component={Conversation} />
      <Stack.Screen name={Routes.CramFlashcardViewer} component={CramFlashcardViewer} />
      <Stack.Screen name={Routes.CramMode} component={CramMode} />
      <Stack.Screen name={Routes.CreateDeck} component={CreateDeck} />
      <Stack.Screen name={Routes.CreatePost} component={CreatePost} />
      <Stack.Screen name={Routes.CreateQuiz} component={CreateQuizScreen} />
      <Stack.Screen name={Routes.CreatorDashboard} component={CreatorDashboardScreen} />
      <Stack.Screen name={Routes.DeckDetails} component={DeckDetails} />
      <Stack.Screen name={Routes.DeclinedPost} component={DeclinedPost} />
      <Stack.Screen name={Routes.DraftPost} component={DraftPost} />
      <Stack.Screen name={Routes.EditGroupProfile} component={EditGroupProfile} />
      <Stack.Screen name={Routes.EditPlayList} component={EditPlayList} />
      <Stack.Screen name={Routes.EditProfile} component={EditProfile} />
      <Stack.Screen name={Routes.EditQuiz} component={EditQuizScreen} />
      <Stack.Screen name={Routes.Education} component={Education} />
      <Stack.Screen name={Routes.FlashcardAnalytics} component={FlashcardAnalytics} />
      <Stack.Screen name={Routes.FlashcardHub} component={FlashcardHub} />
      <Stack.Screen name={Routes.FlashcardViewer} component={FlashcardViewer} />
      <Stack.Screen name={Routes.Followers} component={Followers} />
      <Stack.Screen name={Routes.Following} component={Following} />
      <Stack.Screen name={Routes.GroupChat} component={GroupChat} />
      <Stack.Screen name={Routes.GroupProfile} component={GroupProfile} />
      <Stack.Screen name={Routes.groupRequest} component={GroupRequest} />
      <Stack.Screen name={Routes.HelpScreen} component={HelpScreen} />
      <Stack.Screen name={Routes.InnerCircle} component={InnerCircle} />
      <Stack.Screen name={Routes.InnerCircleRequest} component={InnerCircleRequest} />
      <Stack.Screen name={Routes.LearningIntelligenceHub} component={LearningIntelligenceHub} />
      <Stack.Screen name={Routes.LearningVault} component={LearningVault} />
      <Stack.Screen name={Routes.Likes} component={Likes} />
      <Stack.Screen name={Routes.MenuScreen} component={MenuScreen} />
      <Stack.Screen name={Routes.MyBadge} component={MyBadge} />
      <Stack.Screen name={Routes.MyDecks} component={MyDecks} />
      <Stack.Screen name={Routes.MyPlaylist} component={MyPlaylist} />
      <Stack.Screen name={Routes.MyProfile} component={MyProfile} />
      <Stack.Screen name={Routes.MyQuizzes} component={MyQuizzesScreen} />
      <Stack.Screen name={Routes.NewPlayList} component={NewPlayList} />
      <Stack.Screen name={Routes.Notifications} component={Notifications} />
      <Stack.Screen name={Routes.OtherProfile} component={MyProfile} />
      <Stack.Screen name={Routes.PendingPost} component={PendingPost} />
      <Stack.Screen name={Routes.Projects} component={Projects} />
      <Stack.Screen name={Routes.PublicDecks} component={BrowsePublicDecks} />
      <Stack.Screen name={Routes.QuizAccessRequests} component={QuizAccessRequestsScreen} />
      <Stack.Screen name={Routes.QuizAnalytics} component={QuizAnalyticsScreen} />
      <Stack.Screen name={Routes.QuizFeedbackScreen} component={QuizFeedbackScreen} />
      <Stack.Screen name={Routes.QuizList} component={QuizListScreen} />
      <Stack.Screen name={Routes.QuizParticipants} component={QuizParticipantsScreen} />
      <Stack.Screen name={Routes.QuizScreen} component={QuizScreen} />
      <Stack.Screen name={Routes.SavePost} component={SavePost} />
      <Stack.Screen name={Routes.Settings} component={Settings} />
      <Stack.Screen name={Routes.StudySummary} component={StudySummary} />
      <Stack.Screen name={Routes.SupportQueryScreen} component={SupportQueryScreen} />
      <Stack.Screen name={'MyQueriesScreen'} component={MyQueriesScreen} />
      <Stack.Screen name={Routes.Terms} component={Terms} />
      <Stack.Screen name={Routes.TopicInsight} component={TopicInsight} />
      <Stack.Screen name={Routes.UploadDocument} component={UploadDocument} />
      <Stack.Screen
        name={Routes.UserAnalyticsPerf}
        component={UserAnalyticsPerf}
      />
      <Stack.Screen name={Routes.UserPost} component={UserPost} />
      <Stack.Screen name={Routes.VerifiedPost} component={VerifiedPost} />
      <Stack.Screen name={Routes.CommunityDiscovery} component={CommunityDiscovery} /> 
      <Stack.Screen name={Routes.CommunityProfile} component={CommunityProfile} />
      <Stack.Screen name={Routes.MyCommunities} component={MyCommunities} />
      <Stack.Screen name={Routes.CreateCommunity} component={CreateCommunity} />
      <Stack.Screen name={Routes.CreateCommunityPost} component={CreateCommunityPost} />
      <Stack.Screen name={Routes.CommunityPostDetail} component={CommunityPostDetail} />
      </Stack.Navigator>
  );
};
