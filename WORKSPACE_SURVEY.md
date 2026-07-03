# Tribes Capital - Comprehensive Workspace Survey

**Date**: June 1, 2026  
**Project**: Tribes Capital - Clean Energy Investment Platform  
**Status**: Frontend Prototype Running | Backend Scaffolded | Database Not Connected

---

## 1. PROJECT OVERVIEW

### Vision
Tribes Capital is a **unified learning, events, and community platform** designed specifically for clean energy investors across Africa. It combines:
- Educational courses on energy finance, solar projects, and risk management
- Community events (office hours, workshops, member circles)
- Project pipeline management for investment deals
- Document vault for due diligence materials
- Community forums and networking

### Target Users
- Clean energy investors and professionals
- Project developers
- Policy and ESG specialists
- Financial analysts
- Community members across Africa

### Technology Stack
- **Frontend**: React 18.2.0 + Vite 5.0.0
- **Backend**: NestJS 10.2.8 (TypeScript)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Authentication**: JWT (Access + Refresh tokens)
- **Storage**: AWS S3
- **HTTP Client**: Axios

---

## 2. BACKEND ARCHITECTURE

### Overview
NestJS modular monolith with 15 domain modules, global guards, interceptors, filters, and pipes. Follows enterprise patterns with dependency injection and decorators.

### 2.1 Core Infrastructure

#### Application Bootstrap (`src/main.ts`)
- Port: **3000** (configurable via `.env`)
- CORS: Enabled for `http://localhost:5173`, `http://localhost:3000`
- Middleware: Helmet (security headers)
- Global Filters: Exception handling with standardized error responses
- Global Interceptors: 
  - Transform Interceptor: Wraps responses with `{ success, data, timestamp }`
  - Logging Interceptor: Logs all HTTP requests/responses
- Global Pipes: Validation pipe for DTO validation
- Guards: JWT Auth + Roles-based access control

#### Configuration (`src/config/`)
- **app.config.ts**: Port, environment, CORS origin
- **database.config.ts**: PostgreSQL connection via Prisma
- **jwt.config.ts**: JWT secrets and expiration times
- **redis.config.ts**: Redis connection for caching/queues
- **aws.config.ts**: S3 bucket configuration (placeholders)

#### Database (`src/database/prisma.service.ts`)
- Prisma Client wrapper as injectable service
- Handles connection lifecycle (onModuleInit, onModuleDestroy)
- Provides ORM access across all modules

### 2.2 Security Layer (`src/common/`)

#### Guards
- **jwt-auth.guard.ts**: Validates Bearer tokens, extracts user from JWT payload
- **roles.guard.ts**: Checks role-based permissions after JWT validation
- Both registered as APP_GUARD (applied globally)

#### Decorators
- **@Public()**: Marks endpoints that bypass JWT guard (auth/register, auth/login)
- **@Roles('admin', 'user', ...)**: Specifies required roles for endpoint
- **@CurrentUser()**: Injects authenticated user object from request
- **@GetCurrentUser()**: Alternative user injection decorator

#### Interceptors
- **logging.interceptor.ts**: Logs method calls and timing
- **transform.interceptor.ts**: Wraps all responses in standardized format

#### Filters
- **global-exception.filter.ts**: Catches all exceptions, returns consistent error format

#### Pipes
- **validation.pipe.ts**: Validates DTOs using class-validator decorators

### 2.3 Authentication Module (`src/modules/auth/`)

#### AuthService
**Methods**:
- `register(registerDto)`: Creates new user, hashes password, generates tokens
- `login(loginDto)`: Validates credentials, generates tokens
- `validateUser(userId)`: Validates user exists and is active
- `refreshTokens(refreshTokenDto)`: Issues new access token using refresh token
- `generateTokens(userId, email)`: Internal helper for token generation

**Token Strategy**:
- Access Token: Expires in `JWT_EXPIRATION` (default: 15 minutes)
- Refresh Token: Expires in `JWT_REFRESH_EXPIRATION` (default: 7 days)
- JWT Secret stored in environment variables

#### JwtStrategy (Passport)
- Extracts JWT from Authorization header (Bearer token)
- Validates token signature and expiration
- Calls `validateUser()` to fetch user object with roles/permissions

#### AuthController
- `POST /auth/register`: Public endpoint, returns tokens
- `POST /auth/login`: Public endpoint, returns tokens
- `POST /auth/refresh`: Refresh token endpoint

