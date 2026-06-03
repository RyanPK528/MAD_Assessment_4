# STEMM Lab

Transform real-world physical activities into engaging, game-based Science, Technology, Engineering, Mathematics, and Medicine (STEMM) learning experiences for upper Primary and lower High School students.

Expo
React Native
TypeScript
Firebase

---

## Project Overview

STEMM Lab is a cross-platform mobile application built with Expo and React Native. Teams of students register a single shared account, complete seven sensor-driven STEMM challenges, and compete on a grade-aware leaderboard.

Each team account stores:

- Team name and member first names
- Grade level (Year 5–10)
- A unique 6-character alphanumeric **Team ID** (discriminator)
- Activity completion progress synced to Firebase Firestore

The app supports offline activity capture through a local SQLite queue and syncs results to the cloud when connectivity is restored. Activities use device sensors, camera, microphone, and location where appropriate.

**Primary user flow**

1. Sign up or log in as a team account
2. Browse and complete activities from the Activities tab
3. Track team progress on the Dashboard
4. Compare standings on the Leaderboard
5. Manage team profile, theme, and preferences in Settings

---

## Technology Stack


| Layer                     | Technology                                                |
| ------------------------- | --------------------------------------------------------- |
| Framework                 | Expo ~56 (managed workflow), React Native 0.85, React 19  |
| Language                  | TypeScript ~6.0                                           |
| Navigation                | Expo Router ~56 (file-based routing)                      |
| Authentication & Database | Firebase JS SDK 12 (Auth, Firestore)                      |
| Offline storage           | `expo-sqlite` (sync queue for activity results)           |
| Sensors & hardware        | `expo-sensors`, `expo-camera`, `expo-av`, `expo-location` |
| Background tasks          | `expo-background-fetch`, `expo-task-manager`              |
| UI & animation            | React Context (theme), Reanimated 4, Safe Area Context    |
| Icons                     | `expo-symbols` via cross-platform `AppIcon` wrapper       |
| Testing                   | Jest 29, `jest-expo`                                      |
| Linting                   | ESLint 9, `eslint-config-expo`                            |
| Build                     | EAS Build (`eas.json`)                                    |
| Dev tooling               | Firebase Admin SDK (standalone Firestore seed script)     |


The `/backend` folder contains shared service logic, models, and controllers used as a reference layer; the runnable Expo app lives in `/frontend`.

---

## Project Structure

```
StemmLab/
├── frontend/                    # Expo React Native application
│   ├── app/                     # Expo Router screens
│   │   ├── (auth)/              # Login & signup
│   │   ├── (tabs)/              # Main tab navigation
│   │   │   ├── dashboard.tsx
│   │   │   ├── activities.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   └── settings.tsx     # Team profile + theme
│   │   └── activity/            # Individual challenge screens
│   ├── components/              # Reusable UI (ActivityLayout, themed components)
│   ├── config/                  # Firebase native initialization
│   ├── constants/               # Theme tokens, activity IDs
│   ├── hooks/                   # Theme, focus-load, activity styles
│   ├── services/                # Auth, groups, SQLite sync, activity logic
│   ├── utils/                   # Group discriminator generation
│   ├── scripts/                 # Standalone dev scripts (seed-database.mjs)
│   ├── __tests__/               # Jest unit tests
│   ├── app.config.js            # Expo config + env injection
│   ├── eas.json                 # EAS build profiles
│   └── package.json
├── backend/                     # Shared backend services & models
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   └── tasks/
├── firestore.rules              # Firestore security rules
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Expo Go](https://expo.dev/go) on a physical device, or Android/iOS emulator
- A Firebase project with **Authentication (Email/Password)** and **Cloud Firestore** enabled

### 1. Clone and install

```bash
git clone <repository-url>
cd StemmLab/frontend
npm install
```

### 2. Configure Firebase environment variables

Create `frontend/.env` (this file is gitignored):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Values are available in the Firebase Console under **Project settings → General → Your apps**.

### 3. Deploy Firestore security rules

From the repository root:

```bash
firebase deploy --only firestore:rules
```

### 4. Run the development server

```bash
cd frontend
npm start
```

Then press `a` for Android, `i` for iOS (macOS), `w` for web, or scan the QR code with Expo Go.

---

## Testing

Unit tests live in `frontend/__tests__/` and target services and shared logic.

```bash
cd frontend
npm test
```

Run a single test file:

```bash
npm test -- authService.grade.test.ts
```

Jest is configured in `frontend/jest.config.js` with the `jest-expo` preset. Coverage is collected from `services/` and `components/`.

A Firebase Test Lab scaffold is included at `frontend/firebase-test-lab.yml` for future CI integration.

---

## Linting

```bash
cd frontend
npm run lint
```

ESLint uses the Expo flat config (`frontend/eslint.config.js`) with `eslint-config-expo`. Run lint before committing changes to catch unused variables, hook violations, and TypeScript-aware React Native issues.

---

## Key Features

### Team account authentication

- One Firebase Auth account per team (not per individual student)
- Registration captures team name, member first names, and grade level (Year 5–10)
- Creates linked `users/{uid}` and `groups/{groupId}` documents in a Firestore transaction

### Unique Team ID

- Each group receives a random 6-character alphanumeric discriminator (e.g. `ST3M9X`)
- Generated with Firestore collision checking at registration
- Displayed on the Settings screen for reference

### Seven STEMM activities

Each activity uses a three-tab layout (Overview, Activity, Submission):


| Activity                       | Category         |
| ------------------------------ | ---------------- |
| Parachute Drop Challenge       | Engineering      |
| Sound Pollution Hunter         | Engineering      |
| Hand Fan Challenge             | Engineering      |
| Earthquake-Resistant Structure | Engineering      |
| Human Performance Lab          | Health & Medical |
| Reaction Board Challenge       | Health & Medical |
| Breathing Pace Trainer         | Health & Medical |


### Leaderboard

- Teams ranked by completion percentage across all 7 challenges
- Tie-breaker: earlier `lastProgressUpdatedAt` wins
- Top-3 podium view plus scrollable standings
- Sticky bottom banner showing the current team's rank, name, and progress bar

### Offline sync

- Activity results queued locally in SQLite when offline
- `syncPendingResults()` pushes pending records to Firestore when the app regains connectivity

### Theme support

- Light and dark mode toggle in Settings
- Theme tokens centralized in `constants/theme.ts` via `ThemeContext`

### Navigation

Main tabs: **Dashboard**, **Activities**, **Leaderboard**, **Settings**

Activity screens navigate back explicitly to the Activities list (not the Dashboard).

---

## Security

### Firestore rules (`firestore.rules`)


| Collection         | Policy                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `users/{userId}`   | Users can read/write only their own profile; creation validates team name, members, and grade                                      |
| `groups/{groupId}` | Authenticated read (leaderboard); create requires creator as first member or `isSeedData` flag; update restricted to group members |
| All other paths    | Denied by default                                                                                                                  |


### Client-side practices

- Firebase config loaded from environment variables (`EXPO_PUBLIC_`*), not hardcoded secrets
- Service account keys used only by the dev seed script and must never be committed (`.env` and key files are gitignored)
- Auth persistence uses AsyncStorage via `initializeAuth` on native platforms
- Grade-level validation enforced when joining groups

### Permissions

The app requests camera, microphone, and location permissions only for activities that need them. Usage descriptions are defined in `app.config.js`.

---

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [Firebase for Web/React Native](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

