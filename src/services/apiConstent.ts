//src/services/apiConstent.ts
export const API = {
  BASE_URL: 'http://localhost:3000/api/',
  BASE_URL1: 'https://api.scaleupapp.club/api/',
  SIGNIN: 'auth/login',
  REGISTER: 'auth/register',
  APPLY_REFERRAL_CODE: 'auth/applyReferralCode',
  GET_REFERRAL_CODE: 'auth/referral',
  PROFILE: 'users/profile',
  ALL_CONTENT: 'content/all-content',
  CONTENT_ACCESS: 'content/content-access', // 👈 Add this
  ALL_VIDEOS: 'content/allcontent',
  EDUCATION_DETAIL: 'users/education',
  WORK_EXPERIENCE: 'users/work-experience',
  USER_PROFILE: 'users/profiles',
  HOMEPAGE: 'content/homepage',
  RECOMMEND: 'content/recommendations',
  FOLLOWERS_LIST: 'content/all-follower',
  SEARCH_USER: 'content/search-users',
  ADD_COMMENT: 'content/add-comment',
  GET_COMMENT: 'content/comment',
  CONTENT_CREATE: 'content/create',
  LIKE_REQUEST: 'content/like',
  UNLIKE_REQUEST: 'content/unlike',
  CONTENT_DETAIL: 'content/detail',
  FOLLOW_USER: 'content/follow',
  UNFOLLOW: 'content/unfollow',
  USER_BLOCK: 'users/block',
  USER_UNBLOCK: 'users/unblock',
  BLOCK_USER_LIST: 'users/blocked-users',
  CONTENT_VERIFY: 'content/verify',
  CHANGE_PASSWORD: 'users/change-password',
  AUTH_OTP: 'auth/otp-gen',
  OTP_VERIFY: 'auth/otp-verify',
  OTP_PASSWORD: 'auth/password-gen',
  AUTH_RESET: 'auth/reset-password',
  MARK_READ: 'content/notifications/mark-as-read',
  COMMENT_PRIVILEGE: 'users/updateCommentPrivileges',
  DELETE_ACCOUNT: 'auth/delete-account',
  USER_COURSES: 'users/courses',
  USER_CERTIFICATION: 'users/certifications',
  VERIFICATION: 'content/pending-verification',
  DELETE_CONTENT: 'content/delete',
  INCREMENT_VIEW_COUNT: 'content/view',
  POST_FEEDBACK: 'users/submitfeedback',
  GET_FEEDBACK: 'users/feedback/status',
  COMMENT: 'content/comments',
  PREFERENCES: 'users/preferences',
  EDUCATION: 'users/education',
  EXPERIENCE: 'users/work-experience',
  CERTIFICATION: 'users/certification',
  PROJECTS: 'users/project',
  PROFILE_DETAIL: 'users/profile',
  PROFILE_CONTENT: 'content/detail',
  LIKEPOST: 'content/like',
  UNLIKEPOST: 'content/unlike',
  SAVE: 'content/save',
  UNSAVE: 'content/unsave',
  SAVED_POSTS: 'content/saved-content',
  NOTIFICATION: 'content/notifications',
  INNERCIRCLE: 'users/inner-circle/sent-requests',
  ACCEPTREQ: 'users/inner-circle/handle-request',
  WIDRAW: 'users/inner-circle/withdraw',
  REMOVEREQ: 'users/inner-circle/remove',
  GETINNERCIRCLE: 'users/inner-circle-users',
  SENDINNERREQUEST: 'users/inner-circle/request',
  REPORTPOST: 'content/report',
  SAVE_FCM: 'users/saveFcmToken',
  USERANALYTICS: 'users/user-analytics',
  CONVERSATION: 'conversation/fetch-all',
  CREATECONVERSATION: 'conversation/create',
  SENDMESSAGE: 'chat/send',
  CHAT: 'chat',
  CREATE_GROUP: 'chat/create',
  SEND_GROUP_MSG: 'chat/group/send',
  RAPIDFIRE_CREATE: 'rapidfire-quiz/create',
  RAPIDFIRE_EDIT: 'rapidfire-quiz/edit',
  RAPIDFIRE_LIST: 'rapidfire-quiz/list',
  RAPIDFIRE_SEARCH: 'rapidfire-quiz/search',
  RAPIDFIRE_RECOMMEND: 'rapidfire-quiz/recommend',
  USER_QUIZ_ATTEMPTS: 'rapidfire-quiz/user-attempts', // New endpoint for fetching user quiz attempts
  FOLLOWING_LIST:'content/all-following',
  INNERCIRCLERECIVED:'users/inner-circle/received-requests',
  USER_PAYMENT_DETAILS_CHECK: 'users/payment-details-check',
  SAVE_UPI_DETAILS: 'users/save-upi-details',
  SAVE_BANK_DETAILS: 'users/save-bank-details',
  MIXPANEL:'ec35d7fc43e04586bbf6da1bf00dac9d',


    // USER QUIZ ENDPOINTS
    USER_QUIZ_CREATE: 'user-quiz/create',
    USER_QUIZ_UPDATE_DRAFT: 'user-quiz/:id/draft',
    USER_QUIZ_SUBMIT: 'user-quiz/:id/submit',
    USER_QUIZ_DRAFTS: 'user-quiz/drafts',
    USER_QUIZ_DELETE_DRAFT: 'user-quiz/draft/:id',
    USER_QUIZ_PUBLIC: 'user-quiz/public',
    USER_QUIZ_SEARCH: 'user-quiz/search',
    USER_QUIZ_BY_SHARE_ID: 'user-quiz/shared/:shareId',
    USER_QUIZ_BY_ID: 'user-quiz/:id',
    USER_QUIZ_DELETE: 'user-quiz/:id',
    
    // AI QUESTION GENERATION
    USER_QUIZ_AI_GENERATE: 'user-quiz/ai/generate',
    USER_QUIZ_AI_PRICE: 'user-quiz/ai/price',
    USER_QUIZ_AI_USAGE: 'user-quiz/ai/usage',
    USER_QUIZ_AI_TRANSACTIONS: 'user-quiz/ai/transactions',
    USER_QUIZ_AI_PAYMENT_INIT: 'user-quiz/ai/payment/initiate',
    USER_QUIZ_AI_PAYMENT_VERIFY: 'user-quiz/ai/payment/verify',
    USER_QUIZ_AI_WEBHOOK: 'user-quiz/ai/payment/webhook',
    USER_QUIZ_AI_REFUND: 'user-quiz/ai/refund/:transactionId',
    
    // CREATOR DASHBOARD
    USER_QUIZ_DASHBOARD: 'user-quiz/dashboard',
    USER_QUIZ_STATS: 'user-quiz/stats',
    USER_QUIZ_MY_QUIZZES: 'user-quiz/my-quizzes',
    USER_QUIZ_ANALYTICS: 'user-quiz/analytics/:id',
    USER_QUIZ_PARTICIPANTS: 'user-quiz/participants/:id',
    USER_QUIZ_BADGES: 'user-quiz/badges',
    USER_QUIZ_EARNINGS: 'user-quiz/earnings',
    USER_QUIZ_CREATOR_LEADERBOARD: 'user-quiz/creator-leaderboard',
    
    // ACCESS CONTROL
    USER_QUIZ_ACCESS_REQUEST: 'user-quiz/access/:quizId',
    USER_QUIZ_ACCESS_MY_REQUESTS: 'user-quiz/access/my-requests',
    USER_QUIZ_ACCESS_QUIZ_REQUESTS: 'user-quiz/access/quiz/:quizId',
    USER_QUIZ_ACCESS_APPROVE: 'user-quiz/access/approve/:id',
    USER_QUIZ_ACCESS_REJECT: 'user-quiz/access/reject/:id',
    USER_QUIZ_ACCESS_BULK_APPROVE: 'user-quiz/access/bulk-approve',
    USER_QUIZ_ACCESS_BULK_REJECT: 'user-quiz/access/bulk-reject',
    
    // SHARING
    USER_QUIZ_SHARE_QR: 'user-quiz/share/qr/:id',
    USER_QUIZ_SHARE_TRACK: 'user-quiz/share/track/:id',
    USER_QUIZ_SHARE_STATS: 'user-quiz/share/stats/:id',
    USER_QUIZ_SHARE_ANALYTICS: 'user-quiz/share/analytics',
    
    // ADMIN REVIEW
    USER_QUIZ_REVIEW_PENDING: 'user-quiz/review/pending',
    USER_QUIZ_REVIEW_DETAILS: 'user-quiz/review/:id',
    USER_QUIZ_REVIEW_APPROVE: 'user-quiz/review/approve/:id',
    USER_QUIZ_REVIEW_REJECT: 'user-quiz/review/reject/:id',
    USER_QUIZ_REVIEW_AI_TRIGGER: 'user-quiz/review/ai/:id',
    USER_QUIZ_REVIEW_STATS: 'user-quiz/review/stats',

  // ==========================================
  // LEARNING ASSISTANT - EXPLANATION SYSTEM
  // ==========================================
  EXPLAIN_ANSWER: 'learning-assistant/explain-answer',
  EXPLANATION_QUOTA: 'learning-assistant/explanation-quota',
  PURCHASE_EXPLANATIONS: 'learning-assistant/purchase-explanations',
  
  // ==========================================
  // LEARNING ASSISTANT - LEARNING VAULT
  // ==========================================
  LEARNING_VAULT: 'learning-assistant/learning-vault',
  LEARNING_VAULT_FAVORITE: 'learning-assistant/learning-vault/:explanationId/favorite',
  LEARNING_VAULT_NOTE: 'learning-assistant/learning-vault/:explanationId/note',
  LEARNING_VAULT_DOWNLOAD: 'learning-assistant/learning-vault/download',
  
  // ==========================================
  // LEARNING ASSISTANT - AREA INSIGHTS
  // ==========================================
  AREA_INSIGHTS: 'learning-assistant/area-insights',
  AREA_INSIGHTS_DETAIL: 'learning-assistant/area-insights/:topic',
  AREA_INSIGHTS_PURCHASE: 'learning-assistant/area-insights/purchase',
  AREA_INSIGHTS_SET_GOAL: 'learning-assistant/area-insights/:topic/set-goal',
  
  // ==========================================
  // LEARNING ASSISTANT - ANALYTICS & PAYMENT
  // ==========================================
  LEARNING_ANALYTICS: 'learning-assistant/analytics',
  LEARNING_CREATE_ORDER: 'learning-assistant/create-order',
  LEARNING_VERIFY_PAYMENT: 'learning-assistant/verify-payment',

  // ==========================================
  // FLASHCARD SYSTEM API ENDPOINTS
  // ==========================================
  
  // DECK MANAGEMENT
  FLASHCARD_DECKS: 'flashcards/decks',
  FLASHCARD_DECK_CREATE: 'flashcards/decks',
  FLASHCARD_DECK_DETAILS: 'flashcards/decks/:deckId',
  FLASHCARD_DECK_UPDATE: 'flashcards/decks/:deckId',
  FLASHCARD_DECK_DELETE: 'flashcards/decks/:deckId',
  FLASHCARD_DECK_EXPORT: 'flashcards/export/:deckId',
  
  // DOCUMENT PROCESSING
  FLASHCARD_UPLOAD_DOCUMENT: 'flashcards/upload',
  FLASHCARD_PROCESSING_STATUS: 'flashcards/processing/:processingId',
  
  // STUDY SESSIONS
  FLASHCARD_STUDY_START: 'flashcards/study/:deckId',
  FLASHCARD_STUDY_ANSWER: 'flashcards/study/answer/:cardId',
  FLASHCARD_STUDY_STATS: 'flashcards/stats/:deckId',
  FLASHCARD_DUE_CARDS: 'flashcards/due-cards/:deckId',
  
  // CARD MANAGEMENT
  FLASHCARD_CARDS: 'flashcards/cards',
  FLASHCARD_CARD_UPDATE: 'flashcards/cards/:cardId',
  FLASHCARD_CARD_DELETE: 'flashcards/cards/:cardId',
  
  // PUBLIC DECKS
  FLASHCARD_PUBLIC_DECKS: 'public/flashcards/decks',
  FLASHCARD_PUBLIC_SUBJECTS: 'public/flashcards/subjects/popular',
  FLASHCARD_PUBLIC_TRENDING: 'public/flashcards/trending',
  FLASHCARD_PUBLIC_SEARCH: 'public/flashcards/search',
  FLASHCARD_PUBLIC_PREVIEW: 'public/flashcards/decks/:deckId/preview',
  FLASHCARD_PUBLIC_TEMPLATES: 'public/flashcards/subjects/:subject/templates',
  
  // CRAM MODE
  FLASHCARD_CRAM_SESSION: 'flashcards/cram/decks/:deckId/cram-session',
  FLASHCARD_CRAM_RECOMMENDATIONS: 'flashcards/cram/decks/:deckId/cram-recommendations',
  
  // SUMMARIES & AI FEATURES
  FLASHCARD_SUMMARY_GENERATE: 'flashcards/summary/decks/:deckId/generate-summary',
  FLASHCARD_SUMMARY_QUICK_REVIEW: 'flashcards/summary/decks/:deckId/quick-review-from-source',
  FLASHCARD_SUMMARY_FORMULA_SHEET: 'flashcards/summary/decks/:deckId/formula-sheet-from-source',
  FLASHCARD_SUMMARY_COMPREHENSIVE: 'flashcards/summary/decks/:deckId/comprehensive-summary-from-source',
  
  // ADMIN
  FLASHCARD_ADMIN_STATS: 'admin/flashcards/stats',
  FLASHCARD_ADMIN_PROCESSING_JOBS: 'admin/flashcards/processing-jobs',
  FLASHCARD_ADMIN_CLEANUP: 'admin/flashcards/cleanup',
  FLASHCARD_ADMIN_USERS: 'admin/flashcards/users/:userId',
  FLASHCARD_ADMIN_TEMPLATES: 'admin/flashcards/templates',
  
  // ==========================================
// AI STUDY BUDDY - CORE CONVERSATION
// ==========================================
AI_STUDY_BUDDY_SESSION_INIT: 'ai-study-buddy/session/init',
AI_STUDY_BUDDY_SEND_MESSAGE: 'ai-study-buddy/session/:sessionId/message',
AI_STUDY_BUDDY_GET_HISTORY: 'ai-study-buddy/session/:sessionId/history',

// ==========================================
// AI STUDY BUDDY - SESSION MANAGEMENT  
// ==========================================
AI_STUDY_BUDDY_ACTIVE_SESSIONS: 'ai-study-buddy/sessions/active',
AI_STUDY_BUDDY_SESSION_HISTORY: 'ai-study-buddy/sessions/history',
AI_STUDY_BUDDY_SESSION_DETAILS: 'ai-study-buddy/session/:sessionId/details',
AI_STUDY_BUDDY_UPDATE_SESSION: 'ai-study-buddy/session/:sessionId',
AI_STUDY_BUDDY_DELETE_SESSION: 'ai-study-buddy/session/:sessionId',
AI_STUDY_BUDDY_USER_ANALYTICS: 'ai-study-buddy/analytics',
AI_STUDY_BUDDY_BOOKMARKS: 'ai-study-buddy/bookmarks',

// ==========================================
// AI STUDY BUDDY - MESSAGE INTERACTIONS
// ==========================================
AI_STUDY_BUDDY_MESSAGE_REACT: 'ai-study-buddy/message/:messageId/react',
AI_STUDY_BUDDY_MESSAGE_BOOKMARK: 'ai-study-buddy/message/:messageId/bookmark',

// ==========================================
// AI STUDY BUDDY - QUOTA & LIMITS
// ==========================================
AI_STUDY_BUDDY_QUOTA_STATUS: 'ai-study-buddy/quota/status',
AI_STUDY_BUDDY_ADD_BONUS_QUOTA: 'ai-study-buddy/quota/bonus',
AI_STUDY_BUDDY_RESET_QUOTA: 'ai-study-buddy/quota/reset',

// ==========================================
// AI STUDY BUDDY - SUBSCRIPTION (Future)
// ==========================================
AI_STUDY_BUDDY_SUBSCRIPTION_PLANS: 'ai-study-buddy/subscription/plans',
AI_STUDY_BUDDY_CREATE_ORDER: 'ai-study-buddy/subscription/create-order',
AI_STUDY_BUDDY_VERIFY_PAYMENT: 'ai-study-buddy/subscription/verify-payment',
AI_STUDY_BUDDY_CURRENT_SUBSCRIPTION: 'ai-study-buddy/subscription/current',
AI_STUDY_BUDDY_CANCEL_SUBSCRIPTION: 'ai-study-buddy/subscription/cancel',
AI_STUDY_BUDDY_SEARCH_MESSAGES: 'ai-study-buddy/search',

// ==========================================
// AI STUDY BUDDY - INTEGRATIONS
// ==========================================
AI_STUDY_BUDDY_GENERATE_FLASHCARDS: 'ai-study-buddy/session/:sessionId/generate-flashcards',
AI_STUDY_BUDDY_GENERATE_QUIZ: 'ai-study-buddy/session/:sessionId/generate-quiz',
AI_STUDY_BUDDY_UPDATE_AREAS: 'ai-study-buddy/session/:sessionId/update-areas',
AI_STUDY_BUDDY_EXPORT_CONVERSATION: 'ai-study-buddy/session/:sessionId/export',
AI_STUDY_BUDDY_DOWNLOAD_EXPORT: 'ai-study-buddy/download/:filename',

// ==========================================
// AI STUDY BUDDY - CONFIGURATION & UTILITIES
// ==========================================
AI_STUDY_BUDDY_SUBJECTS_CONFIG: 'ai-study-buddy/config/subjects',
AI_STUDY_BUDDY_FEATURES: 'ai-study-buddy/features',
AI_STUDY_BUDDY_HEALTH: 'ai-study-buddy/health',


// ==========================================
// INTELLITEST - AI-POWERED ASSESSMENT SYSTEM
// ==========================================

// CORE ASSESSMENT FLOW
INTELLITEST_AVAILABLE_EXAMS: 'intellitest/available-exams',
INTELLITEST_CREATE_SESSION: 'intellitest/create-session',
INTELLITEST_START_SESSION: 'intellitest/start-session',
INTELLITEST_CURRENT_QUESTION: 'intellitest/current-question/:sessionId',
INTELLITEST_SUBMIT_ANSWER: 'intellitest/submit-answer',
INTELLITEST_NAVIGATE_QUESTION: 'intellitest/navigate',
INTELLITEST_END_SESSION: 'intellitest/end-session',

// SESSION MANAGEMENT
INTELLITEST_PAUSE_SESSION: 'intellitest/pause-session',
INTELLITEST_RESUME_SESSION: 'intellitest/resume-session',
INTELLITEST_SESSION_SUMMARY: 'intellitest/session-summary/:sessionId',
INTELLITEST_SESSION_HISTORY: 'intellitest/session-history',

// PERFORMANCE ANALYTICS
INTELLITEST_PERFORMANCE_ANALYSIS: 'intellitest/performance/analysis/:examId',
INTELLITEST_GENERATE_INSIGHTS: 'intellitest/performance/generate-insights',
INTELLITEST_PEER_COMPARISON: 'intellitest/performance/peer-comparison/:examId',

// LEARNING ROADMAPS
INTELLITEST_GENERATE_ROADMAP: 'intellitest/roadmap/generate',
INTELLITEST_GET_ROADMAP: 'intellitest/roadmap/:roadmapId',
INTELLITEST_DAILY_PLAN: 'intellitest/roadmap/:roadmapId/daily-plan',
INTELLITEST_SPECIFIC_DATE_PLAN: 'intellitest/roadmap/:roadmapId/daily-plan/:date',
INTELLITEST_UPDATE_DAILY_PROGRESS: 'intellitest/roadmap/:roadmapId/daily-progress',
INTELLITEST_COMPLETE_MILESTONE: 'intellitest/roadmap/:roadmapId/milestone/:milestoneId/complete',
INTELLITEST_ADAPT_ROADMAP: 'intellitest/roadmap/:roadmapId/adapt',
INTELLITEST_ROADMAP_ANALYTICS: 'intellitest/roadmap/:roadmapId/analytics',
INTELLITEST_ROADMAP_HISTORY: 'intellitest/roadmap/history',

// CUSTOM TOPICS
INTELLITEST_CUSTOM_TOPICS: 'intellitest/custom-topics',
INTELLITEST_CREATE_CUSTOM_TOPIC: 'intellitest/custom-topics/create',
INTELLITEST_CUSTOM_TOPIC_DETAILS: 'intellitest/custom-topics/:topicId',
INTELLITEST_UPDATE_CUSTOM_TOPIC: 'intellitest/custom-topics/:topicId',
INTELLITEST_DELETE_CUSTOM_TOPIC: 'intellitest/custom-topics/:topicId',
INTELLITEST_TRENDING_TOPICS: 'intellitest/custom-topics/trending',
INTELLITEST_SEARCH_TOPICS: 'intellitest/custom-topics/search',

// ADMIN & TESTING
INTELLITEST_HEALTH: 'intellitest/health',
INTELLITEST_SEED_EXAMS: 'intellitest/test/seed-exams',

  // ==========================================
  // DOMAIN VERIFICATION API ENDPOINTS
  // ==========================================
  SEND_DOMAIN_OTP: 'auth/send-domain-otp',
  VERIFY_DOMAIN_OTP: 'auth/verify-domain-otp',
  DOMAIN_CHECK_TYPE: 'domain-verification/check-type',
  DOMAIN_SEND_VERIFICATION_OTP: 'domain-verification/send-verification-otp',
  DOMAIN_VERIFY_OTP: 'domain-verification/verify-otp',
  DOMAIN_REQUEST_MANUAL_VERIFICATION: 'domain-verification/request-manual-verification',
  DOMAIN_WHITELIST: 'domain-verification/whitelist',
  DOMAIN_WHITELIST_ADD: 'domain-verification/whitelist/add',
  
  // ==========================================
  // COMMUNITY PLATFORM API ENDPOINTS
  // ==========================================
  
  // COMMUNITY MANAGEMENT - DISCOVERY & CORE
  COMMUNITIES: 'communities',
  COMMUNITIES_SEARCH: 'communities/search/communities',
  COMMUNITIES_FEATURED: 'communities/featured/list',
  COMMUNITIES_TRENDING: 'communities/trending/list',
  COMMUNITIES_CATEGORIES: 'communities/categories/list',
  COMMUNITIES_TYPES: 'communities/types/list',
  COMMUNITIES_PLATFORM_STATS: 'communities/platform/stats',
  COMMUNITIES_MY_LIST: 'communities/my-communities/list',
  COMMUNITIES_MY_SUMMARY: 'communities/my-communities/summary',
  COMMUNITIES_SUGGESTIONS_INSTITUTIONAL: 'communities/suggestions/institutional',
  COMMUNITIES_AUTO_JOIN_DOMAIN: 'communities/auto-join-domain',
  COMMUNITIES_RECOMMENDATIONS_PERSONALIZED: 'communities/recommendations/personalized',
  COMMUNITIES_BULK_JOIN: 'communities/bulk/join',
  COMMUNITIES_BULK_LEAVE: 'communities/bulk/leave',
  COMMUNITIES_LOCATION: 'communities/location/:location',
  
  // COMMUNITY MANAGEMENT - CRUD OPERATIONS
  COMMUNITIES_CREATE: 'communities',
  COMMUNITIES_CREATE_FROM_TEMPLATE: 'communities/from-template',
  COMMUNITIES_DETAILS: 'communities/:communityId',
  COMMUNITIES_UPDATE: 'communities/:communityId',
  COMMUNITIES_DELETE: 'communities/:communityId',
  COMMUNITIES_ARCHIVE: 'communities/:communityId/archive',
  COMMUNITIES_RESTORE: 'communities/:communityId/restore',
  COMMUNITIES_TRANSFER_OWNERSHIP: 'communities/:communityId/transfer-ownership',
  
  // COMMUNITY MANAGEMENT - ANALYTICS & INSIGHTS
  COMMUNITIES_STATS: 'communities/:communityId/stats',
  COMMUNITIES_STATS_PUBLIC: 'communities/:communityId/stats/public',
  COMMUNITIES_ANALYTICS: 'communities/:communityId/analytics',
  COMMUNITIES_HEALTH: 'communities/:communityId/health',
  COMMUNITIES_ACTIVITY: 'communities/:communityId/activity',
  COMMUNITIES_INSIGHTS: 'communities/:communityId/insights',
  
  // COMMUNITY MANAGEMENT - STRUCTURE & ORGANIZATION
  COMMUNITIES_HIERARCHY: 'communities/:communityId/hierarchy',
  COMMUNITIES_SUB_COMMUNITIES: 'communities/:communityId/sub-communities',
  COMMUNITIES_SIMILAR: 'communities/:communityId/similar',
  COMMUNITIES_EXPORT: 'communities/:communityId/export',
  COMMUNITIES_GENERATE_REPORT: 'communities/:communityId/generate-report',
  COMMUNITIES_DUPLICATE: 'communities/:communityId/duplicate',
  COMMUNITIES_TEMPLATE: 'communities/:communityId/template',
  
  // COMMUNITY MANAGEMENT - USER INTERACTIONS
  COMMUNITIES_BOOKMARK: 'communities/:communityId/bookmark',
  COMMUNITIES_REMOVE_BOOKMARK: 'communities/:communityId/bookmark',
  COMMUNITIES_FOLLOW: 'communities/:communityId/follow',
  COMMUNITIES_UNFOLLOW: 'communities/:communityId/follow',
  COMMUNITIES_REPORT: 'communities/:communityId/report',
  COMMUNITIES_VERIFY_INSTITUTIONAL: 'communities/:communityId/verify-institutional',
  
  // COMMUNITY MANAGEMENT - FEED CONFIGURATION
  COMMUNITIES_FEED_CONFIG: 'communities/:communityId/feed-config',
  COMMUNITIES_FEED_CONFIG_UPDATE: 'communities/:communityId/feed-config',
  
  // COMMUNITY POSTS - CORE OPERATIONS
  COMMUNITY_POSTS: 'communities/:communityId/posts',
  COMMUNITY_POST_CREATE: 'communities/:communityId/posts',
  COMMUNITY_POST_DETAILS: 'communities/:communityId/posts/:postId',
  COMMUNITY_POST_UPDATE: 'communities/:communityId/posts/:postId',
  COMMUNITY_POST_DELETE: 'communities/:communityId/posts/:postId',
  COMMUNITY_POST_SEARCH: 'communities/:communityId/posts/search',
  
  // COMMUNITY POSTS - MEDIA & UPLOADS
  COMMUNITY_POSTS_UPLOAD_MEDIA: 'communities/:communityId/posts/upload-media',
  
  // COMMUNITY POSTS - POST TYPES
  COMMUNITY_POSTS_POLL: 'communities/:communityId/posts/poll',
  COMMUNITY_POSTS_EVENT: 'communities/:communityId/posts/event',
  COMMUNITY_POSTS_ANNOUNCEMENT: 'communities/:communityId/posts/announcement',
  COMMUNITY_POSTS_SCHEDULE: 'communities/:communityId/posts/schedule',
  
  // COMMUNITY POSTS - MODERATION & MANAGEMENT
  COMMUNITY_POSTS_PIN: 'communities/:communityId/posts/:postId/pin',
  COMMUNITY_POSTS_FEATURE: 'communities/:communityId/posts/:postId/feature',
  COMMUNITY_POSTS_BULK_PIN: 'communities/:communityId/posts/bulk-pin',
  COMMUNITY_POSTS_BULK_DELETE: 'communities/:communityId/posts/bulk-delete',
  
  // COMMUNITY POSTS - ANALYTICS
  COMMUNITY_POSTS_ANALYTICS: 'communities/:communityId/posts/:postId/analytics',
  COMMUNITY_POSTS_CONTENT_OVERVIEW: 'communities/:communityId/posts/content-overview',
  
  // COMMUNITY POSTS - ENCRYPTION
  COMMUNITY_POSTS_TEST_ENCRYPTION: 'communities/test-encryption',
  COMMUNITY_POSTS_ENCRYPTION_STATUS: 'communities/:communityId/posts/:postId/encryption-status',
  COMMUNITY_POSTS_ENCRYPTION_STATS: 'communities/:communityId/posts/encryption-stats',
  COMMUNITY_POSTS_MIGRATE_ENCRYPTION: 'communities/:communityId/posts/migrate-encryption',
  
  // COMMUNITY INTERACTIONS - POST INTERACTIONS
  COMMUNITY_POST_VOTE: 'communities/:communityId/posts/:postId/vote',
  COMMUNITY_POST_COMMENTS: 'communities/:communityId/posts/:postId/comments',
  COMMUNITY_POST_POLL_VOTE: 'communities/:communityId/posts/:postId/poll/vote',
  COMMUNITY_POST_EVENT_RSVP: 'communities/:communityId/posts/:postId/event/rsvp',
  COMMUNITY_POST_SHARE: 'communities/:communityId/posts/:postId/share',
  COMMUNITY_POST_BOOKMARK: 'communities/:communityId/posts/:postId/bookmark',
  COMMUNITY_POST_REPORT: 'communities/:communityId/posts/:postId/report',
  COMMUNITY_POST_INTERACTIONS: 'communities/:communityId/posts/:postId/interactions',
  
  // COMMUNITY MEMBERS - CORE OPERATIONS
  COMMUNITY_MEMBERS: 'communities/:communityId/members',
  COMMUNITY_MEMBERS_JOIN: 'communities/:communityId/members/join',
  COMMUNITY_MEMBERS_LEAVE: 'communities/:communityId/members/leave',
  COMMUNITY_MEMBER_DETAILS: 'communities/:communityId/members/:memberId',
  COMMUNITY_MEMBERS_SEARCH: 'communities/:communityId/members/search',
  COMMUNITY_MEMBERS_EXPORT: 'communities/:communityId/members/export',
  
  // COMMUNITY MEMBERS - INVITATIONS & REQUESTS
  COMMUNITY_MEMBERS_INVITE: 'communities/:communityId/members/invite',
  
  // COMMUNITY MEMBERS - ROLE MANAGEMENT
  COMMUNITY_MEMBER_UPDATE_ROLE: 'communities/:communityId/members/:memberId/role',
  COMMUNITY_MEMBER_UPDATE_IMPACT_POINTS: 'communities/:communityId/members/:memberId/impact-points',
  
  // COMMUNITY MEMBERS - ANALYTICS & LEADERBOARD
  COMMUNITY_MEMBER_ANALYTICS: 'communities/:communityId/members/:memberId/analytics',
  COMMUNITY_LEADERBOARD: 'communities/:communityId/leaderboard',
  
  // COMMUNITY MEMBERS - BULK OPERATIONS
  COMMUNITY_MEMBERS_BULK: 'communities/:communityId/members/bulk',
  
  // COMMUNITY MEMBERS - MODERATION
  COMMUNITY_MEMBER_SUSPEND: 'communities/:communityId/members/:userId/suspend',
  COMMUNITY_MEMBER_BAN: 'communities/:communityId/members/:userId/ban',
  
  // COMMUNITY MEMBERS - NOTIFICATIONS
  COMMUNITY_MEMBERS_NOTIFICATIONS: 'communities/:communityId/members/notifications',
  
  // COMMUNITY MODERATION - CONTENT MODERATION
  COMMUNITY_MODERATION_CONTENT: 'communities/:communityId/moderation/content',
  COMMUNITY_MODERATION_USER_BAN: 'communities/:communityId/moderation/users/:userId/ban',
  COMMUNITY_MODERATION_AUTO_MODERATE: 'communities/:communityId/moderation/auto-moderate',
  COMMUNITY_MODERATION_QUEUE: 'communities/:communityId/moderation/queue',
  COMMUNITY_MODERATION_SETTINGS: 'communities/:communityId/moderation/settings',
  
  // COMMUNITY MODERATION - APPEALS
  COMMUNITY_MODERATION_APPEAL_REVIEW: 'communities/:communityId/moderation/appeals/:appealId/review',
  
  // COMMUNITY NOTIFICATIONS - CORE
  COMMUNITY_NOTIFICATIONS_CREATE: 'communities/:communityId/notifications',
  COMMUNITY_NOTIFICATIONS: 'communities/:communityId/notifications',
  COMMUNITY_NOTIFICATION_UPDATE: 'communities/:communityId/notifications/:notificationId',
  COMMUNITY_NOTIFICATIONS_PREFERENCES: 'communities/:communityId/notifications/preferences',
  COMMUNITY_NOTIFICATIONS_DIGEST: 'communities/:communityId/notifications/digest',
  
  // COMMUNITY REQUESTS - REQUEST MANAGEMENT
  COMMUNITY_REQUESTS_CREATE: 'communities/:communityId/requests',
  COMMUNITY_REQUESTS_PROCESS: 'communities/:communityId/requests/:requestId/process',
  COMMUNITY_REQUESTS_BULK_INVITE: 'communities/:communityId/requests/bulk-invite',
  COMMUNITY_REQUESTS_QUEUE: 'communities/:communityId/requests/queue',
  COMMUNITY_REQUESTS_CANCEL: 'communities/:communityId/requests/:requestId',
  COMMUNITY_REQUESTS_HISTORY: 'communities/:communityId/requests/history',
  COMMUNITY_REQUESTS_AUTO_PROCESS: 'communities/:communityId/requests/auto-process',
  
  // COMMUNITY SETTINGS - CONFIGURATION
  COMMUNITY_SETTINGS: 'communities/:communityId/settings',
  COMMUNITY_SETTINGS_UPDATE: 'communities/:communityId/settings',
  COMMUNITY_SETTINGS_AUTOMATION: 'communities/:communityId/settings/automation',
  COMMUNITY_SETTINGS_INTEGRATIONS: 'communities/:communityId/settings/integrations',
  
  
};