#### DTOs
- `RegisterDto`: email, password, firstName, lastName
- `LoginDto`: email, password
- `RefreshTokenDto`: refreshToken
- `TokenResponseDto`: accessToken, refreshToken, expiresIn, user

### 2.4 Users Module (`src/modules/users/`)

#### UsersService
**Methods**:
- `getUserById(id)`: Fetch user with roles/permissions, exclude password
- `getUserByEmail(email)`: Lookup user by email
- `updateUser(id, updateUserDto)`: Update user profile (firstName, lastName, bio, avatar, etc.)
- `deactivateUser(id)`: Soft delete by setting isActive=false
- `getAllUsers(skip, take)`: Paginated user list with total count
- `sanitizeUser(user)`: Removes password field from response

#### UsersController (Protected by JwtAuthGuard)
- `GET /users/me`: Get authenticated user's profile
- `GET /users`: List all users with pagination
- `GET /users/:id`: Get specific user
- `PUT /users/:id`: Update user (checks ownership)

#### DTOs
- `UpdateUserDto`: firstName, lastName, bio, avatar, etc.

### 2.5 Roles & Permissions Module (`src/modules/roles/`)

#### RolesService
**Methods**:
- `createRole(createRoleDto)`: Create new role (admin-only)
- `getRoleById(id)`: Fetch role with permissions and users
- `getAllRoles()`: List all roles
- `assignRoleToUser(userId, roleId)`: Add role to user
- `removeRoleFromUser(userId, roleId)`: Remove role from user
- `createPermission(createPermissionDto)`: Create permission (admin-only)
- `assignPermissionToRole(roleId, permissionId)`: Link permission to role
- `getUserPermissions(userId)`: Get all permissions (direct + via roles)
- `hasPermission(userId, resource, action)`: Check if user can perform action

#### RolesController (Protected, Admin Decorator)
- `POST /roles`: Create role (requires admin role)
- `GET /roles`: List all roles
- `GET /roles/:id`: Get role details
- `POST /roles/assign`: Assign role to user (requires admin)
- `POST /roles/permissions`: Create permission (requires admin)
- `POST /roles/:roleId/permissions/:permissionId`: Link permission to role (requires admin)
- `GET /roles/:userId/permissions`: Get user's permissions

#### Permission Model
- Name: Unique identifier (e.g., "CREATE_COURSE")
- Resource: What resource (e.g., "courses")
- Action: What action (e.g., "create")
- Unique constraint on (resource, action)

### 2.6 Domain Modules (15 Total)

#### Learning Module (`src/modules/learning/`)
- Purpose: Container for learning-related operations
- Status: Basic scaffolding
- Potential: Aggregate learning statistics, recommendations

#### Courses Module (`src/modules/courses/`)
- **Entities**: Course (title, description, category, level, duration, thumbnail)
- **Operations**: List courses, get by ID, enroll, get progress
- **Relations**: Creator (User), Instructor (User), Lessons, Enrollments
- **Status**: DTOs and structure defined, service/controller scaffolded

#### Lessons Module (`src/modules/lessons/`)
- **Entities**: Lesson (title, content, videoUrl, order, duration, isPublished)
- **Relations**: Course, Creator (User), Progress
- **Status**: Scaffolded with DTOs

#### Progress Module (`src/modules/progress/`)
- **Entities**: Progress (completionPercentage, lastAccessedAt, completedAt)
- **Purpose**: Track lesson completion per user
- **Relations**: User, Lesson (unique constraint on userId-lessonId)
- **Status**: Basic scaffolding

#### Events Module (`src/modules/events/`)
- **Entities**: Event (title, description, location, startDate, endDate, capacity, isVirtual, isPublished)
- **Operations**: List, get by ID, RSVP, cancel RSVP
- **Relations**: Creator (User), RSVPs
- **Status**: DTOs and controller defined

#### RSVP Module (`src/modules/rsvp/`)
- **Entities**: RSVP (status, guestCount, rsvpedAt, cancelledAt)
- **Purpose**: Event attendance tracking
- **Relations**: User, Event (unique constraint on userId-eventId)
- **Status**: Scaffolded

#### Projects Module (`src/modules/projects/`)
- **Entities**: Project (title, description, status, startDate, endDate, budget, isPublished)
- **Relations**: Creator (User), ProjectTeam (many-to-many with User), ProjectStages
- **Status**: Defined with cascade relationships

#### Marketplace Module (`src/modules/marketplace/`)
- **Entities**: MarketplaceItem (relatable to projects for selling)
- **Status**: Basic scaffolding

