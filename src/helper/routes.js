//src/helper/routes.js
const Routes = {
  LoginStack: 'LoginStack',
  SplashScreen: 'SplashScreen',
  OnboardingScreen: 'OnboardingScreen',
  SignUp: 'SignUp',
  Login: 'Login',
  ForgotPassword: 'ForgotPassword',
  Verification: 'Verification',
  SetNewPassword: 'SetNewPassword',
  BasicDetails: 'BasicDetails',
  Home: 'Home',
  Notifications: 'Notifications',
  MyProfile: 'MyProfile',
  MyPlaylist: 'MyPlaylist',
  EditPlayList: 'EditPlayList',
  NewPlayList: 'NewPlayList',
  SavePost: 'SavePost',
  DraftPost: 'DraftPost',
  VerifiedPost: 'VerifiedPost',
  PendingPost: 'PendingPost',
  DeclinedPost: 'DeclinedPost',
  CreatePost: 'CreatePost',
  InnerCircleRequest: 'InnerCircleRequest',
  InnerCircle: 'InnerCircle',
  Followers: 'Followers',
  Following: 'Following',
  Likes: 'Likes',
  BlockUsers: 'BlockUsers',
  EditProfile: 'EditProfile',
  Preferences: 'Preferences',
  WorkExperience: 'WorkExperience',
  Education: 'Education',
  Certifications: 'Certifications',
  Projects: 'Projects',
  MenuScreen: 'MenuScreen',
  LearningVideo: 'LearningVideo',
  Settings: 'Settings',
  ChangePassword: 'ChangePassword',
  Search: 'Search',
  OtherProfile: 'OtherProfile',
  HelpScreen: 'HelpScreen',
  Terms: 'Terms',
  UserPost: 'UserPost',
  UserAnalyticsPerf: 'UserAnalyticsPerf',
  Conversation: 'Conversation',
  Chat: 'Chat',
  MyBadge: 'MyBadge',
  Quiz: 'Quiz',
  QuizList: 'QuizList',
  QuizDetails: 'QuizDetails',
  QuizScreen: 'QuizScreen',
  EditGroupProfile: 'EditGroupProfile',
  GroupChat: 'GroupChat',
  GroupProfile: 'GroupProfile',
  groupRequest: 'groupRequest',
  QuizFeedbackScreen: 'QuizFeedbackScreen',
  SupportQueryScreen: 'SupportQueryScreen',
  
  // User Generated Quiz Routes
  CreateQuiz: 'CreateQuiz',
  EditQuiz: 'EditQuiz',
  CreatorDashboard: 'CreatorDashboard',
  QuizAnalytics: 'QuizAnalytics',
  QuizAccessRequests: 'QuizAccessRequests',
  AIPayment: 'AIPayment',
  MyQuizzes: 'MyQuizzes',
  QuizParticipants: 'QuizParticipants',
  LearningVault: 'LearningVault',
  AreasOfImprovement: 'AreasOfImprovement',
  TopicInsight: 'TopicInsight',
  LearningAnalytics: 'LearningAnalytics',
  QuizExplanation: 'QuizExplanation',
  SetLearningGoal: 'SetLearningGoal',
  LearningIntelligenceHub: 'LearningIntelligenceHub',

  // FLASHCARD ROUTES
  FlashcardHub: 'FlashcardHub',
  FlashcardDashboard: 'FlashcardDashboard',
  MyDecks: 'MyDecks',
  DeckDetails: 'DeckDetails',
  StudySession: 'StudySession',
  CreateDeck: 'CreateDeck',
  UploadDocument: 'UploadDocument',
  CramMode: 'CramMode',
  CramFlashcardViewer: 'CramFlashcardViewer',
  PublicDecks: 'PublicDecks',
  FlashcardAnalytics: 'FlashcardAnalytics',
  FlashcardViewer: 'FlashcardViewer',
  AddEditCard: 'AddEditCard',
  StudySummary: 'StudySummary',

  // ==========================================
  // AI STUDY BUDDY ROUTES
  // ==========================================
  
  // Main Hub and Dashboard
  AIStudyBuddyHub: 'AIStudyBuddyHub',
  AIStudyBuddyDashboard: 'AIStudyBuddyDashboard',
  
  // Core Conversation Features
  AIStudyBuddyChat: 'AIStudyBuddyChat',
  AIStudyBuddyNewSession: 'AIStudyBuddyNewSession',
  AIStudyBuddySubjectSelection: 'AIStudyBuddySubjectSelection',
  
  // Session Management
  AIStudyBuddyActiveSessions: 'AIStudyBuddyActiveSessions',
  AIStudyBuddySessionHistory: 'AIStudyBuddySessionHistory',
  AIStudyBuddySessionDetails: 'AIStudyBuddySessionDetails',
  
  // Message and Content Management
  AIStudyBuddyBookmarks: 'AIStudyBuddyBookmarks',
  AIStudyBuddySearchMessages: 'AIStudyBuddySearchMessages',
  
  // Analytics and Insights
  AIStudyBuddyAnalytics: 'AIStudyBuddyAnalytics',
  AIStudyBuddyLearningProgress: 'AIStudyBuddyLearningProgress',
  
  // Integration Features
  AIStudyBuddyGenerateFlashcards: 'AIStudyBuddyGenerateFlashcards',
  AIStudyBuddyGenerateQuiz: 'AIStudyBuddyGenerateQuiz',
  AIStudyBuddyExportChat: 'AIStudyBuddyExportChat',
  
  // Settings and Preferences
  AIStudyBuddySettings: 'AIStudyBuddySettings',
  AIStudyBuddyQuotaStatus: 'AIStudyBuddyQuotaStatus',
  
  // Subscription and Payment (Future Phase)
  AIStudyBuddySubscription: 'AIStudyBuddySubscription',
  AIStudyBuddyPayment: 'AIStudyBuddyPayment',
  AIStudyBuddyUpgrade: 'AIStudyBuddyUpgrade',
  
  // Help and Support
  AIStudyBuddyHelp: 'AIStudyBuddyHelp',
  AIStudyBuddyTutorial: 'AIStudyBuddyTutorial',
  AIStudyBuddyFAQ: 'AIStudyBuddyFAQ',
  
  // Modal/Overlay Screens
  AIStudyBuddyQuotaModal: 'AIStudyBuddyQuotaModal',
  AIStudyBuddyUpgradeModal: 'AIStudyBuddyUpgradeModal',
  AIStudyBuddyFeedbackModal: 'AIStudyBuddyFeedbackModal',
  AIStudyBuddyShareModal: 'AIStudyBuddyShareModal',

  // ==========================================
  // COMMUNITY PLATFORM ROUTES
  // ==========================================
  
  // Core Community Screens
  CommunityDiscovery: 'CommunityDiscovery',
  CommunityProfile: 'CommunityProfile',
  MyCommunities: 'MyCommunities',
  CreateCommunity: 'CreateCommunity',
  
  // Post Management
  CommunityPostDetail: 'CommunityPostDetail',
  CreateCommunityPost: 'CreateCommunityPost',
  EditCommunityPost: 'EditCommunityPost',
  
  // Community Management (Admin/Moderator Features)
  CommunityManagement: 'CommunityManagement',
  CommunitySettings: 'CommunitySettings',
  CommunityMembers: 'CommunityMembers',
  CommunityModeration: 'CommunityModeration',
  CommunityAnalytics: 'CommunityAnalytics',
  CommunityRequests: 'CommunityRequests',
  
  // Member and Moderation Features
  MemberProfile: 'MemberProfile',
  InviteMembers: 'InviteMembers',
  BulkInvite: 'BulkInvite',
  ModerationQueue: 'ModerationQueue',
  AppealManagement: 'AppealManagement',
  
  // Specialized Post Types
  CreatePoll: 'CreatePoll',
  CreateEvent: 'CreateEvent',
  CreateAnnouncement: 'CreateAnnouncement',
  EventDetail: 'EventDetail',
  
  // Discovery and Search
  SearchCommunities: 'SearchCommunities',
  SearchPosts: 'SearchPosts',
  FeaturedCommunities: 'FeaturedCommunities',
  TrendingCommunities: 'TrendingCommunities',
  
  // Engagement Features
  CommunityLeaderboard: 'CommunityLeaderboard',
  CommunityActivity: 'CommunityActivity',
  BookmarkedPosts: 'BookmarkedPosts',
  
  // Notification Management
  CommunityNotifications: 'CommunityNotifications',
  NotificationSettings: 'NotificationSettings',
  
  // Settings and Configuration
  FeedSettings: 'FeedSettings',
  AutomationRules: 'AutomationRules',
  IntegrationManagement: 'IntegrationManagement',
  
  // Sub-communities and Hierarchy
  SubCommunities: 'SubCommunities',
  CommunityHierarchy: 'CommunityHierarchy',
  
  // Modals and Overlays
  JoinCommunityModal: 'JoinCommunityModal',
  LeaveCommunityModal: 'LeaveCommunityModal',
  ReportContentModal: 'ReportContentModal',
  SharePostModal: 'SharePostModal',
  RSVPModal: 'RSVPModal',
  VoteModal: 'VoteModal',
  CommunityHub: 'CommunityHub',
 
};

export default Routes;