# STEMM Lab: Production Implementation Guide

## Project Overview

STEMM Lab is a sensor-driven mobile science lab application designed to run on iOS and Android via Expo Go. The codebase is strictly organized into two independent top-level directories: `/backend` (business logic, controllers, and services) and `/frontend` (Expo Router screens, UI components).

---

## Directory Structure

```
StemmLab/
├── backend/
│   ├── config/
│   │   ├── firebase.ts              # Firebase Auth & Firestore initialization
│   │   └── constants.ts             # App-wide constants (collection names, challenge count)
│   ├── models/
│   │   ├── User.ts                  # UserProfile interface
│   │   ├── Group.ts                 # GroupDocument interface
│   │   └── Leaderboard.ts           # LeaderboardEntry interface
│   ├── controllers/
│   │   ├── authController.ts        # registerUser(), loginUser(), getUserProfile()
│   │   ├── groupController.ts       # createGroup(), joinGroup()
│   │   └── leaderboardController.ts # fetchLeaderboardEntries()
│   ├── services/
│   │   ├── motionLabService.ts      # Accelerometer + Gyroscope polling
│   │   ├── reactionBoardService.ts  # 3-stage reaction challenge engine
│   │   ├── breathingTrainerService.ts # Chest wall motion tracking (3 phases)
│   │   └── sqliteService.ts         # Offline sync queue management
│   ├── tasks/
│   │   └── syncTaskManager.ts       # Background fetch lifecycle + location tagging
│   └── utils/
│       └── sensorThrottler.ts       # Hardware polling frequency control
├── frontend/
│   ├── app/
│   │   ├── _layout.tsx              # Root navigator (Expo Router)
│   │   ├── index.tsx                # Landing page (Login/Signup entry point)
│   │   ├── (auth)/
│   │   │   ├── login.tsx            # Sign-in form
│   │   │   └── signup.tsx           # Registration form
│   │   ├── (tabs)/
│   │   │   ├── dashboard.tsx        # Main dashboard overview
│   │   │   ├── activities.tsx       # Activity list (7 challenges)
│   │   │   └── leaderboard.tsx      # Group rankings with podium
│   │   └── activity/
│   │       ├── index.tsx            # Activity directory
│   │       ├── human-performance.tsx # FULLY FUNCTIONAL
│   │       ├── reaction-board.tsx    # FULLY FUNCTIONAL
│   │       ├── breathing-trainer.tsx # FULLY FUNCTIONAL
│   │       ├── parachute-drop.tsx    # Template skeleton
│   │       ├── sound-pollution.tsx   # Template skeleton
│   │       ├── hand-fan.tsx          # Template skeleton
│   │       └── earthquake-structure.tsx # Template skeleton
│   ├── components/
│   │   ├── app-tabs.tsx             # Bottom tab navigation
│   │   └── (existing themed components)
│   └── constants/
│       └── theme.ts                 # Color scheme + spacing constants
└── firestore.rules                  # Production security rules (grade-level authorization)
```

---

## Backend Implementation Details

### Authentication & User Profiles

**File**: `backend/controllers/authController.ts`

- `registerUser(payload)`: Creates Firebase Auth user + writes UserProfile to `users` collection.
- `loginUser(credentials)`: Authenticates user and retrieves stored profile.
- `getUserProfile(uid)`: Fetches user's profile document.

**Key Features**:
- Full TypeScript typing for all parameters.
- Robust error handling with user-friendly messages.
- Prevents registration without valid grade level.

### Group Transaction Layer

**File**: `backend/controllers/groupController.ts`

- `createGroup(name, creator)`: Generates unique 6-character `teamDiscriminatorId`, creates group document, assigns creator as first member, and updates creator's `groupId`.
- `joinGroup(teamCode, user)`: Performs Firestore transaction:
  - Validates 6-character team code format
  - Retrieves group by `teamDiscriminatorId`
  - **STRICT CONSTRAINT**: Compares `user.grade` against `group.grade`; aborts entire transaction with clear error message if mismatch
  - Adds user to `memberIds` array if grades match