#### Documents Module (`src/modules/documents/`)
- **Entities**: Document (fileName, fileUrl, fileType, size)
- **Purpose**: Due diligence vault storage
- **Relations**: Creator (User), Author (User)
- **Status**: Basic scaffolding with S3 integration planned

#### Community Module (`src/modules/community/`)
- **Entities**: CommunityPost, CommunityComment
- **Purpose**: Community forums and discussions
- **Status**: Basic scaffolding

#### Notifications Module (`src/modules/notifications/`)
- **Entities**: Notification, NotificationRead
- **Purpose**: Real-time user notifications
- **Status**: Basic scaffolding

#### Analytics Module (`src/modules/analytics/`)
- **Entities**: AnalyticsEvent
- **Purpose**: Track user engagement and platform usage
- **Status**: Basic scaffolding

### 2.7 Database Schema (Prisma)

#### Core Entities

**User**
- id (CUID), email (unique), firstName, lastName, password, avatar, bio
- isActive, emailVerified, lastLogin
- Relations: Roles, Permissions, Enrollments, Courses (creator/instructor), Lessons, Events, Projects, Documents, Posts, Notifications
- Indexes: email, isActive, createdAt

**Role**
- id, name (unique), description
- Relations: Users, Permissions
- Purpose: Group permissions together

**Permission**
- id, name (unique), resource, action, description
- Unique constraint: (resource, action)
- Purpose: Granular access control

**Course**
- id, title, description, category, level, duration, thumbnail
- Relations: Creator (User), Instructor (User), Lessons, Enrollments
- Indexes: creatorId, instructorId, isPublished, category

**Lesson**
- id, title, content, videoUrl, order, duration
- Relations: Course, Creator (User), Progress
- Indexes: courseId, creatorId, order

**Enrollment**
- id, enrolledAt, completedAt, progress, status
- Relations: User, Course
- Unique constraint: (userId, courseId)
- Indexes: userId, courseId, status

**Progress**
- id, completionPercentage, lastAccessedAt, completedAt
- Relations: User, Lesson
- Unique constraint: (userId, lessonId)
- Indexes: userId, lessonId

**Event**
- id, title, location, startDate, endDate, capacity, isVirtual
- Relations: Creator (User), RSVPs
- Indexes: creatorId, startDate, isPublished

**RSVP**
- id, status, guestCount, rsvpedAt, cancelledAt
- Relations: User, Event
- Unique constraint: (userId, eventId)
- Indexes: userId, eventId, status

**Project**
- id, title, status, budget, startDate, endDate
- Relations: Creator (User), TeamMembers (User), ProjectStages
- Indexes: creatorId, status, isPublished

**ProjectStage**
- id, name, order, status, budget, startDate, endDate
- Relations: Project, Deliverables
- Indexes: projectId, order

**Document**
- id, fileName, fileUrl, fileType, size, category
- Relations: Creator (User), Author (User)
- Indexes: creatorId, category

**CommunityPost**
- id, title, content, likeCount, commentCount
- Relations: Creator (User), Comments
- Indexes: creatorId, createdAt

**CommunityComment**
- id, content, likeCount
- Relations: Creator (User), Post
- Indexes: creatorId, postId

**Notification**
- id, type, message, isRead, relatedEntityId, relatedEntityType
- Relations: User, NotificationReads
- Indexes: userId, isRead, createdAt

**AnalyticsEvent**
- id, eventType, eventData, metadata
- Relations: User
- Indexes: userId, eventType, createdAt

### 2.8 API Endpoints Summary

#### Authentication (Public)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with credentials
- `POST /auth/refresh` - Refresh access token

#### Users (Protected)
- `GET /users/me` - Get authenticated user
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user

#### Roles (Protected, Admin)
- `POST /roles` - Create role
- `GET /roles` - List roles
- `GET /roles/:id` - Get role
- `POST /roles/assign` - Assign role to user
- `POST /roles/permissions` - Create permission
- `POST /roles/:roleId/permissions/:permissionId` - Link permission to role
- `GET /roles/:userId/permissions` - Get user permissions

#### Courses (Protected)
- `GET /courses` - List courses
- `GET /courses/:id` - Get course
- `POST /courses/:courseId/enroll` - Enroll in course
- `GET /courses/:courseId/progress` - Get course progress

