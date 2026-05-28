# 🔬 STEMM Lab - Mobile Application

Transform real-world physical activities into engaging, game-based Science, Technology, Engineering, Mathematics, and Medicine (STEMM) learning experiences for upper Primary and lower High School students.

![Expo](https://img.shields.io/badge/Expo-Managed_Workflow-black?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-Cross_Platform-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-orange?style=flat-square&logo=firebase)

---

## 📱 Features & Core Flows

### 🔐 Individual Authentication & Profile Guarding
- **Individual Identity Registration:** Students sign up uniquely using their Email, Password, First Name, and Academic Grade/Year Level.
- **Grade Isolation Boundary:** Users can only browse, create, or join teams sharing their exact individual academic grade bracket.

### 👥 Group Setup Engine
- **Post-Auth State Routing:** Users with an unassigned group are locked to a Group Setup Junction Screen, utilizing clean mobile user interface abstractions to intuitively guide them through team creation or joining.
- **Group Creation & Joining:** Programmatically instantiates groups with a unique 6-character alphanumeric discriminator. Strict backend transactions ensure users can only join teams matching their grade level.

### 🏆 Global Group Progression Leaderboard
- **Completion Percentage Tracking:** Teams are ranked based on their total completion percentile across the 7 core challenges.
- **Time-Based Tie-Breaker Logic:** If two or more groups have identical activity progression, a strict First-Come, First-Served constraint awards the higher rank to the team that hit the progress milestone first.
- **Visual Display Layout:** Features dynamic filter configurations, a customized 3-column top podium UI, and a scrollable standings list pinning a sticky layout element for the user's current group status.

---

## ⚙️ Technical Blueprint & Backend Services

### 💾 Local Relational Storage & Cloud Sync
- **Local SQLite Engine:** Utilizes `expo-sqlite` to cleanly cache telemetry configurations and student entries offline.
- **Hybrid Cloud Sync:** Pushes batched transactions upwards to remote Firebase Firestore instantly when connectivity toggles.

### 🔋 Context-Aware Hardware Integration & Battery Optimization
- Harnesses robust context-aware computing by hooking into `expo-sensors` to throttle hardware sampling frequencies based on user state. Sensors aggressively down-regulate or shut down the microsecond an activity screen unmounts, conserving power.
- **Background Tasks:** Utilizes `expo-background-fetch` and `expo-location` to securely process background sync loops and transparently tag physics data with exact geographic coordinates without dropping main UI frames.

---

## 🎓 Available Activities

1. **Parachute Drop** - Engineering 
2. **Sound Pollution Hunter** - Physics 
3. **Hand Fan Challenge** - Engineering 
4. **Earthquake Structure** - Engineering 
5. **Stretch Lab** - Health 
6. **Reaction Board** - Health 
7. **Breathing Trainer** - Health 

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go Application

### Installation
1. Clone the project repository.
2. Initialize dependencies:
   ```bash
   npm install

### Running the App

```bash
# Start Expo development server
npm start

# Open on iOS Simulator (macOS)
i

# Open on Android Emulator
a

# Open on Web
w

# Or scan QR code with Expo Go app on your phone
```

## 🏗️ Architecture

- **Framework**: Expo Managed Workflow (React Native) with strict TypeScript.
- **Project Structure**: Decoupled architecture separating logic (`/backend` containing controllers, services, models, and configs) from UI (`/frontend` utilizing standard Expo native setups).
- **Navigation**: Expo Router (file-based routing).
- **State Management**: React Context API paired with custom backend service hooks.
- **Cloud Infrastructure**: Firebase (Authentication & Firestore) for profile guarding, real-time syncing, and leaderboards.
- **Offline Storage**: Local relational databases using `expo-sqlite` for buffering activity data during offline states.
- **Device Capabilities**: Deep native integration for hardware telemetry, background tasks, and location tracking via standard Expo SDKs.

### Tech Stack

- React Native 0.81.5
- Expo 54.0
- Expo Router 6.0
- TypeScript 5.9
- Firebase JS SDK (Authentication, Firestore)
- Core Expo Libraries (`expo-sqlite`, `expo-sensors`, `expo-task-manager`, `expo-background-fetch`, `expo-location`)
- Media Libraries (`expo-camera`, `expo-av`)
- React Reanimated 4

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