**Transaction Safety**: Uses Firestore `runTransaction()` to ensure atomicity and prevent race conditions.

### Leaderboard Ranking

**File**: `backend/controllers/leaderboardController.ts`

- `fetchLeaderboardEntries()`: Executes Firestore query:
  ```
  orderBy('completedActivitiesCount', 'desc')
  orderBy('lastProgressUpdatedAt', 'asc')
  ```
- Computes `completionPercent = (completedActivitiesCount / 7) * 100` for each group
- Time-based tie-breaker: Groups completing the same number of activities are ranked by earliest `lastProgressUpdatedAt`

### Activity Services (Fully Functional)

#### 1. Human Performance Lab
**File**: `backend/services/motionLabService.ts`

- Captures simultaneous Accelerometer and Gyroscope streams at 100ms intervals
- Computes smoothness score as inverse of delta displacement magnitude
- Triggers haptic feedback when acceleration or rotation deltas exceed preset thresholds (1.2 and 1.1 respectively)
- Automatically throttles sensor update interval when screen unmounts

#### 2. Reaction Board Challenge
**File**: `backend/services/reactionBoardService.ts`

**3-Stage Flow**:
1. **Tap Reaction**: User taps hidden button; records reaction time
2. **Hand Swap Detection**: Monitors accelerometer for hand position swap (sign change in X-axis acceleration)
3. **Shape Tracing**: User traces shape via touch; completion tracked via unique point grid (minimum 85% for success)

#### 3. Breathing Pace Trainer
**File**: `backend/services/breathingTrainerService.ts`

- 60-second session with 3 distinct phases (20 seconds each):
  - **Resting**: Baseline breathing measurement
  - **PostExercise1**: Jogging-induced elevated breathing
  - **PostExercise2**: Star jumps (maximum intensity)
- Uses peak detection on accelerometer to compute breaths-per-minute
- Automatically transitions between phases

### Infrastructure Services

#### Offline Sync Queue
**File**: `backend/services/sqliteService.ts`

- Creates `offline_sync_queue` table with fields:
  - `payload`: JSON string of activity result
  - `status`: 'pending' | 'synced' | 'failed'
  - `latitude`, `longitude`: Optional geolocation
  - `dueTimestamp`: Optional scheduled sync time
- `addSyncRecord()`: Queues data for later sync
- `getDueSyncRecords()`: Retrieves records ready to upload
- `markRecordSynced()` / `markRecordFailed()`: Updates record status

#### Background Task Management
**File**: `backend/tasks/syncTaskManager.ts`

- Registers background fetch task via `expo-background-fetch`
- Executes every 15 minutes (900 seconds)
- Appends geolocation to sync payload via `expo-location`
- Triggers `expo-notifications` local reminder when deferred data syncs
- Gracefully handles missing permissions

#### Sensor Throttling Utility
**File**: `backend/utils/sensorThrottler.ts`

- `applySensorThrottle(sensor, active)`: Sets update interval to 100ms (active) or 1000ms (idle)
- Reduces battery consumption when activity screen unmounts

---

## Frontend Implementation Details

### Navigation Structure (Expo Router)

**Root Layout** (`app/_layout.tsx`):
- Wraps all routes in Firebase provider (via AppTabs component)
- Initializes theme context

**Landing Page** (`app/index.tsx`):
- Entry point showing "STEMM Lab" title + action buttons
- Routes to `/login` or `/signup`

**Auth Routes** (`app/(auth)/`):
- `login.tsx`: Sign-in form with email + password
- `signup.tsx`: Registration form with email, password, firstName, and grade

**Tab Routes** (`app/(tabs)/`):
- `dashboard.tsx`: Overview of group status and challenge progress
- `activities.tsx`: List of 7 challenges linking to activity screens
- `leaderboard.tsx`: Ranked list with 3-person podium visualization