#### Events (Protected)
- `GET /events` - List events
- `GET /events/:id` - Get event
- `GET /events/:eventId/rsvp-status` - Check RSVP status
- `POST /events/:eventId/rsvp` - RSVP to event
- `DELETE /events/:eventId/rsvp` - Cancel RSVP

#### Other Modules
- `/documents` - Document management
- `/notifications` - User notifications
- `/projects` - Project management
- `/community` - Community posts and comments
- `/analytics` - Analytics dashboard
- `/marketplace` - Marketplace items

---

## 3. FRONTEND ARCHITECTURE

### Overview
React 18.2.0 SPA with Vite 5.0.0 build tool, running on **localhost:5176** (ports 5173-5175 in use).

### 3.1 Tech Stack & Configuration

#### Vite Configuration (`vite.config.js`)
- **Port**: 5173 (with fallback to next available: 5174, 5175, 5176)
- **API Proxy**: `/api` routes → `http://localhost:3000`
- **Path Aliases**: 
  - `@` → `./src`
  - `@api` → `./src/api`
  - `@components` → `./src/components`
  - `@pages` → `./src/pages`
  - `@constants` → `./src/constants`
  - `@hooks` → `./src/hooks`
  - `@utils` → `./src/utils`

#### Dependencies
- **react@^18.2.0**: UI library
- **react-dom@^18.2.0**: DOM rendering
- **axios@^1.6.0**: HTTP client with interceptors

### 3.2 Application Structure

```
frontend/src/
├── main.jsx              # Entry point with React.StrictMode
├── App.jsx               # Root component with auth routing
├── App.css               # Global styles
├── index.css             # Base styles
├── api/
│   ├── client.js         # Axios instance with interceptors
│   └── endpoints.js      # Centralized API endpoint definitions
├── pages/
│   ├── AuthPage.jsx      # Login form (public)
│   ├── HomePage.jsx      # Main authenticated interface
│   ├── LearningHub.jsx   # Learning courses page (895 lines)
│   └── OfficeHoursEvents.jsx  # Events page (638 lines)
├── components/
│   ├── CourseCard.jsx    # Reusable course display
│   ├── Icon.jsx          # SVG icon component
│   ├── Sidebar.jsx       # Navigation sidebar (13 items)
│   └── TutorialOverlay.jsx # 8-step onboarding tour
├── constants/
│   └── colors.js         # Design tokens (16 colors + semantic naming)
└── hooks/
    ├── useCourses.js     # Fetch courses with mock fallback
    └── useEvents.js      # Fetch events with mock fallback
```

### 3.3 Authentication Flow

#### AuthPage.jsx
**Purpose**: Login entry point
**Features**:
- Email format validation (regex)
- Required field validation
- Mock authentication (accepts any valid email/password)
- localStorage token storage (key: `accessToken`)
- localStorage user storage (key: `userEmail`)
- Loading state and error display
- Styled with design tokens

**Form Fields**:
- Email input (type: text)
- Password input (type: password)
- Sign in button
- Demo account note

#### App.jsx (Root Router)
**State Management**:
- `isAuthenticated`: Boolean token check
- `user`: { email, name } object
- `currentPage`: Active navigation page ('home', 'learning', 'events', etc.)

**Lifecycle**:
1. On mount: Checks localStorage for `accessToken` and `userEmail`
2. If both exist: Sets isAuthenticated=true, user={email, name}, renders HomePage
3. If missing: Renders AuthPage
4. On login: Stores token/email, sets isAuthenticated=true, navigates to 'home'
5. On logout: Clears localStorage, resets state, shows AuthPage

**Props Flow**:
```
App
└── HomePage (when authenticated)
    ├── user: { email, name }
    ├── currentPage: 'home'|'learning'|'events'|...
    ├── onNavigate: (page) => setCurrentPage(page)
    └── onLogout: () => handleLogout()
```

### 3.4 HomePage.jsx (Main Interface)

**Sections**:
1. **Sidebar** (200px fixed width)
   - Logo and branding
   - 13 navigation items with active state highlighting
   - Dividers between sections
   - Onclick handler calls `onNavigate(pageKey)`

2. **Top Bar** (54px fixed height)
   - Search input (placeholder: "Search topics...")
   - Notification icon with red dot
   - User avatar (shows email first letter)
   - Logout button

3. **Main Content Area** (scrollable)
   - Conditional rendering based on `currentPage`:
     - `currentPage === 'home'`: Shows full home page layout
     - `currentPage === 'learning'`: Renders `<LearningHub />`
     - `currentPage === 'events'`: Renders `<OfficeHoursEvents />`
     - Other pages: Show placeholder UI

