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
  AIStudyBuddyHub: 'AIStudyBuddyHub',                     // Main landing page/dashboard
  AIStudyBuddyDashboard: 'AIStudyBuddyDashboard',         // Alternative name for hub
  
  // Core Conversation Features
  AIStudyBuddyChat: 'AIStudyBuddyChat',                   // Main chat interface
  AIStudyBuddyNewSession: 'AIStudyBuddyNewSession',       // Start new study session
  AIStudyBuddySubjectSelection: 'AIStudyBuddySubjectSelection', // Subject/syllabus picker
  
  // Session Management
  AIStudyBuddyActiveSessions: 'AIStudyBuddyActiveSessions', // List of active sessions
  AIStudyBuddySessionHistory: 'AIStudyBuddySessionHistory', // Past conversations
  AIStudyBuddySessionDetails: 'AIStudyBuddySessionDetails', // Individual session details
  
  // Message and Content Management
  AIStudyBuddyBookmarks: 'AIStudyBuddyBookmarks',         // Saved/bookmarked messages
  AIStudyBuddySearchMessages: 'AIStudyBuddySearchMessages', // Search across conversations
  
  // Analytics and Insights
  AIStudyBuddyAnalytics: 'AIStudyBuddyAnalytics',         // Usage analytics and insights
  AIStudyBuddyLearningProgress: 'AIStudyBuddyLearningProgress', // Learning progress tracking
  
  // Integration Features
  AIStudyBuddyGenerateFlashcards: 'AIStudyBuddyGenerateFlashcards', // Flashcard generation
  AIStudyBuddyGenerateQuiz: 'AIStudyBuddyGenerateQuiz',   // Quiz generation
  AIStudyBuddyExportChat: 'AIStudyBuddyExportChat',       // Export conversations
  
  // Settings and Preferences
  AIStudyBuddySettings: 'AIStudyBuddySettings',           // AI Study Buddy preferences
  AIStudyBuddyQuotaStatus: 'AIStudyBuddyQuotaStatus',     // Quota and limits info
  
  // Subscription and Payment (Future Phase)
  AIStudyBuddySubscription: 'AIStudyBuddySubscription',   // Subscription plans
  AIStudyBuddyPayment: 'AIStudyBuddyPayment',             // Payment processing
  AIStudyBuddyUpgrade: 'AIStudyBuddyUpgrade',             // Upgrade to Pro
  
  // Help and Support
  AIStudyBuddyHelp: 'AIStudyBuddyHelp',                   // How to use AI Study Buddy
  AIStudyBuddyTutorial: 'AIStudyBuddyTutorial',           // First-time user tutorial
  AIStudyBuddyFAQ: 'AIStudyBuddyFAQ',                     // Frequently asked questions
  
  // Modal/Overlay Screens
  AIStudyBuddyQuotaModal: 'AIStudyBuddyQuotaModal',       // Quota limit reached modal
  AIStudyBuddyUpgradeModal: 'AIStudyBuddyUpgradeModal',   // Upgrade prompt modal
  AIStudyBuddyFeedbackModal: 'AIStudyBuddyFeedbackModal', // Feedback modal
  AIStudyBuddyShareModal: 'AIStudyBuddyShareModal',       // Share conversation modal


  // ==========================================
// INTELLITEST ROUTES
// ==========================================
IntelliTestHub: 'IntelliTestHub',
IntelliTestExamSelection: 'IntelliTestExamSelection',
IntelliTestAssessmentConfig: 'IntelliTestAssessmentConfig', 
IntelliTestCreateSession: 'IntelliTestCreateSession',
IntelliTestQuestionGeneration: 'IntelliTestQuestionGeneration',
IntelliTestSessionDetails: 'IntelliTestSessionDetails',  
IntelliTestAssessment: 'IntelliTestAssessment',
IntelliStartTestAssessment: 'IntelliStartTestAssessment',
IntelliTestResults: 'IntelliTestResults',
IntelliTestAnalyticsDashboard: 'IntelliTestAnalyticsDashboard',
IntelliTestPerformanceDetails: 'IntelliTestPerformanceDetails',
IntelliTestRoadmapDetails: 'IntelliTestRoadmapDetails',
IntelliTestCreateRoadmap: 'IntelliTestCreateRoadmap',
IntelliTestCustomTopics: 'IntelliTestCustomTopics',
IntelliTestCreateTopic: 'IntelliTestCreateTopic',
IntelliTestTopicDetails: 'IntelliTestTopicDetails',
IntelliTestSessionHistory: 'IntelliTestSessionHistory', 
};

export default Routes;