### Fully Functional Activity Screens

#### Human Performance Lab
`app/activity/human-performance.tsx`:
- Displays real-time accelerometer & gyroscope values
- Shows smoothness score (0–100)
- Displays breach count (haptic activation counter)
- Reset button to clear breach count

#### Reaction Board Challenge
`app/activity/reaction-board.tsx`:
- Visual state indicator showing current stage (tap → swap → trace → complete)
- Displays recorded reaction time in milliseconds
- Trace completion percentage visualization
- Responsive gesture handlers for shape tracing

#### Breathing Pace Trainer
`app/activity/breathing-trainer.tsx`:
- Phase indicator (Resting / PostExercise1 / PostExercise2)
- Live timer + breaths-per-minute counter
- Start/Restart/Stop buttons for session control

### Template Activity Screens

Each template (`parachute-drop.tsx`, `sound-pollution.tsx`, `hand-fan.tsx`, `earthquake-structure.tsx`) provides:
- Clean, minimalist UI structure
- Placeholder description for future feature integration
- Ready-to-hook connection points for sensor data

### Leaderboard UI

`app/(tabs)/leaderboard.tsx`:
- **Podium Section**: Top 3 groups displayed as scalable cards (1st place slightly enlarged)
- **Rankings Table**: Groups 4–N in FlatList with rank badge, group name, grade, completion count
- **Sticky User Status**: Floating container showing current user's group rank and completion percentage

---

## Security & Data Integrity

### Firestore Security Rules

**File**: `firestore.rules`

```
User Profiles (/users/{userId}):
  - Read: Only authenticated user can read their own profile
  - Create/Update: User can only write their own UID + email + grade

Groups (/groups/{groupId}):
  - Read: Only group members can view group data
  - Create: Can only create if authenticated and you're the first member
  - Update: Only group members can update

Leaderboard:
  - Read: All authenticated users (public view)
  - Write: Denied to all clients (backend-only updates)
```

---

## Development Setup

### Prerequisites
- Node.js >= 18
- Expo CLI installed globally
- Firebase project with Firestore + Auth enabled
- iOS simulator or Android emulator (or physical device with Expo Go)

### Installation

```bash
cd StemmLab/frontend
npm install

# Add new dependencies
npm install expo-sensors expo-haptics expo-location expo-notifications expo-background-fetch expo-task-manager expo-sqlite firebase

# Start development server
npm start

# Run on iOS/Android/Web
npm run ios
npm run android
npm run web
```

### Environment Configuration

Create a `.env.local` file in `frontend/`:
```
FIREBASE_API_KEY=<your-firebase-api-key>
FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
FIREBASE_PROJECT_ID=stemm-lab
FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
FIREBASE_APP_ID=<your-app-id>
```

---

## Testing & Deployment

### Local Testing
1. Start the development server: `npm start`
2. Open Expo Go on a physical device or emulator
3. Navigate through all activity screens to verify sensor polling
4. Test offline queue: kill app while activity in progress, restart to observe sync

### Production Deployment
1. Deploy Firestore security rules: `firebase deploy --only firestore:rules`
2. Build APK/IPA via `eas build --platform android/ios`
3. Deploy to Google Play Store or Apple App Store

---

## Known Limitations & Future Work

1. **Template Activities**: Parachute Drop, Sound Pollution, Hand Fan, and Earthquake Structure require Barometer/Microphone/Motion integration.
2. **Real-Time Sync**: Background sync currently marks records as synced locally; production should implement Firestore API calls.
3. **Authentication**: Firebase Email/Password is used; production should add OAuth2 (Google/Apple Sign-In).
4. **Analytics**: Consider integrating Firebase Analytics for activity performance tracking.

---

## Support & Contribution

For issues or feature requests, refer to the GitHub issues page or contact the development team.