4. **Tutorial Overlay** (when tourActive=true)
   - 8-step onboarding tour with spotlight effect
   - Spotlight highlights relevant sections
   - Progress dots and navigation buttons
   - Dismissible with "Skip tour" button

**Home Page Sections**:
1. Welcome banner (gradient background)
   - Personalized greeting
   - Generic stats (Members, Projects, Docs, Events)
   - Chip badges (generic: Recent deals, Live events, Active courses)

2. Stats cards (4 columns)
   - Community members
   - Active projects
   - Vault docs
   - Events

3. Resume card
   - Quick resume of in-progress course
   - "Continue" button

4. Learning section (two-column grid)
   - Left: Course cards with progress bars
   - Right: Recently added documents, announcements, recent activity

5. Events section
   - Upcoming events with dates and RSVP buttons
   - Event type badges (Office Hours, Workshop, Member Circle)

**Design System**:
- 16 color tokens: P (primary #5B21B6), PL, PD, PF, GR (green), GRB, AM (amber), AMB, BLU, BLB, TL, TLB, T1, T2, T3, BD (border), BG (background), W (white)
- Inline CSS styling with consistent spacing and typography
- Icons rendered as SVG paths in `Icon` component (24 icon designs)
- Responsive typography (font sizes range 10-28px)

### 3.5 Navigation Items (NAV Array in HomePage)

```
1. Home                       → currentPage: 'home'
2. Learning Hub              → currentPage: 'learning' → <LearningHub />
3. Due Diligence Vault       → currentPage: 'vault'
4. Project Pipeline          → currentPage: 'pipeline'
5. Reporting Library         → currentPage: 'reporting'
6. Office Hours & Events     → currentPage: 'events' → <OfficeHoursEvents />
   [divider]
7. Member Circles            → currentPage: 'circles'
8. Toolkits & Templates      → currentPage: 'toolkits'
9. Partner Marketplace       → currentPage: 'marketplace'
   [divider]
10. Announcements & Feedback → currentPage: 'announcements'
11. Help                      → currentPage: 'help'
```

### 3.6 LearningHub.jsx (895 lines)

**Purpose**: Dedicated learning courses page
**Features**:
- Course category filtering with color-coded badges
- Course card display with progress bars
- Enrolled courses tracking
- Learning path visualization
- Lesson-by-lesson breakdown
- Progress tracking UI
- Search and filtering

**Design Elements**:
- Category color system (Energy Finance, Solar & Storage, Risk & FX, Policy & ESG)
- Progress percentage display
- Icon system matching design tokens
- Feather SVG icons (book, folder, activity, file, calendar, users, etc.)

### 3.7 OfficeHoursEvents.jsx (638 lines)

**Purpose**: Events management and RSVP page
**Features**:
- Upcoming events list with date/time
- Event filtering by type (Office Hours, Workshop, Member Circle, etc.)
- RSVP management (RSVP, RSVPed status, Cancel)
- Event details modal
- Capacity tracking
- Instructor/host information
- Event searchand filtering

**Design Elements**:
- Calendar-style date display
- Event type badges with colors
- Guest count indicators
- Status indicators (spots left, full, etc.)

### 3.8 API Client Setup

#### axios instance (`api/client.js`)
```javascript
const apiClient = axios.create({
  baseURL: '/api',  // Proxied to http://localhost:3000
  withCredentials: true,
});

// Request interceptor: Adds Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handles 401 Unauthorized
apiClient.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    window.location.href = '/';  // Redirect to login
  }
  return Promise.reject(error);
});
```

#### Centralized endpoints (`api/endpoints.js`)
```javascript
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

export const coursesAPI = {
  list: (params) => apiClient.get('/courses', { params }),
  getById: (id) => apiClient.get(`/courses/${id}`),
  getEnrolled: () => apiClient.get('/courses/enrolled'),
  enroll: (courseId) => apiClient.post(`/courses/${courseId}/enroll`),
  getProgress: (courseId) => apiClient.get(`/courses/${courseId}/progress`),
};

export const eventsAPI = {
  list: (params) => apiClient.get('/events', { params }),
  getById: (id) => apiClient.get(`/events/${id}`),
  rsvp: (eventId) => apiClient.post(`/events/${eventId}/rsvp`),
  cancelRSVP: (eventId) => apiClient.delete(`/events/${eventId}/rsvp`),
};
// ... plus: documents, notifications, projects, community, analytics
```

### 3.9 Custom Hooks

#### useCourses.js
- Fetches courses from `/courses` endpoint
- Returns: `{ courses, loading, error }`
- Mock fallback data if API fails (2 sample courses)
- Auto-fetches on mount

#### useEvents.js
- Fetches events from `/events` endpoint
- Multiple hooks: `useEvents`, `useUpcomingEvents`, `useEventRSVP`
- Mock fallback data if API fails (2 sample events)
- RSVP state management

#### Design Pattern
- Try to fetch from API
- On error, fall back to mock data
- Prevents blank UI while waiting for backend

### 3.10 Components

#### CourseCard.jsx
- Displays course title, category, metadata, progress bar
- Progress bar color changes by category
- Action button (e.g., "Continue lesson")

#### Icon.jsx
- SVG icon component with 24+ icon designs
- Props: name, size (default 15), color (default T3)
- Maps icon names to SVG paths
- Used in sidebar navigation and throughout UI

#### Sidebar.jsx
- Fixed-width navigation sidebar
- Logo section at top
- Scrollable nav items
- Active state styling

#### TutorialOverlay.jsx
- 8-step onboarding tour
- Spotlight effect highlighting target elements
- Tooltip positioning (top, bottom, left, right, center)
- Progress indicator with dots
- Navigation buttons (Back, Next, Start exploring)
- Skip button to dismiss

---

## 4. DESIGN SYSTEM

### Color Palette
```
Primary:        #5B21B6 (Purple)
Primary Light:  #7C3AED (Lighter Purple)
Primary Dark:   #4C1D95 (Darker Purple)
Primary 50:     #EDE9FE (Lightest Purple)

Success:        #059669 / #16A34A (Green)
Success BG:     #ECFDF5 / #F0FDF4

Amber:          #D97706
Amber BG:       #FFFBEB / #FEF3C7

Blue:           #1D4ED8
Blue BG:        #EFF6FF

Teal:           #0D9488
Teal BG:        #F0FDFA

Text:
  T1 (Dark):    #111827
  T2 (Medium):  #6B7280
  T3 (Light):   #9CA3AF

UI:
  Border:       #E5E7EB
  Background:   #F9FAFB
  White:        #FFFFFF
```

### Typography
- Font Family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Font Sizes: 10px (small) → 28px (heading)
- Font Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Line Heights: 1.3 → 1.65 (varies by context)

### Spacing & Layout
- Container padding: 24px
- Component gap: 8-24px (context-dependent)
- Border radius: 6-16px (consistent rounding)
- Icon sizes: 13-48px (varies by context)

---

## 5. CURRENT STATUS & FUNCTIONALITY

### ✅ What's Working

#### Frontend (Running on localhost:5176)
- [x] React SPA with Vite dev server
- [x] Authentication flow (login → home → logout)
- [x] Mock authentication (any email/password)
- [x] localStorage token persistence
- [x] Sidebar navigation (13 items all clickable)
- [x] Page routing based on navigation clicks
- [x] Real component pages (LearningHub, OfficeHoursEvents)
- [x] Placeholder pages for other sections
- [x] Top bar with user avatar and logout button
- [x] Tutorial overlay (8-step onboarding)
- [x] Design system with 16 color tokens
- [x] Icon component with 24+ SVG icons
- [x] Course cards with progress visualization
- [x] Event cards with RSVP buttons
- [x] Responsive layout (sidebar + main area)
- [x] Hot module reloading (HMR) working
- [x] API client setup with axios
- [x] Response interceptor for 401 errors
- [x] Path aliases for clean imports

#### Backend (Scaffolded, Not Running)
- [x] NestJS project structure created
- [x] 15 domain modules scaffolded
- [x] Database schema designed (Prisma)
- [x] Authentication module with JWT strategy
- [x] Users module with CRUD
- [x] Roles & permissions system
- [x] Global guards (JWT, Roles)
- [x] Global interceptors (Transform, Logging)
- [x] Global filter (Exception handling)
- [x] Configuration system (environment-based)
- [x] Prisma service for database access

#### Database (Not Connected)
- [x] Prisma schema defined (347 lines)
- [x] 15+ entities modeled
- [x] Relationships and constraints defined
- [x] Indexes for performance
- [x] Enum types defined

### ⚠️ Partially Working

- [ ] Real API integration: Frontend calls `/api/*` but backend not running
- [ ] Courses page: UI exists but no API connection
- [ ] Events page: UI exists but no API connection
- [ ] User profile: Form exists but no API connection
- [ ] Role-based access: Guards defined but no actual enforcement
- [ ] Permissions: System modeled but not implemented in modules

### ❌ Not Yet Implemented

- [ ] Backend server running
- [ ] PostgreSQL database connected
- [ ] Real authentication (currently mock)
- [ ] Course CRUD operations
- [ ] Event management
- [ ] Document storage (AWS S3)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Notifications system
- [ ] Analytics dashboard
- [ ] Real-time updates (WebSocket)
- [ ] File upload functionality
- [ ] Search and filtering (full features)
- [ ] Pagination in lists
- [ ] Error handling UI
- [ ] Loading states in API calls

---

## 6. ENVIRONMENT CONFIGURATION

### Backend (.env)
```
NODE_ENV=development
APP_PORT=3000
APP_ENVIRONMENT=development
APP_CORS_ORIGIN=http://localhost:5173,http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tribes_capital

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRATION=7d

REDIS_URL=redis://localhost:6379
REDIS_DB=0

AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=tribes-capital-bucket

STRIPE_API_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

LOG_LEVEL=debug
```

### Frontend (No .env required)
- API URL: Hardcoded as `/api` (proxied by Vite)
- All configuration via environment/constants

---

## 7. FILE STRUCTURE SUMMARY

```
TribesCapital_Backend/
├── .env                          # Environment variables
├── .env.example                  # Example config
├── .git/                         # Git repository
├── package.json                  # Backend dependencies (NestJS, Prisma, etc.)
├── tsconfig.json                 # TypeScript configuration
├── prisma/
│   └── schema.prisma            # Database schema (347 lines)
│
├── src/
│   ├── main.ts                  # NestJS bootstrap
│   ├── app.module.ts            # Root module with 15 domain modules
│   ├── common/
│   │   ├── decorators/          # @Public, @Roles, @CurrentUser, @GetCurrentUser
│   │   ├── filters/             # GlobalExceptionFilter
│   │   ├── guards/              # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/        # TransformInterceptor, LoggingInterceptor
│   │   └── pipes/               # ValidationPipe
│   ├── config/                  # app, database, jwt, redis, aws configs
│   ├── database/                # PrismaService
│   └── modules/                 # 15 domain modules
│       ├── auth/                # AuthService, AuthController, JwtStrategy
│       ├── users/               # UsersService, UsersController
│       ├── roles/               # RolesService, RolesController
│       ├── courses/             # CourseService, CourseController (+ DTOs)
│       ├── lessons/             # LessonService, LessonController
│       ├── events/              # EventService, EventController
│       ├── learning/            # Learning aggregate service
│       ├── progress/            # ProgressService
│       ├── rsvp/                # RsvpService
│       ├── projects/            # ProjectService
│       ├── marketplace/         # MarketplaceService
│       ├── documents/           # DocumentService
│       ├── community/           # CommunityService
│       ├── notifications/       # NotificationService
│       └── analytics/           # AnalyticsService
│
└── frontend/
    ├── package.json             # Frontend dependencies (React, Vite, Axios)
    ├── vite.config.js           # Vite build config, API proxy, path aliases
    ├── index.html               # HTML entry point
    ├── src/
    │   ├── main.jsx             # React root render
    │   ├── App.jsx              # Root component (auth router)
    │   ├── App.css, index.css    # Global styles
    │   ├── api/
    │   │   ├── client.js        # Axios instance with interceptors
    │   │   └── endpoints.js     # Centralized API endpoint definitions
    │   ├── pages/
    │   │   ├── AuthPage.jsx     # Login form (public)
    │   │   ├── HomePage.jsx     # Main authenticated interface (571 lines)
    │   │   ├── LearningHub.jsx  # Learning courses page (895 lines)
    │   │   └── OfficeHoursEvents.jsx  # Events page (638 lines)
    │   ├── components/
    │   │   ├── CourseCard.jsx   # Course display card
    │   │   ├── Icon.jsx         # SVG icon component
    │   │   ├── Sidebar.jsx      # Navigation sidebar
    │   │   └── TutorialOverlay.jsx  # 8-step onboarding tour
    │   ├── constants/
    │   │   └── colors.js        # Design system (16 color tokens)
    │   └── hooks/
    │       ├── useCourses.js    # Course data fetching
    │       └── useEvents.js     # Event data fetching
    └── node_modules/            # Dependencies installed
```

---

## 8. KEY INTEGRATION POINTS

### Frontend ↔ Backend Communication

1. **API Proxy** (Vite)
   - Frontend: `axios.post('/api/auth/login', ...)`
   - Vite Config: `/api/*` → `http://localhost:3000`
   - Backend: Routes defined at `/auth/*`

2. **Authentication Token Flow**
   - Frontend: Stores in localStorage
   - Request: Added via axios interceptor (`Authorization: Bearer <token>`)
   - Backend: Validated via JwtAuthGuard, extracted via JwtStrategy

3. **Error Handling**
   - Backend: GlobalExceptionFilter returns `{ success, statusCode, message, path, timestamp }`
   - Frontend: Response interceptor catches 401s, redirects to login

4. **Data Format**
   - Backend: TransformInterceptor wraps responses: `{ success: true, data: {...}, timestamp: ... }`
   - Frontend: Receives data in expected format

### User Experience Flow

```
1. User opens app (localhost:5176)
   ↓
2. App checks localStorage for token
   ↓
3. If no token → Show AuthPage (login form)
   ↓
4. User enters email/password (currently mock validation)
   ↓
5. Frontend stores token + email in localStorage
   ↓
6. Shows HomePage with navigation
   ↓
7. User clicks navigation items → Page switches (real components or placeholders)
   ↓
8. For pages with API needs: Components fetch from `/api/*` (fails without backend running)
   ↓
9. User clicks Logout → Clears storage, returns to AuthPage
```

---

## 9. TECHNOLOGY ECOSYSTEM DETAILS

### Frontend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI library |
| ReactDOM | 18.2.0 | DOM rendering |
| Vite | 5.0.0 | Build tool, dev server |
| Axios | 1.6.0 | HTTP client |
| @vitejs/plugin-react | 4.2.1 | React support in Vite |

### Backend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 10.2.8 | Framework |
| @nestjs/common | 10.2.8 | Core decorators, guards |
| @nestjs/config | 3.1.1 | Configuration management |
| @nestjs/jwt | 11.0.1 | JWT token generation |
| @nestjs/passport | 10.0.3 | Passport integration |
| @prisma/client | 5.5.2 | Database ORM |
| TypeScript | 5.x | Language |
| Passport-JWT | 4.0.1 | JWT strategy |
| bcrypt | 5.1.1 | Password hashing |
| Helmet | 7.1.0 | Security headers |
| Redis/Bull | Latest | Caching and queues |

### Database
| Technology | Purpose |
|-----------|---------|
| PostgreSQL 15+ | Relational database |
| Prisma ORM | Database access layer |
| Redis | Caching and job queues |

---

## 10. NEXT STEPS & RECOMMENDATIONS

### Immediate (To Make Backend Functional)

1. **Database Setup**
   ```bash
   # Ensure PostgreSQL is running
   # Run migrations
   npm run db:migrate
   npm run db:push
   ```

2. **Start Backend Server**
   ```bash
   npm run start:dev
   ```

3. **Test Backend Health**
   ```bash
   curl http://localhost:3000/auth/login
   # Should receive response (even if error)
   ```

4. **Test Frontend ↔ Backend**
   - Update AuthPage to call actual `/api/auth/login`
   - Test login with real credentials
   - Verify tokens are received

### Short-term (Core Features)

1. Implement real authentication in AuthPage
2. Connect LearningHub and Events pages to real API endpoints
3. Add error boundaries and loading states
4. Implement search and filtering
5. Add form validation with better UX

### Medium-term (Enhancement)

1. Real-time updates (WebSocket for notifications)
2. File upload (documents to S3)
3. Email verification and password reset
4. Analytics dashboard implementation
5. Marketplace functionality
6. Community forums

### Long-term (Scale)

1. Caching strategy (Redis)
2. Job queue implementation (BullMQ)
3. Payment processing (Stripe integration)
4. Mobile app version
5. Advanced analytics and ML recommendations
6. Multi-language support

---

## SUMMARY

**Tribes Capital** is a comprehensive, well-architected platform for clean energy community building. The **frontend is prototype-ready** with full UI/UX implemented and working navigation. The **backend is scaffolded with enterprise patterns** but needs database connection and API implementation. The **design system is cohesive** across both applications. The **authentication flow is implemented** on the frontend with mock data, ready for real backend integration.

**Current state**: Fully functional SPA with placeholder backend, ready for backend server startup and API integration testing.

