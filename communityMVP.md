# Community MVP - Complete API Documentation
## Frontend Development Bible

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer Token (JWT)  
**Last Updated:** January 2024

---

## 📑 Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Community Management](#2-community-management)
3. [Community Discovery & Search](#3-community-discovery--search)
4. [Community Membership](#4-community-membership)
5. [Content Management](#5-content-management)
6. [User Interactions](#6-user-interactions)
7. [Community Settings & Administration](#7-community-settings--administration)
8. [Notifications](#8-notifications)
9. [Analytics & Insights](#9-analytics--insights)
10. [File Upload & Media](#10-file-upload--media)

---

## 🔐 1. Authentication & User Management

### 1.1 User Registration

**Endpoint:** `POST /api/auth/register`  
**Authentication:** None  
**Purpose:** Register a new user account with institutional domain verification

**User Flow:**
1. User fills registration form with email, password, personal details
2. System validates email domain against institutional domains
3. User receives verification email (if email verification enabled)
4. Account created and JWT token returned

**Validations:**
- Email must be valid format and unique
- Password minimum 8 characters, must include uppercase, lowercase, number, special char
- Username 3-30 characters, alphanumeric and underscore only
- Phone number must be valid format
- Institutional domain must be recognized (if isInstitutionalUser = true)

**Request Body:**
```json
{
  "username": "string (required, 3-30 chars, unique)",
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 8 chars, complex)",
  "confirmPassword": "string (required, must match password)",
  "phoneNumber": "string (required, valid format)",
  "firstname": "string (required, 2-50 chars)",
  "lastname": "string (required, 2-50 chars)",
  "institutionalDomain": "string (optional, auto-detected from email)",
  "isInstitutionalUser": "boolean (default: true)",
  "dateOfBirth": "string (optional, ISO date)",
  "gender": "string (optional, enum: ['male', 'female', 'other', 'prefer_not_to_say'])",
  "termsAccepted": "boolean (required, must be true)",
  "privacyAccepted": "boolean (required, must be true)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe_123",
      "email": "john.doe@university.edu",
      "firstname": "John",
      "lastname": "Doe",
      "phoneNumber": "+1234567890",
      "role": "User",
      "isInstitutionalUser": true,
      "institutionalDomain": "university.edu",
      "domainType": "educational",
      "profilePicture": "https://avatar.vercel.sh/john_doe_123",
      "badges": ["Novice"],
      "isEmailVerified": false,
      "isBasicProfileComplete": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "refreshToken": "refresh_token_here"
  }
}
```

**Error Responses:**
```json
// Validation Error (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email already exists",
      "password": "Password must contain at least 8 characters with uppercase, lowercase, number and special character"
    }
  }
}

// Domain Not Recognized (422)
{
  "success": false,
  "error": {
    "code": "INVALID_DOMAIN",
    "message": "Institutional domain not recognized",
    "details": {
      "domain": "unknown-university.edu",
      "suggestion": "Contact support to add your institution"
    }
  }
}
```

### 1.2 User Login

**Endpoint:** `POST /api/auth/login`  
**Authentication:** None  
**Purpose:** Authenticate user and return access token

**User Flow:**
1. User enters username/email and password
2. System validates credentials
3. JWT token returned for authenticated sessions
4. User redirected to dashboard/communities

**Validations:**
- Username or email required
- Password required
- Account must be active (not suspended/deleted)
- Email verification may be required based on settings

**Request Body:**
```json
{
  "identifier": "string (required, username or email)",
  "password": "string (required)",
  "rememberMe": "boolean (optional, default: false)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe_123",
      "email": "john.doe@university.edu",
      "firstname": "John",
      "lastname": "Doe",
      "profilePicture": "https://avatar.vercel.sh/john_doe_123",
      "role": "User",
      "lastLoginDate": "2024-01-15T10:30:00.000Z",
      "streakCount": 5,
      "badges": ["Novice", "Regular"],
      "communities": {
        "joined": 12,
        "owned": 2,
        "favorites": 5
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "refreshToken": "refresh_token_here"
  }
}
```

**Error Responses:**
```json
// Invalid Credentials (401)
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}

// Account Suspended (403)
{
  "success": false,
  "error": {
    "code": "ACCOUNT_SUSPENDED",
    "message": "Account has been suspended",
    "details": {
      "suspensionReason": "Community guidelines violation",
      "suspendedUntil": "2024-01-30T00:00:00.000Z"
    }
  }
}
```

### 1.3 Get Current User Profile

**Endpoint:** `GET /api/auth/me`  
**Authentication:** Bearer Token Required  
**Purpose:** Retrieve current authenticated user's profile information

**User Flow:**
1. Used on app initialization to get current user context
2. Called after login to populate user interface
3. Used to check authentication status

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe_123",
      "email": "john.doe@university.edu",
      "firstname": "John",
      "lastname": "Doe",
      "phoneNumber": "+1234567890",
      "profilePicture": "https://avatar.vercel.sh/john_doe_123",
      "coverImage": "https://cdn.example.com/covers/user-cover.jpg",
      "bio": {
        "bioAbout": "AI researcher passionate about machine learning and community building",
        "bioInterests": ["Machine Learning", "AI Research", "Community Building"],
        "bioAchievements": ["Published 5 papers", "Community Organizer"]
      },
      "role": "User",
      "badges": ["Expert", "Contributor", "Community Builder"],
      "streakCount": 15,
      "streakLabel": "15 day streak",
      "impactScore": 1250,
      "isInstitutionalUser": true,
      "institutionalDomain": "university.edu",
      "domainType": "educational",
      "isEmailVerified": true,
      "isBasicProfileComplete": true,
      "communities": {
        "joined": 12,
        "created": 2,
        "owned": 2,
        "favorites": 5,
        "blocked": 0
      },
      "stats": {
        "totalPosts": 45,
        "totalComments": 189,
        "totalLikes": 423,
        "totalConnections": 78
      },
      "preferences": {
        "emailNotifications": true,
        "pushNotifications": true,
        "profileVisibility": "public",
        "showOnlineStatus": true
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLoginDate": "2024-01-20T14:22:00.000Z"
    }
  }
}
```

### 1.4 Update User Profile

**Endpoint:** `PUT /api/auth/profile`  
**Authentication:** Bearer Token Required  
**Purpose:** Update user profile information

**User Flow:**
1. User navigates to profile settings
2. Updates desired fields
3. System validates and saves changes
4. Updated profile returned

**Validations:**
- Username must be unique if changed
- Email must be unique and valid if changed
- Phone number must be valid format
- Bio fields have character limits

**Request Body:**
```json
{
  "firstname": "string (optional, 2-50 chars)",
  "lastname": "string (optional, 2-50 chars)",
  "username": "string (optional, 3-30 chars, unique)",
  "email": "string (optional, valid email, unique)",
  "phoneNumber": "string (optional, valid format)",
  "dateOfBirth": "string (optional, ISO date)",
  "gender": "string (optional, enum)",
  "bio": {
    "bioAbout": "string (optional, max 500 chars)",
    "bioInterests": "array (optional, max 20 items, each max 50 chars)",
    "bioAchievements": "array (optional, max 10 items, each max 100 chars)"
  },
  "preferences": {
    "emailNotifications": "boolean",
    "pushNotifications": "boolean",
    "profileVisibility": "string (enum: ['public', 'institutional', 'private'])",
    "showOnlineStatus": "boolean"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      // Updated user object similar to GET /api/auth/me
    }
  }
}
```

### 1.5 Upload Profile Picture

**Endpoint:** `POST /api/auth/profile/picture`  
**Authentication:** Bearer Token Required  
**Purpose:** Upload and set user profile picture

**User Flow:**
1. User clicks on profile picture to change
2. File picker opens, user selects image
3. Image uploaded and processed (resized, cropped)
4. New profile picture URL returned

**Request:** Multipart Form Data
```
Content-Type: multipart/form-data

profilePicture: File (required, image/*,  max 5MB)
cropData: JSON (optional, {x, y, width, height} for cropping)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "profilePicture": {
      "original": "https://cdn.example.com/profiles/original/user-123.jpg",
      "thumbnail": "https://cdn.example.com/profiles/thumbs/user-123.jpg",
      "small": "https://cdn.example.com/profiles/small/user-123.jpg",
      "medium": "https://cdn.example.com/profiles/medium/user-123.jpg"
    },
    "updatedAt": "2024-01-15T15:30:00.000Z"
  }
}
```

---

## 🏘️ 2. Community Management

### 2.1 Create Community

**Endpoint:** `POST /api/communities`  
**Authentication:** Bearer Token Required  
**Purpose:** Create a new community with specified settings and features

**User Flow:**
1. User clicks "Create Community" button
2. Fills out community creation form with basic info
3. Configures privacy settings and features
4. Sets up institutional verification if applicable
5. Community created and user becomes owner

**Validations:**
- Community name must be unique within the institution/platform
- Slug auto-generated but must be unique
- At least one verified domain required for institutional communities
- User must have permission to create communities
- Description required, max 1000 characters

**Request Body:**
```json
{
  "name": "string (required, 3-100 chars, unique within scope)",
  "description": "string (required, 10-1000 chars)",
  "type": "string (required, enum: ['institutional', 'skill', 'interest', 'open'])",
  "privacy": {
    "visibility": "string (required, enum: ['public', 'protected', 'private'])",
    "joinMethod": "string (required, enum: ['open', 'approval', 'invite_only'])",
    "searchable": "boolean (default: true)",
    "allowMemberInvites": "boolean (default: true)",
    "requireApproval": "boolean (auto-set based on joinMethod)"
  },
  "institutionalInfo": {
    "verifiedDomains": "array (required if type=institutional)",
    "institutionType": "string (enum: ['university', 'school', 'company', 'organization'])",
    "officialName": "string (optional)",
    "website": "string (optional, valid URL)",
    "contactEmail": "string (optional, valid email)"
  },
  "features": {
    "allowPosts": "boolean (default: true)",
    "allowPolls": "boolean (default: true)",
    "allowEvents": "boolean (default: true)",
    "allowResources": "boolean (default: true)",
    "allowDiscussions": "boolean (default: true)"
  },
  "contentSettings": {
    "allowedPostTypes": "array (default: ['text', 'image', 'poll', 'event'])",
    "autoApproveContent": "boolean (default: false)",
    "allowExternalLinks": "boolean (default: true)",
    "postingPermissions": {
      "createPost": "string (enum: ['all_members', 'contributors_up', 'moderators_up', 'admins_up', 'owners_only'])",
      "createPoll": "string (default: 'all_members')",
      "createEvent": "string (default: 'contributors_up')",
      "pinPosts": "string (default: 'moderators_up')"
    }
  },
  "tags": "array (optional, max 10 tags, each max 30 chars)",
  "guidelines": "string (optional, max 5000 chars)",
  "welcomeMessage": "string (optional, max 500 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Community created successfully",
  "data": {
    "community": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "AI Research Hub",
      "slug": "ai-research-hub-1642234567",
      "description": "A community for AI researchers and enthusiasts to share knowledge and collaborate on cutting-edge projects",
      "type": "institutional",
      "privacy": {
        "visibility": "public",
        "joinMethod": "approval",
        "searchable": true,
        "allowMemberInvites": true,
        "requireApproval": true
      },
      "institutionalInfo": {
        "verifiedDomains": [
          {
            "domain": "university.edu",
            "verified": true,
            "addedAt": "2024-01-15T10:30:00.000Z"
          }
        ],
        "institutionType": "university",
        "officialName": "University AI Research Department"
      },
      "features": {
        "allowPosts": true,
        "allowPolls": true,
        "allowEvents": true,
        "allowResources": true
      },
      "stats": {
        "memberCount": 1,
        "postCount": 0,
        "activeMembers": 1,
        "weeklyActivity": 0
      },
      "avatar": {
        "url": "https://avatar.vercel.sh/ai-research-hub",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      "verificationStatus": "pending",
      "tags": ["artificial-intelligence", "research", "machine-learning"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "creator": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "firstname": "John",
        "lastname": "Doe",
        "profilePicture": "https://avatar.vercel.sh/john_doe_123"
      }
    },
    "membership": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "role": "owner",
      "status": "active",
      "joinedAt": "2024-01-15T10:30:00.000Z",
      "permissions": ["all"],
      "impactPoints": {
        "totalPoints": 100,
        "categoryBreakdown": {
          "creation": 100
        }
      }
    }
  }
}
```

**Error Responses:**
```json
// Name Already Exists (409)
{
  "success": false,
  "error": {
    "code": "COMMUNITY_NAME_EXISTS",
    "message": "A community with this name already exists",
    "details": {
      "existingCommunity": {
        "id": "existing_community_id",
        "name": "AI Research Hub",
        "slug": "ai-research-hub-existing"
      }
    }
  }
}

// Invalid Domain (422)
{
  "success": false,
  "error": {
    "code": "INVALID_DOMAIN",
    "message": "Domain verification failed",
    "details": {
      "invalidDomains": ["unverified-domain.edu"],
      "userDomain": "university.edu",
      "allowedDomains": ["university.edu", "research.university.edu"]
    }
  }
}
```

### 2.2 Get Community Details

**Endpoint:** `GET /api/communities/:communityId`  
**Authentication:** Bearer Token Required  
**Purpose:** Retrieve detailed information about a specific community

**User Flow:**
1. User clicks on community name/link
2. Community details page loads with full information
3. Shows community stats, recent activity, member info
4. User can see join button/status based on membership

**URL Parameters:**
- `communityId`: String (required) - Community ID or slug

**Query Parameters:**
- `include`: String (optional) - Comma-separated list of additional data to include
  - Options: `members`, `posts`, `events`, `analytics`, `requests`
  - Example: `?include=members,posts`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "community": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "AI Research Hub",
      "slug": "ai-research-hub-1642234567",
      "description": "A community for AI researchers and enthusiasts to share knowledge and collaborate on cutting-edge projects",
      "type": "institutional",
      "privacy": {
        "visibility": "public",
        "joinMethod": "approval",
        "searchable": true,
        "allowMemberInvites": true
      },
      "institutionalInfo": {
        "verifiedDomains": [
          {
            "domain": "university.edu",
            "verified": true,
            "addedAt": "2024-01-15T10:30:00.000Z"
          }
        ],
        "institutionType": "university",
        "officialName": "University AI Research Department",
        "website": "https://ai.university.edu"
      },
      "features": {
        "allowPosts": true,
        "allowPolls": true,
        "allowEvents": true,
        "allowResources": true
      },
      "stats": {
        "memberCount": 156,
        "postCount": 47,
        "activeMembers": 89,
        "weeklyActivity": 234,
        "monthlyGrowth": 12.5,
        "engagementRate": 78.2
      },
      "avatar": {
        "url": "https://cdn.example.com/communities/ai-research-hub-avatar.jpg",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      "coverImage": {
        "url": "https://cdn.example.com/communities/ai-research-hub-cover.jpg",
        "updatedAt": "2024-01-15T12:00:00.000Z"
      },
      "verificationStatus": "verified",
      "verifiedAt": "2024-01-16T09:00:00.000Z",
      "tags": ["artificial-intelligence", "research", "machine-learning"],
      "guidelines": "1. Be respectful to all members\n2. Share high-quality research content\n3. Cite sources for all claims",
      "welcomeMessage": "Welcome to our AI research community! Please introduce yourself in the introductions channel.",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:22:00.000Z",
      "creator": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "firstname": "John",
        "lastname": "Doe",
        "profilePicture": "https://avatar.vercel.sh/john_doe_123"
      },
      "recentActivity": [
        {
          "type": "new_post",
          "title": "Latest Breakthrough in Transformer Architecture",
          "author": "sarah_researcher",
          "timestamp": "2024-01-20T13:30:00.000Z"
        },
        {
          "type": "new_member",
          "username": "alex_phd",
          "timestamp": "2024-01-20T12:15:00.000Z"
        }
      ]
    },
    "userMembership": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "role": "member",
      "status": "active",
      "joinedAt": "2024-01-16T11:00:00.000Z",
      "impactPoints": {
        "totalPoints": 125,
        "rank": 23,
        "categoryBreakdown": {
          "posts": 45,
          "comments": 50,
          "likes": 30
        }
      },
      "permissions": {
        "canPost": true,
        "canComment": true,
        "canLike": true,
        "canInvite": true,
        "canModerate": false
      },
      "lastActive": "2024-01-20T14:00:00.000Z"
    },
    "upcomingEvents": [
      {
        "id": "event_123",
        "title": "Monthly AI Research Meetup",
        "startDateTime": "2024-01-25T18:00:00.000Z",
        "attendeeCount": 23
      }
    ]
  }
}
```

### 2.3 Update Community

**Endpoint:** `PUT /api/communities/:communityId`  
**Authentication:** Bearer Token Required  
**Purpose:** Update community information and settings

**User Flow:**
1. Community owner/admin navigates to community settings
2. Updates desired fields (name, description, privacy, etc.)
3. Changes are validated and saved
4. Community members notified of significant changes

**Permissions:** Owner, Admin
**URL Parameters:** `communityId` (required)

**Request Body:** (All fields optional, only send what needs to be updated)
```json
{
  "name": "string (optional, 3-100 chars)",
  "description": "string (optional, 10-1000 chars)",
  "privacy": {
    "visibility": "string (optional)",
    "joinMethod": "string (optional)",
    "searchable": "boolean (optional)",
    "allowMemberInvites": "boolean (optional)"
  },
  "features": {
    "allowPosts": "boolean (optional)",
    "allowPolls": "boolean (optional)",
    "allowEvents": "boolean (optional)"
  },
  "tags": "array (optional)",
  "guidelines": "string (optional, max 5000 chars)",
  "welcomeMessage": "string (optional, max 500 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Community updated successfully",
  "data": {
    "community": {
      // Updated community object
    },
    "changesLog": {
      "updatedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123"
      },
      "updatedAt": "2024-01-20T15:30:00.000Z",
      "changes": ["description", "privacy.joinMethod", "tags"]
    }
  }
}
```

---

## 🔍 3. Community Discovery & Search

### 3.1 Search Communities

**Endpoint:** `GET /api/communities/search`  
**Authentication:** Bearer Token Required  
**Purpose:** Search for communities based on various criteria

**User Flow:**
1. User enters search query in community search bar
2. System searches across community names, descriptions, tags
3. Results filtered by user's permissions and community privacy
4. Results sorted by relevance, popularity, or other criteria

**Query Parameters:**
```
q: string (optional) - Search query for name/description/tags
type: string (optional) - Filter by community type ('institutional', 'skill', 'interest', 'open')
visibility: string (optional) - Filter by visibility ('public', 'protected')
domain: string (optional) - Filter by institutional domain
tags: string (optional) - Comma-separated tags to filter by
location: string (optional) - Geographic location filter
memberCount: string (optional) - Member count range ('small', 'medium', 'large', 'enterprise')
activity: string (optional) - Activity level ('low', 'medium', 'high', 'very_high')
verified: boolean (optional) - Only verified communities
featured: boolean (optional) - Only featured communities
sortBy: string (optional) - Sort order ('relevance', 'newest', 'oldest', 'popular', 'active', 'members')
page: number (optional, default: 1)
limit: number (optional, default: 20, max: 100)
```

**Example Request:**
```
GET /api/communities/search?q=artificial%20intelligence&type=institutional&verified=true&sortBy=members&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "communities": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "AI Research Hub",
        "slug": "ai-research-hub-1642234567",
        "description": "A community for AI researchers and enthusiasts to share knowledge and collaborate",
        "type": "institutional",
        "privacy": {
          "visibility": "public",
          "joinMethod": "approval"
        },
        "stats": {
          "memberCount": 156,
          "postCount": 47,
          "weeklyActivity": 234
        },
        "avatar": {
          "url": "https://cdn.example.com/communities/ai-research-hub-avatar.jpg"
        },
        "institutionalInfo": {
          "institutionType": "university",
          "verifiedDomains": ["university.edu"]
        },
        "verificationStatus": "verified",
        "tags": ["artificial-intelligence", "research", "machine-learning"],
        "matchScore": 9.2,
        "matchReasons": ["name match", "tag match", "description match"],
        "userCanJoin": true,
        "joinEligibility": {
          "eligible": true,
          "reason": "Domain match",
          "autoJoin": false
        },
        "featured": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
      // ... more communities
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 23,
      "totalPages": 3,
      "hasMore": true
    },
    "searchMetadata": {
      "query": "artificial intelligence",
      "totalResults": 23,
      "searchTime": "0.045s",
      "suggestions": ["machine learning", "deep learning", "neural networks"],
      "appliedFilters": {
        "type": "institutional",
        "verified": true
      },
      "availableFilters": {
        "types": ["institutional", "skill", "interest"],
        "domains": ["university.edu", "tech-corp.com"],
        "memberCounts": ["small", "medium", "large"]
      }
    }
  }
}
```

### 3.2 Get Community Recommendations

**Endpoint:** `GET /api/communities/recommendations`  
**Authentication:** Bearer Token Required  
**Purpose:** Get personalized community recommendations based on user profile and activity

**User Flow:**
1. User views "Discover Communities" page
2. System analyzes user's profile, interests, domain, and activity
3. Recommends communities user might be interested in
4. Recommendations updated based on user interactions

**Query Parameters:**
```
type: string (optional) - Type of recommendations ('all', 'institutional', 'interests', 'trending')
limit: number (optional, default: 10, max: 50)
exclude: string (optional) - Comma-separated community IDs to exclude
includeJoined: boolean (optional, default: false) - Include communities user already joined
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "community": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j5",
          "name": "Machine Learning Researchers",
          "description": "Community focused on ML research and applications",
          "type": "skill",
          "stats": {
            "memberCount": 89,
            "postCount": 234,
            "weeklyActivity": 156
          },
          "avatar": {
            "url": "https://cdn.example.com/communities/ml-researchers.jpg"
          },
          "tags": ["machine-learning", "research", "algorithms"]
        },
        "recommendationScore": 8.7,
        "recommendationReasons": [
          "Matches your interest in Machine Learning",
          "Similar to communities you've joined",
          "High activity level",
          "Members from your institution"
        ],
        "joinEligibility": {
          "eligible": true,
          "autoJoin": false,
          "reason": "Open community"
        }
      }
      // ... more recommendations
    ],
    "recommendationCategories": [
      {
        "category": "Based on Your Interests",
        "count": 5,
        "communities": ["64f1a2b3c4d5e6f7g8h9i0j5", "..."]
      },
      {
        "category": "Trending in Your Institution",
        "count": 3,
        "communities": ["...", "..."]
      },
      {
        "category": "Similar to Communities You've Joined",
        "count": 4,
        "communities": ["...", "..."]
      }
    ]
  }
}
```

### 3.3 List All Communities

**Endpoint:** `GET /api/communities`  
**Authentication:** Bearer Token Required  
**Purpose:** Get a list of communities with optional filtering and sorting

**User Flow:**
1. User browses all communities page
2. Can filter by various criteria
3. Results paginated for performance
4. Used for community directory listings

**Query Parameters:**
```
type: string (optional) - Filter by type
visibility: string (optional) - Filter by visibility  
verified: boolean (optional) - Only verified communities
featured: boolean (optional) - Only featured communities
domain: string (optional) - Filter by institutional domain
memberCount: string (optional) - Filter by size
sortBy: string (optional, default: 'newest') - Sort order
order: string (optional, default: 'desc') - 'asc' or 'desc'
page: number (optional, default: 1)
limit: number (optional, default: 20, max: 100)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "communities": [
      // Array of community objects (similar to search results)
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasMore": true
    },
    "stats": {
      "totalCommunities": 156,
      "byType": {
        "institutional": 45,
        "skill": 67,
        "interest": 32,
        "open": 12
      },
      "byVisibility": {
        "public": 134,
        "protected": 22,
        "private": 0
      },
      "verified": 89,
      "featured": 12
    }
  }
}
```

### 3.4 Get Trending Communities

**Endpoint:** `GET /api/communities/trending`  
**Authentication:** Bearer Token Required  
**Purpose:** Get currently trending communities based on activity and growth

**User Flow:**
1. User views trending communities section
2. Shows communities with high recent activity
3. Updated periodically based on engagement metrics
4. Helps users discover active communities

**Query Parameters:**
```
period: string (optional, default: 'week') - Time period ('day', 'week', 'month')
type: string (optional) - Filter by community type
limit: number (optional, default: 10, max: 50)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "trendingCommunities": [
      {
        "community": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j6",
          "name": "Quantum Computing Discussion",
          "description": "Latest developments in quantum computing",
          "stats": {
            "memberCount": 234,
            "postCount": 67,
            "weeklyActivity": 456
          },
          "avatar": {
            "url": "https://cdn.example.com/communities/quantum-computing.jpg"
          },
          "tags": ["quantum-computing", "physics", "technology"]
        },
        "trendingMetrics": {
          "trendingScore": 9.4,
          "growthRate": 45.2,
          "activityIncrease": 78.5,
          "engagementRate": 85.3,
          "newMembersThisWeek": 23,
          "postsThisWeek": 15
        },
        "trendingRank": 1,
        "trendingReason": "High engagement and rapid member growth"
      }
      // ... more trending communities
    ],
    "metadata": {
      "period": "week",
      "updatedAt": "2024-01-20T15:00:00.000Z",
      "nextUpdate": "2024-01-21T15:00:00.000Z"
    }
  }
}
```

---

## 👥 4. Community Membership

### 4.1 Join Community

**Endpoint:** `POST /api/communities/:communityId/join`  
**Authentication:** Bearer Token Required  
**Purpose:** Join a community or request to join based on community settings

**User Flow:**
1. User clicks "Join Community" button
2. System checks join eligibility and method
3. If open: User joins immediately
4. If approval required: Join request created
5. If invite-only: Error returned
6. User receives confirmation or request status

**URL Parameters:** `communityId` (required)

**Request Body:**
```json
{
  "joinReason": "string (optional, max 500 chars) - Required for approval-based communities",
  "acceptRules": "boolean (required, must be true)",
  "inviteCode": "string (optional) - Required for invite-only communities",
  "additionalInfo": {
    "expertise": "array (optional) - Areas of expertise",
    "institution": "string (optional) - Current institution",
    "linkedInProfile": "string (optional, valid URL)",
    "motivation": "string (optional, max 300 chars)"
  }
}
```

**Success Response - Open Community (200):**
```json
{
  "success": true,
  "message": "Successfully joined community",
  "data": {
    "membership": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j7",
      "community": "64f1a2b3c4d5e6f7g8h9i0j2",
      "user": "64f1a2b3c4d5e6f7g8h9i0j1",
      "role": "member",
      "status": "active",
      "joinMethod": "open",
      "joinedAt": "2024-01-20T16:00:00.000Z",
      "impactPoints": {
        "totalPoints": 10,
        "categoryBreakdown": {
          "joining": 10
        }
      }
    },
    "community": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "AI Research Hub",
      "memberCount": 157,
      "welcomeMessage": "Welcome to our AI research community!"
    },
    "autoJoin": true
  }
}
```

**Success Response - Approval Required (200):**
```json
{
  "success": true,
  "message": "Join request submitted successfully",
  "data": {
    "request": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j8",
      "community": "64f1a2b3c4d5e6f7g8h9i0j2",
      "user": "64f1a2b3c4d5e6f7g8h9i0j1",
      "status": "pending",
      "requestType": "join_request",
      "submitedAt": "2024-01-20T16:00:00.000Z",
      "joinReason": "I'm passionate about AI research and would love to contribute...",
      "estimatedApprovalTime": "2-3 business days"
    },
    "community": {
      "name": "AI Research Hub",
      "joinMethod": "approval"
    }
  }
}
```

**Error Responses:**
```json
// Already a Member (409)
{
  "success": false,
  "error": {
    "code": "ALREADY_MEMBER",
    "message": "You are already a member of this community",
    "details": {
      "membershipStatus": "active",
      "joinedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}

// Invite Required (403)
{
  "success": false,
  "error": {
    "code": "INVITE_REQUIRED",
    "message": "This community requires an invitation to join",
    "details": {
      "joinMethod": "invite_only",
      "howToGetInvite": "Ask a current member or admin for an invitation"
    }
  }
}

// Domain Not Eligible (422)
{
  "success": false,
  "error": {
    "code": "DOMAIN_NOT_ELIGIBLE",
    "message": "Your institutional domain is not eligible for this community",
    "details": {
      "userDomain": "other-university.edu",
      "allowedDomains": ["university.edu", "partner-university.edu"],
      "contactInfo": "Contact admin@university.edu for domain verification"
    }
  }
}
```

### 4.2 Leave Community

**Endpoint:** `POST /api/communities/:communityId/leave`  
**Authentication:** Bearer Token Required  
**Purpose:** Leave a community and remove membership

**User Flow:**
1. User navigates to community settings/membership
2. Clicks "Leave Community" 
3. Confirms action (with warning about losing content access)
4. Membership removed and user redirected

**URL Parameters:** `communityId` (required)

**Request Body:**
```json
{
  "reason": "string (optional, max 500 chars) - Reason for leaving",
  "feedback": "string (optional, max 1000 chars) - Feedback for community improvement",
  "confirmLeaving": "boolean (required, must be true)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully left community",
  "data": {
    "leftAt": "2024-01-20T17:00:00.000Z",
    "community": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "AI Research Hub",
      "memberCount": 156
    },
    "membershipDuration": "5 days",
    "contentRetention": {
      "postsRetained": true,
      "commentsRetained": true,
      "likesRetained": true
    }
  }
}
```

**Error Responses:**
```json
// Not a Member (404)
{
  "success": false,
  "error": {
    "code": "NOT_MEMBER",
    "message": "You are not a member of this community"
  }
}

// Owner Cannot Leave (422)
{
  "success": false,
  "error": {
    "code": "OWNER_CANNOT_LEAVE",
    "message": "Community owners cannot leave. Transfer ownership first.",
    "details": {
      "transferOwnershipUrl": "/api/communities/64f1a2b3c4d5e6f7g8h9i0j2/transfer-ownership"
    }
  }
}
```

### 4.3 Get Community Members

**Endpoint:** `GET /api/communities/:communityId/members`  
**Authentication:** Bearer Token Required  
**Purpose:** Get list of community members with their roles and information

**User Flow:**
1. User navigates to community members page
2. System shows member list with roles and activity
3. Can filter by role, activity, or search by name
4. Admins see additional management options

**URL Parameters:** `communityId` (required)

**Query Parameters:**
```
role: string (optional) - Filter by role ('owner', 'admin', 'moderator', 'contributor', 'member')
status: string (optional) - Filter by status ('active', 'inactive', 'suspended')
search: string (optional) - Search by name or username
sortBy: string (optional, default: 'joinedAt') - Sort by ('joinedAt', 'lastActive', 'impactPoints', 'name')
order: string (optional, default: 'desc') - Sort order
page: number (optional, default: 1)
limit: number (optional, default: 20, max: 100)
includeStats: boolean (optional, default: false) - Include detailed stats
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j9",
        "user": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "username": "john_doe_123",
          "firstname": "John",
          "lastname": "Doe",
          "profilePicture": "https://avatar.vercel.sh/john_doe_123",
          "badges": ["Expert", "Contributor", "Community Builder"],
          "institutionalDomain": "university.edu",
          "isVerified": true
        },
        "role": "owner",
        "status": "active",
        "joinedAt": "2024-01-15T10:30:00.000Z",
        "lastActive": "2024-01-20T16:30:00.000Z",
        "joinMethod": "created",
        "impactPoints": {
          "totalPoints": 1250,
          "rank": 1,
          "categoryBreakdown": {
            "posts": 450,
            "comments": 300,
            "likes": 200,
            "events": 300
          }
        },
        "communityStats": {
          "postsCount": 8,
          "commentsCount": 34,
          "likesGiven": 156,
          "eventsCreated": 3,
          "membersInvited": 12
        },
        "permissions": ["all"],
        "canBePromoted": false,
        "canBeDemoted": false,
        "canBeRemoved": false
      }
      // ... more members
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasMore": true
    },
    "membershipStats": {
      "totalMembers": 156,
      "activeMembers": 89,
      "newThisWeek": 5,
      "roleBreakdown": {
        "owners": 1,
        "admins": 3,
        "moderators": 8,
        "contributors": 34,
        "members": 110
      },
      "averageImpactPoints": 245
    }
  }
}
```

### 4.4 Update Member Role

**Endpoint:** `POST /api/communities/:communityId/members/:memberId/role`  
**Authentication:** Bearer Token Required  
**Purpose:** Promote or demote a community member's role

**User Flow:**
1. Admin/Owner views member list
2. Clicks on member role dropdown
3. Selects new role from available options
4. Confirms role change with reason
5. Member notified of role change

**Permissions:** Owner (all roles), Admin (moderator and below), Moderator (contributor and below)
**URL Parameters:** `communityId`, `memberId` (required)

**Request Body:**
```json
{
  "newRole": "string (required, enum: ['member', 'contributor', 'moderator', 'admin'])",
  "reason": "string (optional, max 500 chars) - Reason for role change",
  "permissions": "array (optional) - Custom permissions if applicable",
  "notifyUser": "boolean (optional, default: true) - Notify user of role change",
  "effectiveDate": "string (optional, ISO date) - When role change takes effect"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully",
  "data": {
    "member": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j10",
      "user": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j11",
        "username": "active_member_456",
        "firstname": "Sarah",
        "lastname": "Johnson"
      },
      "previousRole": "contributor",
      "newRole": "moderator",
      "roleChangedAt": "2024-01-20T18:30:00.000Z",
      "roleChangedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "role": "owner"
      },
      "reason": "Exceptional contribution to community discussions and helpful moderation",
      "permissions": ["moderate_posts", "manage_comments", "approve_members"],
      "notificationSent": true
    },
    "community": {
      "roleStats": {
        "owners": 1,
        "admins": 3,
        "moderators": 9,
        "contributors": 33,
        "members": 110
      }
    }
  }
}
```

### 4.5 Remove Member

**Endpoint:** `DELETE /api/communities/:communityId/members/:memberId`  
**Authentication:** Bearer Token Required  
**Purpose:** Remove a member from the community

**User Flow:**
1. Admin/Owner identifies problematic member
2. Clicks remove member option
3. Provides reason for removal
4. Confirms removal action
5. Member removed and optionally notified

**Permissions:** Owner (all members except other owners), Admin (moderator and below)
**URL Parameters:** `communityId`, `memberId` (required)

**Request Body:**
```json
{
  "reason": "string (required, max 500 chars) - Reason for removal",
  "notifyUser": "boolean (optional, default: false) - Notify user of removal",
  "banUser": "boolean (optional, default: false) - Also ban user from rejoining",
  "removeContent": "boolean (optional, default: false) - Remove user's posts/comments"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": {
    "removedMember": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j12",
      "username": "removed_user",
      "role": "member",
      "removedAt": "2024-01-20T19:00:00.000Z"
    },
    "removedBy": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe_123",
      "role": "owner"
    },
    "reason": "Repeated violations of community guidelines",
    "contentRemoved": false,
    "banned": false,
    "community": {
      "memberCount": 155
    }
  }
}
```

---

## 📝 5. Content Management

### 5.1 Create Post

**Endpoint:** `POST /api/communities/:communityId/posts`  
**Authentication:** Bearer Token Required  
**Purpose:** Create different types of posts (text, poll, event) in a community

**User Flow:**
1. User clicks "Create Post" in community
2. Selects post type (text, poll, event)
3. Fills out appropriate form fields
4. Adds tags, attachments, settings
5. Posts immediately or saves as draft

**URL Parameters:** `communityId` (required)

#### Text Post Request:
```json
{
  "title": "string (required, 5-200 chars)",
  "content": {
    "text": "string (required, 10-10000 chars)",
    "html": "string (optional, formatted version)"
  },
  "postType": "text",
  "status": "string (optional, default: 'published', enum: ['published', 'draft', 'scheduled'])",
  "privacy": "string (optional, default: 'community', enum: ['community', 'public', 'members_only'])",
  "tags": "array (optional, max 10 tags, each max 30 chars)",
  "attachments": [
    {
      "type": "string (enum: ['image', 'file', 'link'])",
      "url": "string (required, valid URL)",
      "filename": "string (optional)",
      "size": "number (optional, bytes)",
      "caption": "string (optional, max 200 chars)"
    }
  ],
  "settings": {
    "allowComments": "boolean (default: true)",
    "allowLikes": "boolean (default: true)",
    "allowSharing": "boolean (default: true)",
    "pinned": "boolean (default: false, requires moderator+)",
    "featured": "boolean (default: false, requires admin+)"
  },
  "scheduledFor": "string (optional, ISO date, required if status='scheduled')"
}
```

#### Poll Post Request:
```json
{
  "title": "string (required)",
  "content": {
    "text": "string (required, poll description)"
  },
  "postType": "poll",
  "poll": {
    "question": "string (required, 10-300 chars)",
    "options": [
      {
        "text": "string (required, 1-100 chars)",
        "description": "string (optional, max 200 chars)",
        "image": "string (optional, image URL)"
      }
    ],
    "settings": {
      "allowMultipleVotes": "boolean (default: false)",
      "anonymousVoting": "boolean (default: false)",
      "showResultsBeforeVoting": "boolean (default: false)",
      "allowAddOptions": "boolean (default: false)",
      "requireComment": "boolean (default: false)"
    },
    "expiresAt": "string (optional, ISO date, default: 7 days from now)",
    "maxVotesPerUser": "number (optional, default: 1)"
  },
  "status": "published",
  "tags": ["polling", "community-feedback"]
}
```

#### Event Post Request:
```json
{
  "title": "string (required)",
  "content": {
    "text": "string (required, event description)"
  },
  "postType": "event",
  "event": {
    "title": "string (required, 5-200 chars)",
    "description": "string (required, 10-2000 chars)",
    "startDateTime": "string (required, ISO date)",
    "endDateTime": "string (required, ISO date)",
    "timezone": "string (required, e.g., 'America/New_York')",
    "location": {
      "type": "string (required, enum: ['physical', 'virtual', 'hybrid'])",
      "venue": {
        "name": "string (optional)",
        "address": "string (optional)",
        "coordinates": {
          "latitude": "number (optional)",
          "longitude": "number (optional)"
        }
      },
      "virtualDetails": {
        "platform": "string (optional, e.g., 'Zoom', 'Teams')",
        "meetingId": "string (optional)",
        "passcode": "string (optional)",
        "link": "string (optional, valid URL)"
      }
    },
    "capacity": {
      "maxAttendees": "number (optional)",
      "waitingList": "boolean (default: false)"
    },
    "registration": {
      "required": "boolean (default: false)",
      "deadline": "string (optional, ISO date)",
      "fee": {
        "amount": "number (optional)",
        "currency": "string (optional, default: 'USD')",
        "freeForMembers": "boolean (default: true)"
      },
      "fields": [
        {
          "name": "string (required)",
          "label": "string (required)",
          "type": "string (required, enum: ['text', 'email', 'select', 'checkbox', 'textarea'])",
          "options": "array (optional, for select type)",
          "required": "boolean (default: false)",
          "placeholder": "string (optional)"
        }
      ]
    },
    "agenda": [
      {
        "time": "string (required, e.g., '09:00')",
        "title": "string (required)",
        "description": "string (optional)",
        "duration": "number (optional, minutes)",
        "speaker": {
          "name": "string (optional)",
          "title": "string (optional)",
          "affiliation": "string (optional)",
          "bio": "string (optional)"
        }
      }
    ]
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j13",
      "title": "Latest Breakthrough in Transformer Architecture",
      "slug": "latest-breakthrough-transformer-architecture-1642234567",
      "content": {
        "text": "I've been working on a novel transformer architecture that shows promising results...",
        "html": "<p>I've been working on a novel <strong>transformer architecture</strong>..."
      },
      "postType": "text",
      "status": "published",
      "privacy": "community",
      "author": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "firstname": "John",
        "lastname": "Doe",
        "profilePicture": "https://avatar.vercel.sh/john_doe_123",
        "role": "owner"
      },
      "community": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "AI Research Hub",
        "slug": "ai-research-hub"
      },
      "stats": {
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "views": 1,
        "saves": 0
      },
      "tags": ["transformer", "architecture", "ai-research"],
      "attachments": [
        {
          "id": "attach_123",
          "type": "file",
          "url": "https://cdn.example.com/posts/transformer-paper.pdf",
          "filename": "transformer-architecture-paper.pdf",
          "size": 2048576,
          "caption": "Research paper with detailed methodology"
        }
      ],
      "settings": {
        "allowComments": true,
        "allowLikes": true,
        "allowSharing": true,
        "pinned": false,
        "featured": false
      },
      "moderationStatus": "approved",
      "createdAt": "2024-01-20T20:00:00.000Z",
      "updatedAt": "2024-01-20T20:00:00.000Z",
      "publishedAt": "2024-01-20T20:00:00.000Z"
    }
  }
}
```

### 5.2 Get Community Feed

**Endpoint:** `GET /api/communities/:communityId/posts/feed`  
**Authentication:** Bearer Token Required  
**Purpose:** Get paginated list of posts in a community with various sorting options

**User Flow:**
1. User navigates to community homepage
2. Feed loads with most relevant posts
3. User can filter by post type, time period
4. Infinite scroll or pagination for more posts

**URL Parameters:** `communityId` (required)

**Query Parameters:**
```
sortBy: string (optional, default: 'newest') - Sort order
  Options: 'newest', 'oldest', 'trending', 'popular', 'most_liked', 'most_commented'
filter: string (optional, default: 'all') - Filter posts
  Options: 'all', 'text', 'poll', 'event', 'pinned', 'featured'
timeframe: string (optional) - Time-based filter
  Options: 'all', 'today', 'week', 'month', 'year'
author: string (optional) - Filter by author username/ID
tags: string (optional) - Comma-separated tags to filter by
status: string (optional, default: 'published') - Post status
search: string (optional) - Search within posts
page: number (optional, default: 1)
limit: number (optional, default: 10, max: 50)
includeStats: boolean (optional, default: true) - Include detailed stats
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j13",
        "title": "Latest Breakthrough in Transformer Architecture",
        "excerpt": "I've been working on a novel transformer architecture that shows promising results in few-shot learning tasks...",
        "postType": "text",
        "author": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "username": "john_doe_123",
          "firstname": "John",
          "lastname": "Doe",
          "profilePicture": "https://avatar.vercel.sh/john_doe_123",
          "badges": ["Expert", "Contributor"],
          "role": "owner"
        },
        "community": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j2",
          "name": "AI Research Hub",
          "slug": "ai-research-hub"
        },
        "stats": {
          "likes": 15,
          "comments": 4,
          "shares": 2,
          "views": 127,
          "saves": 8,
          "trendingScore": 8.5
        },
        "userInteraction": {
          "hasLiked": false,
          "hasCommented": true,
          "hasShared": false,
          "hasSaved": true
        },
        "preview": {
          "image": "https://cdn.example.com/posts/transformer-preview.jpg",
          "readTime": "3 min read"
        },
        "tags": ["transformer", "architecture", "ai-research"],
        "isPinned": false,
        "isFeatured": true,
        "moderationStatus": "approved",
        "createdAt": "2024-01-20T20:00:00.000Z",
        "publishedAt": "2024-01-20T20:00:00.000Z"
      },
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j14",
        "title": "Which AI Framework Do You Prefer?",
        "excerpt": "I'm curious about the community's preferences for AI frameworks in research projects...",
        "postType": "poll",
        "author": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j15",
          "username": "researcher_sarah",
          "firstname": "Sarah",
          "lastname": "Chen"
        },
        "poll": {
          "question": "Which AI framework do you use most often for research projects?",
          "totalVotes": 34,
          "userHasVoted": false,
          "expiresAt": "2024-01-27T20:00:00.000Z",
          "status": "active"
        },
        "stats": {
          "likes": 8,
          "comments": 12,
          "views": 89
        },
        "createdAt": "2024-01-20T18:00:00.000Z"
      },
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j16",
        "title": "AI Research Symposium 2024",
        "excerpt": "Join us for our annual AI Research Symposium featuring cutting-edge presentations...",
        "postType": "event",
        "author": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "username": "john_doe_123"
        },
        "event": {
          "startDateTime": "2024-02-15T09:00:00.000Z",
          "endDateTime": "2024-02-15T17:00:00.000Z",
          "location": {
            "type": "hybrid",
            "venue": {
              "name": "University Conference Center"
            }
          },
          "attendeeCount": 67,
          "capacity": {
            "maxAttendees": 200,
            "spotsRemaining": 133
          },
          "userRSVP": null
        },
        "stats": {
          "likes": 25,
          "comments": 8,
          "rsvpGoing": 67
        },
        "createdAt": "2024-01-20T16:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 47,
      "totalPages": 5,
      "hasMore": true
    },
    "feedMetadata": {
      "community": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "AI Research Hub"
      },
      "appliedFilters": {
        "sortBy": "newest",
        "filter": "all",
        "timeframe": "all"
      },
      "feedStats": {
        "totalPosts": 47,
        "todaysPosts": 3,
        "trendingPosts": 8,
        "unreadCount": 12,
        "postTypeBreakdown": {
          "text": 28,
          "poll": 12,
          "event": 7
        }
      }
    }
  }
}
```

### 5.3 Get Single Post

**Endpoint:** `GET /api/communities/:communityId/posts/:postId`  
**Authentication:** Bearer Token Required  
**Purpose:** Get detailed information about a specific post

**User Flow:**
1. User clicks on post title or "Read More"
2. Full post details page loads
3. Shows complete content, comments, interactions
4. User can interact with post (like, comment, share)

**URL Parameters:** `communityId`, `postId` (required)

**Query Parameters:**
```
includeComments: boolean (optional, default: true) - Include comments
commentLimit: number (optional, default: 20) - Number of comments to include
commentSort: string (optional, default: 'newest') - Comment sort order
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j13",
      "title": "Latest Breakthrough in Transformer Architecture",
      "slug": "latest-breakthrough-transformer-architecture-1642234567",
      "content": {
        "text": "I've been working on a novel transformer architecture that shows promising results in few-shot learning tasks. The key innovation is in the attention mechanism, which uses a hierarchical approach to process information at multiple scales...",
        "html": "<p>I've been working on a novel <strong>transformer architecture</strong> that shows promising results in few-shot learning tasks. The key innovation is in the <em>attention mechanism</em>, which uses a hierarchical approach...</p>"
      },
      "postType": "text",
      "status": "published",
      "privacy": "community",
      "author": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "firstname": "John",
        "lastname": "Doe",
        "profilePicture": "https://avatar.vercel.sh/john_doe_123",
        "badges": ["Expert", "Contributor"],
        "role": "owner",
        "bio": {
          "bioAbout": "AI researcher passionate about transformer architectures"
        }
      },
      "community": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "AI Research Hub",
        "slug": "ai-research-hub",
        "avatar": {
          "url": "https://cdn.example.com/communities/ai-research-hub-avatar.jpg"
        }
      },
      "stats": {
        "likes": 15,
        "comments": 4,
        "shares": 2,
        "views": 127,
        "saves": 8,
        "uniqueViewers": 98,
        "avgReadTime": "3.2 minutes"
      },
      "userInteraction": {
        "hasLiked": false,
        "hasCommented": true,
        "hasShared": false,
        "hasSaved": true,
        "viewedAt": "2024-01-20T21:00:00.000Z"
      },
      "tags": ["transformer", "architecture", "ai-research", "few-shot-learning"],
      "attachments": [
        {
          "id": "attach_123",
          "type": "file",
          "url": "https://cdn.example.com/posts/transformer-paper.pdf",
          "filename": "transformer-architecture-paper.pdf",
          "size": 2048576,
          "downloadCount": 23,
          "caption": "Research paper with detailed methodology"
        }
      ],
      "settings": {
        "allowComments": true,
        "allowLikes": true,
        "allowSharing": true
      },
      "isPinned": false,
      "isFeatured": true,
      "moderationStatus": "approved",
      "createdAt": "2024-01-20T20:00:00.000Z",
      "updatedAt": "2024-01-20T20:00:00.000Z",
      "publishedAt": "2024-01-20T20:00:00.000Z",
      "lastCommentAt": "2024-01-20T21:30:00.000Z"
    },
    "comments": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j17",
        "content": "This is fascinating work! Have you considered applying this architecture to multimodal learning tasks?",
        "author": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j18",
          "username": "research_colleague",
          "firstname": "Alex",
          "lastname": "Rodriguez",
          "profilePicture": "https://avatar.vercel.sh/research_colleague"
        },
        "stats": {
          "likes": 3,
          "replies": 1
        },
        "userHasLiked": false,
        "parentCommentId": null,
        "depth": 0,
        "createdAt": "2024-01-20T21:00:00.000Z",
        "replies": [
          {
            "id": "64f1a2b3c4d5e6f7g8h9i0j19",
            "content": "Great question! I'm actually exploring that next. The hierarchical attention should work well for vision-language tasks.",
            "author": {
              "id": "64f1a2b3c4d5e6f7g8h9i0j1",
              "username": "john_doe_123"
            },
            "stats": {
              "likes": 5,
              "replies": 0
            },
            "parentCommentId": "64f1a2b3c4d5e6f7g8h9i0j17",
            "depth": 1,
            "createdAt": "2024-01-20T21:15:00.000Z"
          }
        ]
      }
    ],
    "relatedPosts": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j20",
        "title": "Attention Mechanisms in Modern NLP",
        "author": {
          "username": "nlp_expert"
        },
        "stats": {
          "likes": 8,
          "comments": 2
        },
        "createdAt": "2024-01-18T15:00:00.000Z"
      }
    ]
  }
}
```

### 5.4 Update Post

**Endpoint:** `PUT /api/communities/:communityId/posts/:postId`  
**Authentication:** Bearer Token Required  
**Purpose:** Update an existing post (only by author or community moderators)

**User Flow:**
1. Author clicks "Edit Post" button
2. Post editing form loads with current content
3. User makes changes and saves
4. Updated post published with edit timestamp

**Permissions:** Post Author, Community Moderators+
**URL Parameters:** `communityId`, `postId` (required)

**Request Body:** (All fields optional, only send what needs updating)
```json
{
  "title": "string (optional)",
  "content": {
    "text": "string (optional)",
    "html": "string (optional)"
  },
  "tags": "array (optional)",
  "settings": {
    "allowComments": "boolean (optional)",
    "allowLikes": "boolean (optional)",
    "allowSharing": "boolean (optional)"
  },
  "editReason": "string (optional, max 200 chars) - Reason for edit"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "post": {
      // Updated post object similar to GET response
      "updatedAt": "2024-01-20T22:00:00.000Z",
      "editHistory": [
        {
          "editedBy": {
            "id": "64f1a2b3c4d5e6f7g8h9i0j1",
            "username": "john_doe_123"
          },
          "editedAt": "2024-01-20T22:00:00.000Z",
          "reason": "Fixed typo in methodology section",
          "changes": ["content.text", "tags"]
        }
      ]
    }
  }
}
```

### 5.5 Delete Post

**Endpoint:** `DELETE /api/communities/:communityId/posts/:postId`  
**Authentication:** Bearer Token Required  
**Purpose:** Delete a post (soft delete with option for hard delete)

**User Flow:**
1. Author or moderator clicks "Delete Post"
2. Confirmation dialog with options appears
3. User confirms deletion with reason
4. Post marked as deleted (soft delete)

**Permissions:** Post Author, Community Moderators+
**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "reason": "string (optional, max 500 chars) - Reason for deletion",
  "hardDelete": "boolean (optional, default: false) - Permanent deletion",
  "notifyAuthor": "boolean (optional, default: true) - Notify author if deleted by moderator"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully",
  "data": {
    "postId": "64f1a2b3c4d5e6f7g8h9i0j13",
    "deletedAt": "2024-01-20T23:00:00.000Z",
    "deletedBy": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe_123",
      "role": "owner"
    },
    "reason": "Duplicate content",
    "hardDelete": false,
    "recoverable": true,
    "recoverableUntil": "2024-02-20T23:00:00.000Z"
  }
}
```

---

## 👍 6. User Interactions

### 6.1 Like/Unlike Post

**Endpoint:** `POST /api/communities/:communityId/posts/:postId/like`  
**Authentication:** Bearer Token Required  
**Purpose:** Toggle like status on a post

**User Flow:**
1. User clicks heart/like icon on post
2. System toggles like status
3. Like count updates immediately
4. Author receives notification (if enabled)

**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "action": "string (optional, enum: ['like', 'unlike']) - If omitted, toggles current state"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "data": {
    "interaction": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j21",
      "type": "like",
      "user": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123"
      },
      "createdAt": "2024-01-21T10:00:00.000Z"
    },
    "post": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j13",
      "stats": {
        "likes": 16,
        "comments": 4,
        "shares": 2,
        "views": 128
      }
    },
    "userInteraction": {
      "hasLiked": true,
      "hasCommented": false,
      "hasShared": false,
      "hasSaved": true
    },
    "impactPoints": {
      "awarded": 2,
      "reason": "Liked post",
      "userTotal": 127
    }
  }
}
```

**Success Response - Unlike (200):**
```json
{
  "success": true,
  "message": "Post unliked successfully",
  "data": {
    "post": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j13",
      "stats": {
        "likes": 15
      }
    },
    "userInteraction": {
      "hasLiked": false
    }
  }
}
```

### 6.2 Comment on Post

**Endpoint:** `POST /api/communities/:communityId/posts/:postId/comments`  
**Authentication:** Bearer Token Required  
**Purpose:** Add a comment to a post or reply to existing comment

**User Flow:**
1. User types comment in comment box
2. Can mention other users with @ symbol
3. Can attach images or files
4. Comment posted and notifications sent

**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "content": "string (required, 1-2000 chars) - Comment text",
  "parentCommentId": "string (optional) - ID of parent comment for replies",
  "mentions": [
    {
      "userId": "string (required) - ID of mentioned user",
      "username": "string (required) - Username of mentioned user",
      "position": "number (required) - Character position in content"
    }
  ],
  "attachments": [
    {
      "type": "string (enum: ['image', 'file', 'gif'])",
      "url": "string (required)",
      "caption": "string (optional)"
    }
  ],
  "replyNotification": "boolean (optional, default: true) - Notify parent comment author"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j22",
      "content": "This is an excellent breakthrough! @research_colleague what do you think about the scalability implications?",
      "author": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "firstname": "John",
        "lastname": "Doe",
        "profilePicture": "https://avatar.vercel.sh/john_doe_123",
        "role": "owner"
      },
      "parentCommentId": null,
      "depth": 0,
      "stats": {
        "likes": 0,
        "replies": 0
      },
      "mentions": [
        {
          "userId": "64f1a2b3c4d5e6f7g8h9i0j18",
          "username": "research_colleague",
          "position": 45
        }
      ],
      "attachments": [],
      "moderationStatus": "approved",
      "createdAt": "2024-01-21T10:30:00.000Z",
      "updatedAt": "2024-01-21T10:30:00.000Z"
    },
    "post": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j13",
      "stats": {
        "comments": 5
      }
    },
    "impactPoints": {
      "awarded": 5,
      "reason": "Added comment",
      "userTotal": 132
    },
    "notifications": {
      "mentionsSent": 1,
      "authorNotified": true
    }
  }
}
```

### 6.3 Vote on Poll

**Endpoint:** `POST /api/communities/:communityId/posts/:postId/poll/vote`  
**Authentication:** Bearer Token Required  
**Purpose:** Vote on poll options

**User Flow:**
1. User views poll post
2. Selects one or multiple options (based on poll settings)
3. Optionally adds comment with vote
4. Vote recorded and results updated

**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "optionIds": "array (required) - Array of option IDs to vote for",
  "comment": "string (optional, max 500 chars) - Optional comment with vote",
  "anonymous": "boolean (optional, default: false) - Vote anonymously if poll allows"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": {
    "vote": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j23",
      "optionIds": [0],
      "comment": "I've been using PyTorch for the past 3 years and find it very intuitive for research prototyping.",
      "anonymous": false,
      "votedAt": "2024-01-21T11:00:00.000Z"
    },
    "poll": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j14",
      "question": "Which AI framework do you use most often for research projects?",
      "options": [
        {
          "id": 0,
          "text": "PyTorch",
          "description": "Facebook's dynamic neural network framework",
          "votes": 46,
          "percentage": 63.9,
          "userHasVoted": true
        },
        {
          "id": 1,
          "text": "TensorFlow",
          "description": "Google's comprehensive ML platform",
          "votes": 18,
          "percentage": 25.0,
          "userHasVoted": false
        },
        {
          "id": 2,
          "text": "JAX",
          "description": "Google's composable transformations library",
          "votes": 5,
          "percentage": 6.9,
          "userHasVoted": false
        },
        {
          "id": 3,
          "text": "Other",
          "votes": 3,
          "percentage": 4.2,
          "userHasVoted": false
        }
      ],
      "totalVotes": 72,
      "userVote": {
        "optionIds": [0],
        "votedAt": "2024-01-21T11:00:00.000Z",
        "comment": "I've been using PyTorch for the past 3 years..."
      },
      "settings": {
        "allowMultipleVotes": false,
        "anonymousVoting": false,
        "showResultsBeforeVoting": false
      },
      "expiresAt": "2024-01-28T11:00:00.000Z",
      "status": "active"
    },
    "impactPoints": {
      "awarded": 3,
      "reason": "Voted in poll",
      "userTotal": 135
    }
  }
}
```

**Error Responses:**
```json
// Poll Expired (422)
{
  "success": false,
  "error": {
    "code": "POLL_EXPIRED",
    "message": "This poll has expired and no longer accepts votes",
    "details": {
      "expiredAt": "2024-01-28T11:00:00.000Z",
      "finalResults": {
        "totalVotes": 72,
        "winningOption": "PyTorch (63.9%)"
      }
    }
  }
}

// Already Voted (409)
{
  "success": false,
  "error": {
    "code": "ALREADY_VOTED",
    "message": "You have already voted in this poll",
    "details": {
      "votedAt": "2024-01-21T11:00:00.000Z",
      "canChangeVote": false
    }
  }
}
```

### 6.4 RSVP to Event

**Endpoint:** `POST /api/communities/:communityId/posts/:postId/event/rsvp`  
**Authentication:** Bearer Token Required  
**Purpose:** RSVP to an event post

**User Flow:**
1. User views event post
2. Clicks RSVP button (Going/Maybe/Not Going)
3. Fills out registration form if required
4. RSVP recorded and confirmation sent

**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "response": "string (required, enum: ['going', 'maybe', 'not_going'])",
  "guestCount": "number (optional, default: 1) - Number of attendees",
  "registrationData": {
    "dietary_preferences": "string (optional)",
    "additional_notes": "string (optional, max 500 chars)",
    "contact_email": "string (optional, valid email)",
    "emergency_contact": "string (optional)"
  },
  "notifyChanges": "boolean (optional, default: true) - Notify about event changes"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "RSVP recorded successfully",
  "data": {
    "rsvp": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j24",
      "response": "going",
      "guestCount": 1,
      "registrationData": {
        "dietary_preferences": "Vegetarian",
        "additional_notes": "Looking forward to the keynote session!",
        "contact_email": "john.doe@university.edu"
      },
      "rsvpAt": "2024-01-21T12:00:00.000Z"
    },
    "event": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j16",
      "title": "AI Research Symposium 2024",
      "startDateTime": "2024-02-15T09:00:00.000Z",
      "capacity": {
        "maxAttendees": 200,
        "currentAttendees": 68,
        "spotsRemaining": 132
      },
      "rsvpStats": {
        "going": 68,
        "maybe": 23,
        "notGoing": 8
      },
      "userRSVP": {
        "response": "going",
        "rsvpAt": "2024-01-21T12:00:00.000Z"
      },
      "waitingList": false
    },
    "registrationConfirmation": {
      "confirmationNumber": "AI2024-REG-001235",
      "qrCode": "https://cdn.example.com/events/qr/AI2024-REG-001235.png",
      "icalFile": "https://cdn.example.com/events/ical/AI2024-REG-001235.ics"
    },
    "impactPoints": {
      "awarded": 10,
      "reason": "RSVP to event",
      "userTotal": 145
    }
  }
}
```

**Error Responses:**
```json
// Event Full (422)
{
  "success": false,
  "error": {
    "code": "EVENT_FULL",
    "message": "This event is at full capacity",
    "details": {
      "maxAttendees": 200,
      "currentAttendees": 200,
      "waitingListAvailable": true,
      "waitingListPosition": null
    }
  }
}

// Registration Closed (422)
{
  "success": false,
  "error": {
    "code": "REGISTRATION_CLOSED",
    "message": "Registration for this event has closed",
    "details": {
      "registrationDeadline": "2024-02-10T23:59:59.000Z",
      "eventDate": "2024-02-15T09:00:00.000Z"
    }
  }
}
```

### 6.5 Save/Bookmark Post

**Endpoint:** `POST /api/communities/:communityId/posts/:postId/save`  
**Authentication:** Bearer Token Required  
**Purpose:** Save post to user's bookmarks for later reference

**User Flow:**
1. User clicks bookmark/save icon on post
2. Post added to user's saved posts collection
3. Can organize saves into collections/folders
4. Accessible from user's profile/dashboard

**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "action": "string (optional, enum: ['save', 'unsave']) - If omitted, toggles state",
  "collection": "string (optional) - Collection name to save to",
  "notes": "string (optional, max 500 chars) - Personal notes about saved post",
  "tags": "array (optional) - Personal tags for organization"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post saved successfully",
  "data": {
    "savedPost": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j25",
      "post": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j13",
        "title": "Latest Breakthrough in Transformer Architecture",
        "author": {
          "username": "john_doe_123"
        }
      },
      "collection": "AI Research Papers",
      "notes": "Important methodology for my thesis research",
      "tags": ["transformer", "thesis-reference", "methodology"],
      "savedAt": "2024-01-21T13:00:00.000Z"
    },
    "userSavedPosts": {
      "total": 23,
      "collections": ["AI Research Papers", "Reading List", "Favorites"]
    }
  }
}
```

### 6.6 Share Post

**Endpoint:** `POST /api/communities/:communityId/posts/:postId/share`  
**Authentication:** Bearer Token Required  
**Purpose:** Share post to other communities, social media, or generate share link

**User Flow:**
1. User clicks share button on post
2. Selects sharing method (other communities, external platforms)
3. Adds optional comment/context
4. Share recorded and notifications sent

**URL Parameters:** `communityId`, `postId` (required)

**Request Body:**
```json
{
  "shareType": "string (required, enum: ['community', 'external', 'link', 'email'])",
  "destination": "string (optional) - Community ID for community shares, platform for external",
  "message": "string (optional, max 500 chars) - Additional message with share",
  "includeContext": "boolean (optional, default: true) - Include original post context",
  "recipients": "array (optional) - For email shares, array of email addresses"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post shared successfully",
  "data": {
    "share": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j26",
      "shareType": "community",
      "destination": {
        "communityId": "64f1a2b3c4d5e6f7g8h9i0j27",
        "communityName": "Machine Learning Discussion"
      },
      "message": "Thought this would be interesting for our community!",
      "sharedAt": "2024-01-21T14:00:00.000Z"
    },
    "post": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j13",
      "stats": {
        "shares": 3
      }
    },
    "shareLink": "https://community.example.com/share/64f1a2b3c4d5e6f7g8h9i0j13",
    "impactPoints": {
      "awarded": 5,
      "reason": "Shared post",
      "userTotal": 150
    }
  }
}
```

---

## ⚙️ 7. Community Settings & Administration

### 7.1 Update Community Settings

**Endpoint:** `PUT /api/communities/:communityId/settings`  
**Authentication:** Bearer Token Required  
**Purpose:** Update various community settings and configurations

**User Flow:**
1. Community admin navigates to settings page
2. Updates desired settings categories
3. Reviews changes and impacts
4. Saves settings with change log

**Permissions:** Owner, Admin
**URL Parameters:** `communityId` (required)

**Request Body:**
```json
{
  "privacy": {
    "visibility": "string (optional, enum: ['public', 'protected', 'private'])",
    "joinMethod": "string (optional, enum: ['open', 'approval', 'invite_only'])",
    "searchable": "boolean (optional)",
    "allowMemberInvites": "boolean (optional)",
    "requireApproval": "boolean (optional)"
  },
  "contentSettings": {
    "allowedPostTypes": "array (optional, subset of ['text', 'image', 'poll', 'event', 'resource'])",
    "autoApproveContent": "boolean (optional)",
    "allowExternalLinks": "boolean (optional)",
    "postingPermissions": {
      "createPost": "string (optional, enum: ['all_members', 'contributors_up', 'moderators_up', 'admins_up'])",
      "createPoll": "string (optional)",
      "createEvent": "string (optional)",
      "pinPosts": "string (optional)",
      "moderatePosts": "string (optional)"
    },
    "commentSettings": {
      "allowComments": "boolean (optional)",
      "requireApproval": "boolean (optional)",
      "allowAnonymous": "boolean (optional)",
      "allowNestedReplies": "boolean (optional)",
      "maxNestingLevel": "number (optional, 1-10)"
    }
  },
  "moderation": {
    "autoModerationEnabled": "boolean (optional)",
    "blockedWords": "array (optional) - List of blocked words/phrases",
    "requirePostApproval": "boolean (optional)",
    "newMemberPostRestriction": "string (optional, enum: ['none', '24hours', '7days', '30days'])",
    "spamDetection": {
      "enabled": "boolean (optional)",
      "sensitivity": "string (optional, enum: ['low', 'medium', 'high'])"
    },
    "reportingEnabled": "boolean (optional)"
  },
  "notifications": {
    "notifyOnNewPosts": "boolean (optional)",
    "notifyOnNewMembers": "boolean (optional)",
    "notifyOnComments": "boolean (optional)",
    "notifyOnEvents": "boolean (optional)",
    "digestFrequency": "string (optional, enum: ['none', 'daily', 'weekly', 'monthly'])",
    "mentionNotifications": "boolean (optional)"
  },
  "features": {
    "allowPosts": "boolean (optional)",
    "allowPolls": "boolean (optional)",
    "allowEvents": "boolean (optional)",
    "allowResources": "boolean (optional)",
    "allowDiscussions": "boolean (optional)",
    "enableAnalytics": "boolean (optional)",
    "enableLeaderboard": "boolean (optional)"
  },
  "integrations": {
    "slackWebhook": "string (optional, valid webhook URL)",
    "discordWebhook": "string (optional)",
    "emailIntegration": "boolean (optional)",
    "calendarIntegration": "boolean (optional)"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Community settings updated successfully",
  "data": {
    "community": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "AI Research Hub",
      "privacy": {
        "visibility": "protected",
        "joinMethod": "approval",
        "searchable": true,
        "allowMemberInvites": true,
        "requireApproval": true
      },
      "contentSettings": {
        "allowedPostTypes": ["text", "image", "poll", "event"],
        "autoApproveContent": false,
        "postingPermissions": {
          "createPost": "contributors_up",
          "createPoll": "moderators_up",
          "createEvent": "admins_up"
        }
      },
      "moderation": {
        "autoModerationEnabled": true,
        "blockedWords": ["spam", "inappropriate"],
        "requirePostApproval": false,
        "newMemberPostRestriction": "24hours"
      },
      "updatedAt": "2024-01-21T15:00:00.000Z"
    },
    "changesLog": {
      "updatedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "role": "owner"
      },
      "updatedAt": "2024-01-21T15:00:00.000Z",
      "changes": [
        "privacy.visibility changed from public to protected",
        "contentSettings.postingPermissions.createPost changed to contributors_up",
        "moderation.newMemberPostRestriction set to 24hours"
      ],
      "notificationsSent": {
        "admins": 3,
        "moderators": 8,
        "allMembers": false
      }
    }
  }
}
```

### 7.2 Manage Join Requests

**Endpoint:** `GET /api/communities/:communityId/requests`  
**Authentication:** Bearer Token Required  
**Purpose:** Get pending join requests for approval-based communities

**User Flow:**
1. Admin views pending requests section
2. Reviews applicant information and reasons
3. Can approve, reject, or request more information
4. Bulk actions available for efficiency

**Permissions:** Moderator+
**URL Parameters:** `communityId` (required)

**Query Parameters:**
```
status: string (optional, default: 'pending') - Filter by status
  Options: 'pending', 'approved', 'rejected', 'expired'
sortBy: string (optional, default: 'submittedAt') - Sort order
page: number (optional, default: 1)
limit: number (optional, default: 20)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j28",
        "user": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j29",
          "username": "new_researcher",
          "firstname": "Maria",
          "lastname": "Garcia",
          "email": "maria.garcia@university.edu",
          "profilePicture": "https://avatar.vercel.sh/new_researcher",
          "institutionalDomain": "university.edu",
          "bio": {
            "bioAbout": "PhD student researching computer vision and deep learning",
            "bioInterests": ["Computer Vision", "Deep Learning", "Medical AI"]
          },
          "joinedDate": "2024-01-15T10:00:00.000Z"
        },
        "status": "pending",
        "requestType": "join_request",
        "submitedAt": "2024-01-21T14:30:00.000Z",
        "joinReason": "I'm a PhD student at the university working on computer vision applications in medical imaging. I'd love to join this community to share my research and learn from others working in AI.",
        "additionalInfo": {
          "expertise": ["Computer Vision", "Medical AI", "PyTorch"],
          "institution": "University AI Department",
          "linkedInProfile": "https://linkedin.com/in/maria-garcia-ai",
          "motivation": "Looking to collaborate on AI research projects"
        },
        "domainMatch": true,
        "eligibilityScore": 9.2,
        "autoJoinRecommended": false,
        "potentialContributions": [
          "Medical AI expertise",
          "Computer vision knowledge",
          "Active researcher"
        ],
        "similarMembers": [
          {
            "username": "cv_researcher",
            "similarity": "Computer vision focus"
          }
        ]
      }
      // ... more requests
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "hasMore": false
    },
    "requestStats": {
      "pending": 5,
      "approved": 23,
      "rejected": 2,
      "expired": 1,
      "averageProcessingTime": "2.3 days",
      "approvalRate": 92.0
    }
  }
}
```

### 7.3 Approve/Reject Join Request

**Endpoint:** `POST /api/communities/:communityId/requests/:requestId/respond`  
**Authentication:** Bearer Token Required  
**Purpose:** Approve or reject a join request

**User Flow:**
1. Admin reviews join request details
2. Clicks approve/reject button
3. Optionally adds welcome message or rejection reason
4. Decision processed and user notified

**Permissions:** Moderator+
**URL Parameters:** `communityId`, `requestId` (required)

**Request Body:**
```json
{
  "action": "string (required, enum: ['approve', 'reject'])",
  "response": "string (alias for action, for backward compatibility)",
  "message": "string (optional, max 500 chars) - Welcome message or rejection reason",
  "assignedRole": "string (optional, default: 'member', enum: ['member', 'contributor'])",
  "additionalPermissions": "array (optional) - Additional permissions to grant",
  "probationPeriod": "number (optional, days) - Probation period for new member",
  "welcomeResources": "array (optional) - Links to helpful resources for new members"
}
```

**Success Response - Approval (200):**
```json
{
  "success": true,
  "message": "Join request approved successfully",
  "data": {
    "request": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j28",
      "status": "approved",
      "respondedAt": "2024-01-21T16:00:00.000Z",
      "respondedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "role": "owner"
      },
      "message": "Welcome to the AI Research Hub! We're excited to have you join our community."
    },
    "newMember": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j30",
      "user": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j29",
        "username": "new_researcher",
        "firstname": "Maria",
        "lastname": "Garcia"
      },
      "role": "member",
      "status": "active",
      "joinedAt": "2024-01-21T16:00:00.000Z",
      "probationUntil": null,
      "welcomeMessageSent": true
    },
    "community": {
      "memberCount": 157,
      "stats": {
        "newMembersThisWeek": 6
      }
    },
    "onboardingActions": {
      "welcomeEmailSent": true,
      "addedToNewMemberGroup": true,
      "resourcesShared": ["Community Guidelines", "Getting Started Guide"]
    }
  }
}
```

**Success Response - Rejection (200):**
```json
{
  "success": true,
  "message": "Join request rejected",
  "data": {
    "request": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j28",
      "status": "rejected",
      "respondedAt": "2024-01-21T16:00:00.000Z",
      "respondedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123"
      },
      "message": "Thank you for your interest. We're currently focusing on researchers with specific expertise in transformer architectures. Please consider applying to our general ML community."
    },
    "alternatives": [
      {
        "communityId": "64f1a2b3c4d5e6f7g8h9i0j31",
        "name": "Machine Learning Discussion",
        "reason": "Better match for general ML interests"
      }
    ],
    "reapplicationAllowed": true,
    "reapplicationCooldown": "30 days"
  }
}
```

### 7.4 Get Community Analytics

**Endpoint:** `GET /api/communities/:communityId/analytics`  
**Authentication:** Bearer Token Required  
**Purpose:** Get detailed analytics and insights about community performance

**User Flow:**
1. Admin navigates to analytics dashboard
2. Views various metrics and trends
3. Can filter by time periods and metrics
4. Exports reports for further analysis

**Permissions:** Admin+
**URL Parameters:** `communityId` (required)

**Query Parameters:**
```
period: string (optional, default: '30days') - Time period
  Options: '7days', '30days', '90days', '6months', '1year', 'all'
metrics: string (optional, default: 'all') - Specific metrics to include
  Options: 'all', 'growth', 'engagement', 'content', 'events', 'moderation'
granularity: string (optional, default: 'daily') - Data granularity
  Options: 'hourly', 'daily', 'weekly', 'monthly'
compare: string (optional) - Compare with previous period
export: boolean (optional) - Return exportable format
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "community": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "AI Research Hub",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "period": {
      "start": "2023-12-22T00:00:00.000Z",
      "end": "2024-01-21T23:59:59.000Z",
      "days": 30
    },
    "summary": {
      "totalMembers": 157,
      "activeMembers": 92,
      "newMembers": 23,
      "totalPosts": 47,
      "totalComments": 189,
      "totalLikes": 423,
      "totalViews": 3421,
      "engagementRate": 78.5
    },
    "growth": {
      "memberGrowth": {
        "current": 23,
        "previous": 18,
        "growthRate": 27.8,
        "trend": "increasing"
      },
      "contentGrowth": {
        "posts": {
          "current": 47,
          "previous": 32,
          "growthRate": 46.9
        },
        "comments": {
          "current": 189,
          "previous": 134,
          "growthRate": 41.0
        }
      },
      "churnRate": 2.1,
      "retentionRate": 97.9
    },
    "engagement": {
      "averageSessionDuration": "12.3 minutes",
      "averagePostsPerActiveUser": 2.8,
      "averageCommentsPerPost": 4.02,
      "likeToPostRatio": 9.0,
      "topEngagementHours": ["14:00-15:00", "20:00-21:00"],
      "topEngagementDays": ["Tuesday", "Wednesday", "Thursday"],
      "userSegments": {
        "highlyActive": {
          "count": 23,
          "percentage": 14.6,
          "criteria": "5+ posts or 20+ interactions"
        },
        "moderatelyActive": {
          "count": 69,
          "percentage": 43.9,
          "criteria": "1-4 posts or 5-19 interactions"
        },
        "lowActivity": {
          "count": 65,
          "percentage": 41.4,
          "criteria": "Mostly viewing content"
        }
      }
    },
    "content": {
      "postTypes": {
        "text": {
          "count": 28,
          "percentage": 59.6,
          "avgLikes": 12.5,
          "avgComments": 4.8
        },
        "poll": {
          "count": 12,
          "percentage": 25.5,
          "avgVotes": 34.2,
          "avgComments": 2.1
        },
        "event": {
          "count": 7,
          "percentage": 14.9,
          "avgRSVPs": 23.4,
          "avgAttendance": 85.3
        }
      },
      "topTags": [
        {"tag": "artificial-intelligence", "count": 23, "engagement": 8.7},
        {"tag": "machine-learning", "count": 18, "engagement": 7.9},
        {"tag": "research", "count": 15, "engagement": 6.8},
        {"tag": "transformer", "count": 12, "engagement": 9.2}
      ],
      "contentQuality": {
        "avgWordsPerPost": 487,
        "avgReadingTime": "2.3 minutes",
        "highQualityPosts": 34,
        "reportedPosts": 1,
        "moderatedPosts": 3
      }
    },
    "topContributors": [
      {
        "user": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "username": "john_doe_123",
          "firstname": "John",
          "lastname": "Doe",
          "role": "owner"
        },
        "stats": {
          "posts": 8,
          "comments": 34,
          "likes": 156,
          "impactScore": 298,
          "engagementGenerated": 423
        },
        "growth": {
          "postsGrowth": 23.1,
          "engagementGrowth": 45.2
        }
      }
      // ... more contributors
    ],
    "trends": {
      "membershipGrowth": [
        {"date": "2024-01-01", "newMembers": 3, "totalMembers": 134},
        {"date": "2024-01-08", "newMembers": 7, "totalMembers": 141},
        {"date": "2024-01-15", "newMembers": 13, "totalMembers": 157}
      ],
      "contentActivity": [
        {"date": "2024-01-01", "posts": 2, "comments": 8, "likes": 15},
        {"date": "2024-01-08", "posts": 6, "comments": 24, "likes": 67},
        {"date": "2024-01-15", "posts": 4, "comments": 18, "likes": 43}
      ]
    },
    "predictions": {
      "projected30DayGrowth": {
        "members": 28,
        "posts": 52,
        "engagement": "15% increase"
      },
      "recommendedActions": [
        "Increase event frequency to boost engagement",
        "Feature high-performing content to drive visibility",
        "Implement member spotlights to recognize contributors"
      ]
    }
  }
}
```

---

## 🔔 8. Notifications

### 8.1 Get User Notifications

**Endpoint:** `GET /api/notifications`  
**Authentication:** Bearer Token Required  
**Purpose:** Retrieve user's notifications with filtering options

**User Flow:**
1. User opens notifications panel/page
2. System shows recent notifications
3. Can filter by type, read status, community
4. Mark as read or take actions from notifications

**Query Parameters:**
```
type: string (optional) - Filter by notification type
  Options: 'all', 'community', 'post', 'comment', 'like', 'event', 'system'
read: boolean (optional) - Filter by read status
community: string (optional) - Filter by specific community ID
priority: string (optional) - Filter by priority ('high', 'medium', 'low')
page: number (optional, default: 1)
limit: number (optional, default: 20, max: 100)
markAsRead: boolean (optional, default: false) - Mark notifications as read when fetching
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j32",
        "type": "post_like",
        "category": "engagement",
        "priority": "medium",
        "title": "Someone liked your post",
        "message": "Sarah Johnson and 2 others liked your post \"Latest Breakthrough in Transformer Architecture\"",
        "data": {
          "postId": "64f1a2b3c4d5e6f7g8h9i0j13",
          "postTitle": "Latest Breakthrough in Transformer Architecture",
          "communityId": "64f1a2b3c4d5e6f7g8h9i0j2",
          "communityName": "AI Research Hub",
          "likedBy": [
            {
              "id": "64f1a2b3c4d5e6f7g8h9i0j33",
              "username": "sarah_johnson",
              "firstname": "Sarah",
              "lastname": "Johnson",
              "profilePicture": "https://avatar.vercel.sh/sarah_johnson"
            }
          ],
          "totalLikes": 16,
          "isGrouped": true,
          "groupedCount": 3
        },
        "read": false,
        "createdAt": "2024-01-21T17:45:00.000Z",
        "actionUrl": "/communities/ai-research-hub/posts/latest-breakthrough-transformer-architecture",
        "actions": [
          {
            "type": "view_post",
            "label": "View Post",
            "url": "/communities/ai-research-hub/posts/latest-breakthrough-transformer-architecture"
          },
          {
            "type": "reply",
            "label": "Reply",
            "url": "/communities/ai-research-hub/posts/latest-breakthrough-transformer-architecture#comment"
          }
        ],
        "canBeDismissed": true
      },
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j34",
        "type": "comment",
        "category": "interaction",
        "priority": "high",
        "title": "New comment on your post",
        "message": "Alex Rodriguez commented on your post \"Latest Breakthrough in Transformer Architecture\"",
        "data": {
          "commentId": "64f1a2b3c4d5e6f7g8h9i0j22",
          "commentExcerpt": "This is fascinating work! Have you considered applying this architecture to multimodal learning tasks?...",
          "postId": "64f1a2b3c4d5e6f7g8h9i0j13",
          "postTitle": "Latest Breakthrough in Transformer Architecture",
          "communityId": "64f1a2b3c4d5e6f7g8h9i0j2",
          "commenter": {
            "id": "64f1a2b3c4d5e6f7g8h9i0j18",
            "username": "research_colleague",
            "firstname": "Alex",
            "lastname": "Rodriguez",
            "profilePicture": "https://avatar.vercel.sh/research_colleague"
          }
        },
        "read": false,
        "createdAt": "2024-01-21T16:20:00.000Z",
        "actionUrl": "/communities/ai-research-hub/posts/latest-breakthrough-transformer-architecture#comment-64f1a2b3c4d5e6f7g8h9i0j22"
      },
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j35",
        "type": "community_member_joined",
        "category": "community",
        "priority": "low",
        "title": "New member joined",
        "message": "Maria Garcia has joined AI Research Hub",
        "data": {
          "communityId": "64f1a2b3c4d5e6f7g8h9i0j2",
          "communityName": "AI Research Hub",
          "newMember": {
            "id": "64f1a2b3c4d5e6f7g8h9i0j29",
            "username": "new_researcher",
            "firstname": "Maria",
            "lastname": "Garcia",
            "profilePicture": "https://avatar.vercel.sh/new_researcher",
            "bio": {
              "bioAbout": "PhD student researching computer vision and deep learning"
            }
          },
          "memberCount": 157,
          "shouldWelcome": true
        },
        "read": true,
        "createdAt": "2024-01-21T16:00:00.000Z",
        "actionUrl": "/communities/ai-research-hub/members",
        "actions": [
          {
            "type": "welcome_member",
            "label": "Welcome Member",
            "method": "POST",
            "url": "/api/communities/64f1a2b3c4d5e6f7g8h9i0j2/members/64f1a2b3c4d5e6f7g8h9i0j29/welcome"
          }
        ]
      },
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j36",
        "type": "event_reminder",
        "category": "event",
        "priority": "high",
        "title": "Event reminder",
        "message": "AI Research Symposium 2024 is starting in 3 days",
        "data": {
          "eventId": "64f1a2b3c4d5e6f7g8h9i0j16",
          "eventTitle": "AI Research Symposium 2024",
          "startDateTime": "2024-02-15T09:00:00.000Z",
          "location": {
            "type": "hybrid",
            "venue": {
              "name": "University Conference Center"
            }
          },
          "userRSVP": {
            "response": "going",
            "confirmationNumber": "AI2024-REG-001235"
          },
          "reminderType": "3_days_before"
        },
        "read": false,
        "createdAt": "2024-01-21T15:30:00.000Z",
        "expiresAt": "2024-02-15T17:00:00.000Z",
        "actionUrl": "/communities/ai-research-hub/events/ai-research-symposium-2024",
        "actions": [
          {
            "type": "view_event",
            "label": "View Event Details",
            "url": "/communities/ai-research-hub/events/ai-research-symposium-2024"
          },
          {
            "type": "add_to_calendar",
            "label": "Add to Calendar",
            "url": "/api/events/64f1a2b3c4d5e6f7g8h9i0j16/calendar.ics"
          }
        ]
      },
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j37",
        "type": "mention",
        "category": "interaction",
        "priority": "high",
        "title": "You were mentioned",
        "message": "You were mentioned in a comment by Sarah Chen",
        "data": {
          "mentionedIn": {
            "type": "comment",
            "id": "64f1a2b3c4d5e6f7g8h9i0j38",
            "content": "Great analysis @john_doe_123! This aligns perfectly with the research you shared last week.",
            "contextType": "post",
            "contextId": "64f1a2b3c4d5e6f7g8h9i0j39",
            "contextTitle": "New Developments in Neural Architecture Search"
          },
          "mentionedBy": {
            "id": "64f1a2b3c4d5e6f7g8h9i0j40",
            "username": "sarah_chen",
            "firstname": "Sarah",
            "lastname": "Chen",
            "profilePicture": "https://avatar.vercel.sh/sarah_chen"
          },
          "communityId": "64f1a2b3c4d5e6f7g8h9i0j2",
          "communityName": "AI Research Hub"
        },
        "read": false,
        "createdAt": "2024-01-21T14:15:00.000Z",
        "actionUrl": "/communities/ai-research-hub/posts/new-developments-neural-architecture-search#comment-64f1a2b3c4d5e6f7g8h9i0j38"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 47,
      "totalPages": 3,
      "hasMore": true
    },
    "notificationStats": {
      "unreadCount": 12,
      "totalNotifications": 47,
      "typeBreakdown": {
        "likes": 8,
        "comments": 15,
        "mentions": 3,
        "members": 6,
        "events": 4,
        "system": 2,
        "polls": 3,
        "community_updates": 6
      },
      "priorityBreakdown": {
        "high": 5,
        "medium": 28,
        "low": 14
      }
    },
    "settings": {
      "emailNotifications": true,
      "pushNotifications": true,
      "digestEnabled": true,
      "digestFrequency": "weekly"
    }
  }
}
```

### 8.2 Mark Notifications as Read

**Endpoint:** `POST /api/notifications/mark-read`  
**Authentication:** Bearer Token Required  
**Purpose:** Mark one or multiple notifications as read

**User Flow:**
1. User opens notifications
2. System automatically marks visible notifications as read OR
3. User clicks "Mark all as read" button OR
4. User individually marks notifications as read

**Request Body:**
```json
{
  "notificationIds": "array (optional) - Specific notification IDs to mark as read",
  "all": "boolean (optional) - Mark all notifications as read",
  "type": "string (optional) - Mark all notifications of specific type as read",
  "community": "string (optional) - Mark all notifications from specific community as read",
  "before": "string (optional, ISO date) - Mark notifications before this date as read"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notifications marked as read",
  "data": {
    "markedCount": 12,
    "remainingUnreadCount": 0,
    "markedNotifications": [
      "64f1a2b3c4d5e6f7g8h9i0j32",
      "64f1a2b3c4d5e6f7g8h9i0j34"
      // ... more IDs
    ]
  }
}
```

### 8.3 Update Notification Preferences

**Endpoint:** `PUT /api/notifications/preferences`  
**Authentication:** Bearer Token Required  
**Purpose:** Update user's notification preferences

**User Flow:**
1. User navigates to notification settings
2. Configures which notifications to receive
3. Sets delivery methods (email, push, in-app)
4. Saves preferences

**Request Body:**
```json
{
  "emailNotifications": {
    "enabled": "boolean (default: true)",
    "types": {
      "mentions": "boolean (default: true)",
      "comments": "boolean (default: true)",
      "likes": "boolean (default: false)",
      "communityUpdates": "boolean (default: true)",
      "events": "boolean (default: true)",
      "newMembers": "boolean (default: false)",
      "systemAnnouncements": "boolean (default: true)"
    },
    "digest": {
      "enabled": "boolean (default: true)",
      "frequency": "string (enum: ['daily', 'weekly', 'monthly'])",
      "time": "string (default: '09:00') - Time for daily digest",
      "day": "string (default: 'monday') - Day for weekly digest"
    }
  },
  "pushNotifications": {
    "enabled": "boolean (default: true)",
    "types": {
      "mentions": "boolean (default: true)",
      "comments": "boolean (default: true)",
      "likes": "boolean (default: false)",
      "events": "boolean (default: true)",
      "urgent": "boolean (default: true)"
    },
    "quietHours": {
      "enabled": "boolean (default: false)",
      "start": "string (default: '22:00')",
      "end": "string (default: '08:00')"
    }
  },
  "inAppNotifications": {
    "enabled": "boolean (default: true)",
    "showPreview": "boolean (default: true)",
    "groupSimilar": "boolean (default: true)",
    "autoMarkReadOnView": "boolean (default: true)"
  },
  "communitySpecific": [
    {
      "communityId": "string (required)",
      "emailNotifications": "boolean",
      "pushNotifications": "boolean",
      "types": {
        "newPosts": "boolean",
        "newComments": "boolean",
        "newMembers": "boolean",
        "events": "boolean"
      }
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    "preferences": {
      // Updated preferences object
      "emailNotifications": {
        "enabled": true,
        "types": {
          "mentions": true,
          "comments": true,
          "likes": false,
          "communityUpdates": true,
          "events": true
        },
        "digest": {
          "enabled": true,
          "frequency": "weekly",
          "day": "monday",
          "time": "09:00"
        }
      },
      "updatedAt": "2024-01-21T18:00:00.000Z"
    },
    "effectiveImmediately": true,
    "nextDigest": "2024-01-29T09:00:00.000Z"
  }
}
```

### 8.4 Get Notification Templates

**Endpoint:** `GET /api/notifications/templates`  
**Authentication:** Bearer Token Required  
**Purpose:** Get available notification templates for customization (Admin only)

**User Flow:**
1. Admin navigates to notification template settings
2. Views current templates and their content
3. Can customize messages and formatting
4. Preview changes before applying

**Permissions:** Admin+ 
**Query Parameters:**
```
type: string (optional) - Filter by notification type
language: string (optional, default: 'en') - Template language
format: string (optional, default: 'all') - Template format ('email', 'push', 'in-app', 'all')
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "post_like_template",
        "type": "post_like",
        "category": "engagement",
        "formats": {
          "inApp": {
            "title": "{actor} liked your post",
            "message": "{actor} and {count} others liked your post \"{postTitle}\"",
            "groupedMessage": "{actors} liked your post \"{postTitle}\""
          },
          "email": {
            "subject": "Your post received new likes - {communityName}",
            "template": "post_like_email.html",
            "variables": ["actor", "postTitle", "communityName", "postUrl"]
          },
          "push": {
            "title": "Post Liked",
            "body": "{actor} liked your post \"{postTitle}\"",
            "icon": "like_icon",
            "sound": "default"
          }
        },
        "variables": {
          "actor": "User who performed the action",
          "postTitle": "Title of the post",
          "communityName": "Name of the community",
          "count": "Number of additional likes (for grouping)"
        },
        "groupingRules": {
          "enabled": true,
          "timeWindow": "1 hour",
          "maxGroupSize": 5
        },
        "isActive": true,
        "priority": "medium",
        "canCustomize": true
      }
      // ... more templates
    ],
    "customization": {
      "allowHtml": true,
      "allowVariables": true,
      "maxTitleLength": 100,
      "maxMessageLength": 500,
      "availableVariables": [
        "{actor}", "{postTitle}", "{communityName}", "{count}",
        "{actionUrl}", "{timestamp}", "{userFirstname}"
      ]
    }
  }
}
```

---

## 📈 9. Analytics & Insights

### 9.1 Get User Analytics

**Endpoint:** `GET /api/users/me/analytics`  
**Authentication:** Bearer Token Required  
**Purpose:** Get personal analytics and activity insights for the current user

**User Flow:**
1. User navigates to personal dashboard/profile
2. Views their activity statistics and trends
3. Sees impact metrics and achievements
4. Can export data or set goals

**Query Parameters:**
```
period: string (optional, default: '30days') - Time period for analytics
include: string (optional, default: 'all') - Specific metrics to include
  Options: 'all', 'posts', 'interactions', 'communities', 'impact'
export: boolean (optional) - Return data in exportable format
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe_123",
      "firstname": "John",
      "lastname": "Doe",
      "memberSince": "2024-01-15T10:30:00.000Z"
    },
    "period": {
      "start": "2023-12-22T00:00:00.000Z",
      "end": "2024-01-21T23:59:59.000Z",
      "days": 30
    },
    "overview": {
      "totalImpactPoints": 1250,
      "rank": 1,
      "level": "Expert",
      "nextLevelPoints": 1500,
      "pointsToNextLevel": 250,
      "streakCount": 15,
      "longestStreak": 22
    },
    "activity": {
      "totalPosts": 8,
      "totalComments": 34,
      "totalLikes": 156,
      "totalShares": 12,
      "totalViews": 2341,
      "communitiesActive": 3,
      "eventsAttended": 2,
      "pollsVoted": 7,
      "averageActivityPerDay": 4.2,
      "mostActiveHour": "14:00-15:00",
      "mostActiveDay": "Wednesday"
    },
    "content": {
      "posts": {
        "total": 8,
        "published": 8,
        "drafts": 2,
        "avgLikesPerPost": 19.5,
        "avgCommentsPerPost": 4.25,
        "avgViewsPerPost": 292,
        "topPerformingPost": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j13",
          "title": "Latest Breakthrough in Transformer Architecture",
          "likes": 35,
          "comments": 12,
          "views": 456
        },
        "contentTypes": {
          "text": 6,
          "poll": 1,
          "event": 1
        }
      },
      "comments": {
        "total": 34,
        "avgLikesPerComment": 4.6,
        "mostLikedComment": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j41",
          "content": "Great question! I'm actually exploring that next...",
          "likes": 15,
          "post": {
            "title": "Latest Breakthrough in Transformer Architecture"
          }
        }
      }
    },
    "communities": {
      "total": 5,
      "owned": 2,
      "adminOf": 1,
      "moderatorOf": 2,
      "memberOf": 5,
      "mostActiveIn": [
        {
          "communityId": "64f1a2b3c4d5e6f7g8h9i0j2",
          "name": "AI Research Hub",
          "role": "owner",
          "postsCount": 4,
          "commentsCount": 18,
          "impactPoints": 450
        },
        {
          "communityId": "64f1a2b3c4d5e6f7g8h9i0j42",
          "name": "Machine Learning Discussion",
          "role": "member",
          "postsCount": 2,
          "commentsCount": 12,
          "impactPoints": 180
        }
      ]
    },
    "engagement": {
      "likesReceived": {
        "posts": 156,
        "comments": 89,
        "total": 245
      },
      "commentsReceived": 67,
      "sharesReceived": 12,
      "mentionsReceived": 8,
      "followersGained": 23,
      "engagementRate": 12.4,
      "responseRate": 89.5
    },
    "achievements": {
      "badges": [
        {
          "id": "expert_contributor",
          "name": "Expert Contributor",
          "description": "Created 5+ high-quality posts",
          "earnedAt": "2024-01-20T15:00:00.000Z",
          "rarity": "uncommon"
        },
        {
          "id": "community_builder",
          "name": "Community Builder",
          "description": "Created a community with 100+ members",
          "earnedAt": "2024-01-18T10:00:00.000Z",
          "rarity": "rare"
        }
      ],
      "milestones": [
        {
          "type": "posts",
          "milestone": 10,
          "current": 8,
          "progress": 80
        },
        {
          "type": "likes",
          "milestone": 200,
          "current": 156,
          "progress": 78
        }
      ]
    },
    "trends": {
      "activityTrend": [
        {"date": "2024-01-01", "posts": 0, "comments": 2, "likes": 5},
        {"date": "2024-01-08", "posts": 2, "comments": 8, "likes": 25},
        {"date": "2024-01-15", "posts": 4, "comments": 15, "likes": 67},
        {"date": "2024-01-21", "posts": 2, "comments": 9, "likes": 59}
      ],
      "impactPointsHistory": [
        {"date": "2024-01-01", "points": 850},
        {"date": "2024-01-08", "points": 950},
        {"date": "2024-01-15", "points": 1150},
        {"date": "2024-01-21", "points": 1250}
      ]
    },
    "recommendations": [
      "Your engagement rate is excellent! Consider creating more poll content to boost interaction.",
      "You're close to Expert level. Create 2 more quality posts to unlock new privileges.",
      "Your Wednesday posts perform best. Consider scheduling important content for mid-week."
    ]
  }
}
```

### 9.2 Get Platform Analytics Summary

**Endpoint:** `GET /api/analytics/platform`  
**Authentication:** Bearer Token Required  
**Purpose:** Get overall platform statistics and trends (Admin only)

**User Flow:**
1. Admin views platform dashboard
2. Sees overall platform health metrics
3. Can identify trends and issues
4. Makes data-driven decisions

**Permissions:** Admin+
**Query Parameters:**
```
period: string (optional, default: '30days') - Time period
granularity: string (optional, default: 'daily') - Data granularity
compare: boolean (optional) - Include comparison with previous period
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2023-12-22T00:00:00.000Z",
      "end": "2024-01-21T23:59:59.000Z",
      "days": 30
    },
    "overview": {
      "totalUsers": 2847,
      "activeUsers": 1923,
      "newUsers": 234,
      "totalCommunities": 156,
      "activeCommunities": 134,
      "newCommunities": 12,
      "totalPosts": 3421,
      "totalComments": 12847,
      "totalInteractions": 45623,
      "averageEngagementRate": 67.8
    },
    "growth": {
      "userGrowth": {
        "current": 234,
        "previous": 189,
        "growthRate": 23.8,
        "trend": "increasing"
      },
      "communityGrowth": {
        "current": 12,
        "previous": 8,
        "growthRate": 50.0,
        "trend": "increasing"
      },
      "contentGrowth": {
        "posts": {
          "current": 847,
          "previous": 623,
          "growthRate": 36.0
        },
        "comments": {
          "current": 2847,
          "previous": 2134,
          "growthRate": 33.4
        }
      }
    },
    "engagement": {
      "dailyActiveUsers": 1923,
      "weeklyActiveUsers": 2456,
      "monthlyActiveUsers": 2847,
      "averageSessionDuration": "18.4 minutes",
      "pageViewsPerSession": 8.7,
      "bounceRate": 23.4,
      "retentionRates": {
        "day1": 85.2,
        "day7": 67.8,
        "day30": 45.6
      }
    },
    "content": {
      "postTypes": {
        "text": {
          "count": 2456,
          "percentage": 71.8,
          "avgEngagement": 12.4
        },
        "poll": {
          "count": 567,
          "percentage": 16.6,
          "avgEngagement": 24.7
        },
        "event": {
          "count": 398,
          "percentage": 11.6,
          "avgEngagement": 18.9
        }
      },
      "qualityMetrics": {
        "avgWordsPerPost": 342,
        "avgReadingTime": "2.1 minutes",
        "reportRate": 0.3,
        "moderationRate": 2.1
      }
    },
    "communities": {
      "byType": {
        "institutional": 67,
        "skill": 45,
        "interest": 32,
        "open": 12
      },
      "bySize": {
        "large": 23,
        "medium": 67,
        "small": 66
      },
      "topCommunities": [
        {
          "id": "64f1a2b3c4d5e6f7g8h9i0j2",
          "name": "AI Research Hub",
          "members": 234,
          "posts": 67,
          "engagement": 78.9
        }
      ]
    },
    "geographic": {
      "topCountries": [
        {"country": "United States", "users": 1234, "percentage": 43.4},
        {"country": "India", "users": 567, "percentage": 19.9},
        {"country": "United Kingdom", "users": 234, "percentage": 8.2}
      ],
      "topCities": [
        {"city": "San Francisco", "users": 234},
        {"city": "New York", "users": 189},
        {"city": "London", "users": 145}
      ]
    },
    "technology": {
      "devices": {
        "desktop": 67.8,
        "mobile": 28.9,
        "tablet": 3.3
      },
      "browsers": {
        "chrome": 68.9,
        "firefox": 12.4,
        "safari": 11.2,
        "edge": 7.5
      },
      "operatingSystems": {
        "windows": 45.6,
        "macos": 23.4,
        "ios": 15.7,
        "android": 12.8,
        "linux": 2.5
      }
    },
    "trends": {
      "userGrowth": [
        {"date": "2024-01-01", "newUsers": 23, "totalUsers": 2613},
        {"date": "2024-01-08", "newUsers": 45, "totalUsers": 2658},
        {"date": "2024-01-15", "newUsers": 67, "totalUsers": 2725},
        {"date": "2024-01-21", "newUsers": 99, "totalUsers": 2847}
      ],
      "engagement": [
        {"date": "2024-01-01", "dau": 1567, "engagementRate": 65.4},
        {"date": "2024-01-08", "dau": 1678, "engagementRate": 67.1},
        {"date": "2024-01-15", "dau": 1789, "engagementRate": 68.9},
        {"date": "2024-01-21", "dau": 1923, "engagementRate": 67.8}
      ]
    },
    "health": {
      "systemUptime": 99.97,
      "averageResponseTime": "145ms",
      "errorRate": 0.03,
      "supportTickets": {
        "open": 12,
        "resolved": 234,
        "averageResolutionTime": "4.2 hours"
      }
    }
  }
}
```

---

## 📁 10. File Upload & Media

### 10.1 Upload File

**Endpoint:** `POST /api/upload`  
**Authentication:** Bearer Token Required  
**Purpose:** Upload files (images, documents, media) for use in posts, profiles, etc.

**User Flow:**
1. User selects file from device (drag & drop or file picker)
2. File validated for type, size, security
3. File uploaded to secure storage
4. URL returned for use in content

**Request:** Multipart Form Data
```
Content-Type: multipart/form-data

file: File (required, max 10MB for images, 50MB for documents)
type: string (optional, enum: ['profile', 'post', 'community', 'comment']) - Upload context
folder: string (optional) - Organization folder
resize: string (optional, for images: 'small', 'medium', 'large', 'original')
compress: boolean (optional, default: true) - Compress images
```

**Validation Rules:**
- **Images:** JPG, PNG, GIF, WebP - Max 10MB
- **Documents:** PDF, DOC, DOCX, TXT, MD - Max 50MB  
- **Audio:** MP3, WAV, OGG - Max 25MB
- **Video:** MP4, WebM, MOV - Max 100MB
- Virus scanning and security checks
- Content moderation for images

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j43",
      "originalName": "research-paper.pdf",
      "filename": "research-paper-1642234567.pdf",
      "url": "https://cdn.example.com/uploads/documents/research-paper-1642234567.pdf",
      "thumbnailUrl": "https://cdn.example.com/uploads/thumbnails/research-paper-1642234567.jpg",
      "size": 2048576,
      "type": "application/pdf",
      "category": "document",
      "uploadedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123"
      },
      "uploadedAt": "2024-01-21T20:00:00.000Z",
      "folder": "research-papers",
      "isPublic": false,
      "downloadUrl": "https://api.example.com/files/64f1a2b3c4d5e6f7g8h9i0j43/download",
      "expiresAt": null,
      "metadata": {
        "pages": 12,
        "title": "Transformer Architecture Research",
        "author": "John Doe"
      }
    },
    "variants": {
      "original": "https://cdn.example.com/uploads/documents/research-paper-1642234567.pdf",
      "thumbnail": "https://cdn.example.com/uploads/thumbnails/research-paper-1642234567.jpg",
      "preview": "https://cdn.example.com/uploads/previews/research-paper-1642234567.jpg"
    }
  }
}
```

**Success Response - Image with Multiple Sizes (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "file": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j44",
      "originalName": "conference-photo.jpg",
      "filename": "conference-photo-1642234567.jpg",
      "url": "https://cdn.example.com/uploads/images/conference-photo-1642234567.jpg",
      "size": 1536789,
      "type": "image/jpeg",
      "category": "image",
      "uploadedAt": "2024-01-21T20:05:00.000Z",
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "isPublic": true
    },
    "variants": {
      "original": "https://cdn.example.com/uploads/images/conference-photo-1642234567.jpg",
      "large": "https://cdn.example.com/uploads/images/large/conference-photo-1642234567.jpg",
      "medium": "https://cdn.example.com/uploads/images/medium/conference-photo-1642234567.jpg",
      "small": "https://cdn.example.com/uploads/images/small/conference-photo-1642234567.jpg",
      "thumbnail": "https://cdn.example.com/uploads/images/thumbs/conference-photo-1642234567.jpg"
    },
    "optimized": {
      "webp": "https://cdn.example.com/uploads/images/webp/conference-photo-1642234567.webp",
      "avif": "https://cdn.example.com/uploads/images/avif/conference-photo-1642234567.avif"
    }
  }
}
```

**Error Responses:**
```json
// File Too Large (413)
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum allowed size",
    "details": {
      "fileSize": 52428800,
      "maxSize": 10485760,
      "fileType": "image/jpeg",
      "maxSizeForType": "10MB"
    }
  }
}

// Invalid File Type (422)
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type not supported",
    "details": {
      "fileType": "application/exe",
      "supportedTypes": ["image/jpeg", "image/png", "application/pdf", "text/plain"]
    }
  }
}

// Security Check Failed (422)
{
  "success": false,
  "error": {
    "code": "SECURITY_CHECK_FAILED",
    "message": "File failed security validation",
    "details": {
      "reason": "Potential malware detected",
      "scanId": "scan_64f1a2b3c4d5e6f7g8h9i0j45"
    }
  }
}
```

### 10.2 Get File Details

**Endpoint:** `GET /api/files/:fileId`  
**Authentication:** Bearer Token Required  
**Purpose:** Get detailed information about an uploaded file

**User Flow:**
1. User views file in post or media library
2. Clicks for details or download options
3. System returns file metadata and access info
4. User can download, share, or manage file

**URL Parameters:** `fileId` (required)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j43",
      "originalName": "research-paper.pdf",
      "filename": "research-paper-1642234567.pdf",
      "url": "https://cdn.example.com/uploads/documents/research-paper-1642234567.pdf",
      "downloadUrl": "https://api.example.com/files/64f1a2b3c4d5e6f7g8h9i0j43/download",
      "size": 2048576,
      "formattedSize": "2.0 MB",
      "type": "application/pdf",
      "category": "document",
      "uploadedBy": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john_doe_123",
        "firstname": "John",
        "lastname": "Doe"
      },
      "uploadedAt": "2024-01-21T20:00:00.000Z",
      "folder": "research-papers",
      "isPublic": false,
      "downloadCount": 23,
      "lastDownloaded": "2024-01-21T21:30:00.000Z",
      "metadata": {
        "pages": 12,
        "title": "Transformer Architecture Research",
        "author": "John Doe",
        "wordCount": 8947,
        "language": "en"
      },
      "usage": [
        {
          "type": "post",
          "id": "64f1a2b3c4d5e6f7g8h9i0j13",
          "title": "Latest Breakthrough in Transformer Architecture",
          "community": "AI Research Hub"
        }
      ],
      "permissions": {
        "canDownload": true,
        "canDelete": true,
        "canShare": true,
        "canEdit": false
      },
      "virusScan": {
        "status": "clean",
        "scannedAt": "2024-01-21T20:00:00.000Z",
        "scanEngine": "ClamAV"
      }
    }
  }
}
```

### 10.3 Delete File

**Endpoint:** `DELETE /api/files/:fileId`  
**Authentication:** Bearer Token Required  
**Purpose:** Delete an uploaded file

**User Flow:**
1. User views their uploaded files
2. Clicks delete on unwanted file
3. Confirms deletion (warns about usage in posts)
4. File removed from storage and database

**Permissions:** File owner, Community moderators (for community files)
**URL Parameters:** `fileId` (required)

**Request Body:**
```json
{
  "reason": "string (optional, max 200 chars) - Reason for deletion",
  "removeFromPosts": "boolean (optional, default: false) - Also remove from posts",
  "replaceWithPlaceholder": "boolean (optional, default: true) - Replace with placeholder"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "fileId": "64f1a2b3c4d5e6f7g8h9i0j43",
    "filename": "research-paper-1642234567.pdf",
    "deletedAt": "2024-01-21T22:00:00.000Z",
    "usageFound": [
      {
        "type": "post",
        "id": "64f1a2b3c4d5e6f7g8h9i0j13",
        "action": "replaced_with_placeholder"
      }
    ],
    "storageFreed": 2048576,
    "formattedStorageFreed": "2.0 MB"
  }
}
```

---

## 🔒 Error Handling & Status Codes

### Standard HTTP Status Codes

| Status | Code | Description | When to Use |
|--------|------|-------------|-------------|
| ✅ **Success** | 200 | OK | Successful GET, PUT, DELETE requests |
| ✅ **Created** | 201 | Created | Successful POST requests that create resources |
| ✅ **No Content** | 204 | No Content | Successful requests with no response body |
| ❌ **Bad Request** | 400 | Bad Request | Invalid request format or missing required fields |
| ❌ **Unauthorized** | 401 | Unauthorized | Authentication required or invalid token |
| ❌ **Forbidden** | 403 | Forbidden | User lacks permission for this action |
| ❌ **Not Found** | 404 | Not Found | Requested resource doesn't exist |
| ❌ **Conflict** | 409 | Conflict | Resource already exists or constraint violation |
| ❌ **Unprocessable** | 422 | Unprocessable Entity | Valid format but business logic error |
| ❌ **Rate Limited** | 429 | Too Many Requests | Rate limit exceeded |
| ❌ **Server Error** | 500 | Internal Server Error | Unexpected server error |

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific field that caused error",
      "value": "invalid value",
      "constraint": "validation rule that was violated"
    },
    "timestamp": "2024-01-21T22:00:00.000Z",
    "requestId": "req_64f1a2b3c4d5e6f7g8h9i0j46",
    "path": "/api/communities/invalid-id/posts",
    "method": "POST"
  }
}
```

### Common Error Codes

| Error Code | Description | Typical Status | Resolution |
|------------|-------------|----------------|------------|
| `VALIDATION_ERROR` | Request validation failed | 400 | Fix request format/data |
| `UNAUTHORIZED` | Authentication required | 401 | Provide valid JWT token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 | Check user role/permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | 404 | Verify resource ID/path |
| `DUPLICATE_RESOURCE` | Resource already exists | 409 | Use different name/identifier |
| `BUSINESS_RULE_VIOLATION` | Business logic constraint violated | 422 | Adjust request to meet constraints |
| `RATE_LIMIT_EXCEEDED` | Too many requests from client | 429 | Wait before retrying |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 | Contact support |

---

## 🚀 Getting Started for Frontend Team

### 1. Authentication Flow
```javascript
// Login and store token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: 'user@example.com', password: 'password' })
});
const { token } = await loginResponse.json();
localStorage.setItem('authToken', token);

// Use token in subsequent requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};
```

### 2. Error Handling Pattern
```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### 3. Pagination Handling
```javascript
function usePagination(endpoint, limit = 20) {
  const [data, setData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiCall(`${endpoint}?page=${page}&limit=${limit}`);
      setData(prev => page === 1 ? response.data.items : [...prev, ...response.data.items]);
      setHasMore(response.data.pagination.hasMore);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, hasMore, loading, loadMore };
}
```

### 4. Real-time Updates
```javascript
// WebSocket connection for real-time notifications
const ws = new WebSocket(`wss://api.example.com/ws?token=${authToken}`);
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Update UI with new notification
  updateNotificationCount(notification);
};
```

### 5. File Upload with Progress
```javascript
async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    xhr.send(formData);
  });
}
```

---

## 📝 API Testing Checklist

### Authentication Testing
- [ ] Valid login credentials
- [ ] Invalid login credentials  
- [ ] Expired token handling
- [ ] Token refresh flow
- [ ] Logout functionality

### Community Management Testing
- [ ] Create community with all settings
- [ ] Update community settings
- [ ] Join/leave community flows
- [ ] Role management (promote/demote)
- [ ] Member removal

### Content Management Testing
- [ ] Create text posts
- [ ] Create polls with various options
- [ ] Create events with registration
- [ ] Edit/delete posts
- [ ] Content moderation

### User Interactions Testing
- [ ] Like/unlike posts
- [ ] Comment and reply
- [ ] Vote on polls
- [ ] RSVP to events
- [ ] Save/bookmark posts

### File Upload Testing
- [ ] Image uploads (various formats)
- [ ] Document uploads
- [ ] File size limits
- [ ] Security scanning
- [ ] File deletion

### Error Handling Testing
- [ ] Invalid API endpoints
- [ ] Malformed request bodies
- [ ] Missing authentication
- [ ] Insufficient permissions
- [ ] Rate limiting

This comprehensive API documentation serves as the **complete reference for your frontend team**. Each endpoint includes detailed user flows, validation rules, and sample requests/responses to ensure smooth integration and development.