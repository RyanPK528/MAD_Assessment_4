# STEMM Lab — User Manual

Welcome to **STEMM Lab**, a mobile app that turns hands-on Science, Technology, Engineering, Mathematics, and Medicine (STEMM) challenges into structured, sensor-driven learning experiences for school teams.

This guide explains how to get started, what each screen shows, and how to use every major feature.

---

## Table of contents

1. [Who this app is for](#who-this-app-is-for)
2. [Getting started](#getting-started)
3. [App navigation](#app-navigation)
4. [Main screens](#main-screens)
5. [How activities work](#how-activities-work)
6. [The seven activities](#the-seven-activities)
7. [Leaderboard and progress](#leaderboard-and-progress)
8. [Settings and team profile](#settings-and-team-profile)
9. [Permissions, sensors, and offline use](#permissions-sensors-and-offline-use)
10. [Tips and troubleshooting](#tips-and-troubleshooting)

---

## Who this app is for

STEMM Lab is designed for **teams of students** (typically Year 5–10) working together with one shared phone or tablet. Each team registers **one account** that stores:

- Team name and member first names
- Grade level (Year 5 through Year 10)
- A unique **Team ID** (6-character code shown in Settings)
- Progress across seven STEMM challenges

Teams complete real-world experiments, record results in the app, submit reflections, and compare progress on a leaderboard.

---

## Getting started

### First launch

When you open the app, the **Welcome** screen shows:

- The **STEMM Lab** title and a short description
- **Log in** — for teams that already have an account
- **Create team account** — for new teams

### Create a team account

1. Tap **Create team account** (or **Create a team account** from the login screen).
2. Fill in:
   - **Team name** — your group’s display name on the dashboard and leaderboard
   - **Member first names** — comma-separated (e.g. `Alex, Sam, Jordan`)
   - **Email** — used to sign in (one email per team)
   - **Password** — create a secure password
   - **Grade level** — tap Year 5 through Year 10
3. Tap **Create account**.

After registration, you are taken straight to the **Dashboard**.

### Log in

1. Tap **Log in** from the welcome screen.
2. Enter your team **email** and **password**.
3. Tap **Sign in**.

If login fails, check your email and password. Error messages appear in a popup alert.

---

## App navigation

After signing in, the app uses a **bottom tab bar** with four main sections:

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Team welcome, progress summary, quick links |
| **Activities** | Browse and open all seven challenges |
| **Leaderboard** | See how teams rank by completion |
| **Settings** | Edit team profile, members, and appearance |

### Activity screens

Each activity opens in its own screen with three tabs at the top:

| Tab | Purpose |
|-----|---------|
| **Overview** | Learning goals, materials, step-by-step instructions, diagram |
| **Activity** | Run the experiment, record data, and submit |
| **Submission** | Discussion notes, past attempts, and results |

Use the **back arrow** (top left) on any activity to return to the Activities list.

---

## Main screens

### Welcome (landing)

**What you see:** App title, tagline, Log in and Create team account buttons, and a short hint about registering, completing challenges, and climbing the leaderboard.

**What you can do:** Start login or sign-up. You must pass through here only when not signed in.

---

### Dashboard

**What you see:**

- **Welcome message** with your team name
- **Battery badge** (top right) — current battery level and charging status
- **Stats row** — activities completed (e.g. `3/7`) and member count
- **Your progress** — progress bar and count of finished challenges
- **Quick start** — **View activities** button to jump to the activity list
- **Leaderboard preview** — top three teams with completion percentages; tap **View all** for the full board
- **Ad banner** at the bottom (when ads are enabled)

**What you can do:**

- Pull down to **refresh** — syncs pending results and reloads progress and leaderboard data
- Open the full activity list or leaderboard from here

---

### Activities

**What you see:**

- Page title **Activities** and subtitle about hands-on STEMM challenges
- **Category filters:** All, Engineering, Health & Medical
- A scrollable list of **activity cards**, each showing:
  - Cover image
  - Activity name and short description
  - Category badge (Engineering or Health & Medical)

**What you can do:**

- Filter by category using the chips at the top
- Tap any card to open that activity

There are **seven activities** in total (see [The seven activities](#the-seven-activities) below).

---

### Leaderboard

**What you see:**

- **Podium** — top three teams (1st in the center, 2nd left, 3rd right) with completion percentages
- **Ranked list** — remaining teams with rank, name, grade, activities completed (e.g. `5/7`), and completion %
- **Sticky banner at the bottom** (when signed in) — your team’s rank, name, progress bar, and `X of 7 activities complete`

**What you can do:**

- Pull down to **refresh** rankings
- Teams are ranked by **activity completion percentage** (how many of the seven activities the team has submitted at least once)

If no teams have submitted yet, empty-state messages explain that you need to complete activities first.

---

### Settings

**What you see:**

- **Team ID** — your unique 6-character discriminator (when available)
- **Team profile** — editable team name and grade level
- **Members** — list of member first names with Remove buttons; field to add new members
- **Appearance** — Light or Dark mode
- **Save team changes** button

**What you can do:**

- Update team name, grade, and member list, then tap **Save team changes**
- Switch between light and dark theme (applies immediately)
- Add members one at a time; duplicate names are blocked

**Note:** There is no in-app sign-out button in the current version. To use a different team account, sign out through your device or reinstall/clear app data as appropriate for your setup.

---

## How activities work

Every activity follows the same general workflow.

### 1. Read the Overview tab

Before starting, review:

- **Overview** — what you will learn
- **Materials / Equipment** — what you need
- **Instructions** — numbered steps for the classroom activity
- **Diagram** — visual reference for setup

### 2. Complete work on the Activity tab

Each activity has its own controls (timers, sensors, recording buttons, design forms, etc.). Follow the on-screen instructions and your teacher’s guidance.

Common patterns:

- **Design trials** — name your prototype, enter predictions, run tests, save results (Engineering activities)
- **Sensor recording** — start/stop recording; live readings appear during capture (Health & Medical activities)
- **Permissions** — some activities ask for camera, microphone, or location access before you can proceed

### 3. Submit an attempt

When your data is ready:

1. Tap **Submit attempt** on the Activity tab.
2. The app may capture your **GPS location** automatically (or use location already recorded during the activity).
3. A **reflection modal** opens:
   - **Self-rating (1–5)** — how well you think the team did
   - **Reflection** — written notes on what you learned (required)
4. Tap **Confirm submission**.

After a successful submit:

- You may receive a **local notification** confirming the save
- The app switches to the **Submission** tab
- Your attempt appears in **Submitted Attempts**
- Dashboard and Leaderboard progress update after sync

### 4. Review on the Submission tab

The Submission tab includes:

- **Discussion** — science concepts tied to the activity (Sound Pollution also shows a decibel reference table)
- **Submitted Attempts** — list of past tries; tap one to open **Attempt Details**

### Attempt Details

From any submitted attempt you can view:

- Activity name, attempt number, and submission date/time
- **GPS location** (tap to open in maps, when available)
- **Self-rating and reflection**
- **Activity-specific results** (trials, sensor metrics, phase summaries, etc.)

You can submit **multiple attempts** per activity (no fixed limit in the current app). Each attempt is numbered sequentially.

---

## The seven activities

Activities are grouped into **Engineering** (1–4) and **Health & Medical** (5–7).

---

### 1. Parachute Drop Challenge *(Engineering)*

**Goal:** Design, build, and test parachutes to slow a toy’s landing. Compare baseline drops (no parachute) with up to three prototype designs.

**Overview highlights:** Paper/plastic, string, tape, small toy, elevated drop surface; 20-minute design session.

**Activity tab features:**

- Enter **drop height** (m) and **toy mass** (kg)
- **Session timer** (20-minute design window)
- Up to **3 prototype trials** — label, prediction, notes per design
- **Record video** of each drop (camera + microphone permissions required)
- **Drop timer** runs while recording
- **Physics results** — estimated speed, impact force, landing accuracy
- **Trial results table** summarizing all runs

**Submit:** Includes height, mass, all trial data, session time, and video references.

---

### 2. Sound Pollution Hunter *(Engineering)*

**Goal:** Measure and compare noise levels for different classroom actions and map loud vs. quiet zones.

**Overview highlights:** Uses the phone microphone and location.

**Activity tab features:**

- **Grant permissions** — microphone and location (required)
- **Live sound level** — current dB and peak dB with color-coded risk
- Choose or type an **action label** (e.g. drop book, talking, stamp feet)
- **Prediction** — whether you expect the action to be louder or quieter than the previous one
- **Start / stop metering** — captures peak dB and GPS for each action
- **Logged actions table** — all measurements for this attempt

**Submission tab:** Includes a **decibel reference table** (whisper through explosion levels and hearing risk).

**Submit:** All logged actions and zone coordinates.

---

### 3. Hand Fan Challenge *(Engineering)*

**Goal:** Explore how moving air affects paper vs. cardboard at different fan distances.

**Activity tab features:**

- Select **material** — paper or cardboard
- Select **fan distance** — 15 cm, 30 cm, or 45 cm
- **Fan intensity** — live reading while you fan near the phone
- **Design trial card** — label, prediction, notes; optional bend angle
- **Start / stop fan test** — records intensity and bend behavior
- **Trial results table**

**Submit:** All saved design trials for the attempt.

---

### 4. Earthquake-Resistant Structure *(Engineering)*

**Goal:** Build structures that absorb vibration, simulating earthquake forces using the phone’s motion sensors.

**Activity tab features:**

- **Structure design** — label, number of folds, pillars, and prediction (up to 3 designs)
- **Start / stop earthquake test** — vibration simulation with live displacement and rotation
- **Max displacement and rotation** tracked per design
- **Best design** highlighted from your trials
- **Trial results table**

**Submit:** All designs and best-design summary.

---

### 5. Human Performance Lab *(Health & Medical)*

**Goal:** Measure movement quality during controlled stretching using the phone’s motion sensors.

**Three phases:**

1. **Circle + figure 8** — perform both shapes in succession
2. **Up and down** — smooth vertical movement
3. **Left and right** — smooth horizontal movement

**Activity tab features:**

- **Prediction** — enter expected phone vibration (absolute) before each phase
- **Record** button — countdown, then recording; **Finish** when the movement is done
- **Live metrics** — elapsed time, largest movement delta, vibration events, smoothness score
- **Movement sparkline** during recording
- Haptic feedback when movement is **jerky** — aim for low vibration events
- **Continue** after each phase to advance; complete all three before submitting
- **Results table** for all phases

**Submit:** All three phase results with predictions and sensor metrics.

---

### 6. Reaction Board Challenge *(Health & Medical)*

**Goal:** Test reaction time and coordination across three challenge types. **Each team member** takes a turn per phase (names come from your team profile in Settings).

**Three phases:**

1. **Tap reaction** — tap as soon as a hidden button appears (dominant hand)
2. **Swap hands** — same tap test with non-dominant hand
3. **Tracing challenge** — trace a moving shape on screen

**Activity tab features:**

- Shows **current member** and **current phase**
- **Prediction** before each turn
- **Tap zone** or **tracing zone** depending on phase
- **Stat cards** — reaction time, accuracy, group averages
- Rotate through all members; advance phases when everyone has completed their turn
- **Results table** with per-member and per-phase summaries

**Submit:** Full payload after all members complete all three phases.

---

### 7. Breathing Pace Trainer *(Health & Medical)*

**Goal:** Analyze breathing patterns at rest and after exercise using chest movement detected by the phone’s sensors.

**Three phases per member:**

1. **At rest** — phone on chest, record breathing
2. **After jogging** — one minute of jogging on the spot, then record
3. **After star jumps** — ~100 jumping jacks, then record

**Activity tab features:**

- Rotates through **each team member** until everyone finishes all phases
- **Overall progress bar** across members and phases
- **Prediction** before each recording
- **Record** — fixed-duration capture (~30 seconds); shows breaths recorded during recording
- **Phase complete** summary — BPM and outcome after each recording
- **Results table** for all members and phases

**Submit:** After every member completes all three breathing phases.

---

## Leaderboard and progress

### How completion is calculated

- There are **7 activities** total.
- A team’s **completion percentage** is based on how many distinct activities have at least one submitted attempt.
- Example: 3 submitted activities → roughly **43%** complete (`3/7`).

### Where progress appears

| Location | What it shows |
|----------|----------------|
| Dashboard stats | `Completed X/7` |
| Dashboard progress bar | Percentage of activities finished |
| Leaderboard row | Rank, grade, `X/7` activities, completion % |
| Leaderboard banner | Your team’s rank and progress |

Progress updates when attempts are saved and synced (see below).

---

## Settings and team profile

Keep your team profile accurate so reaction and breathing activities know **who is taking each turn**.

| Field | Used for |
|-------|----------|
| Team name | Dashboard welcome, leaderboard display |
| Grade level | Leaderboard filtering/display |
| Member names | Reaction Board and Breathing Trainer member rotation |
| Team ID | Identifying your team (shown to teachers/admins) |
| Theme | Personal preference (light/dark) |

Changes are saved to the cloud when you tap **Save team changes** and you have an internet connection.

---

## Permissions, sensors, and offline use

### Permissions the app may request

| Permission | Used by |
|------------|---------|
| **Camera & microphone** | Parachute Drop (video recording) |
| **Microphone** | Sound Pollution (decibel metering) |
| **Location** | Sound Pollution (zone mapping); automatic GPS on submission |
| **Motion sensors** | Human Performance, Earthquake Structure, Breathing Trainer |
| **Notifications** | Optional confirmation when an attempt is saved |

Grant permissions when prompted, or use in-app **Grant permissions** buttons where shown.

### Offline behavior

- Activity data is saved **locally first** (SQLite queue), then synced to Firebase when online.
- The app attempts to **sync pending results** on launch and when you refresh the Dashboard or Leaderboard.
- You can complete and submit attempts offline; they upload when connectivity returns.

### Battery indicator

The Dashboard shows a small **battery badge** so teams can check device charge before long sensor or video sessions.

### Ads

A banner ad may appear at the bottom of the Dashboard when ad services are configured.

---

## Tips and troubleshooting

### General

- **Read Overview first** — materials and classroom steps are there before you use sensors.
- **One phone per team** — register once, add all member names, and pass the device for individual turns where required.
- **Pull to refresh** on Dashboard and Leaderboard if progress looks stale after submitting.
- **Write meaningful reflections** — teachers review these alongside your sensor data.

### Common issues

| Problem | What to try |
|---------|-------------|
| Login fails | Verify email/password; ensure the account was created successfully |
| Permission denied | Open device Settings → STEMM Lab → enable Camera, Microphone, or Location |
| Submit button disabled | Complete all required phases/trials for that activity first |
| “Incomplete attempt” alert | Finish every phase (e.g. all 3 stretch phases, all team members in Reaction Board) |
| Leaderboard empty | At least one team must submit an activity; pull to refresh |
| Results not updating | Check internet; pull to refresh; wait a few seconds for background sync |
| Recording doesn’t start | Hold the phone as instructed; ensure motion sensors are available on your device |
| Video won’t record | Grant camera and microphone; close other apps using the camera |

### Recommended workflow for a class session

1. Sign in and confirm **Settings** (team name, members, grade).
2. Open **Activities** and choose the assigned challenge.
3. Review **Overview** as a team.
4. Gather materials and run the experiment on the **Activity** tab.
5. **Submit attempt** with rating and reflection.
6. Check **Submission** tab and **Attempt Details** to verify data.
7. Check **Dashboard** and **Leaderboard** for updated progress.

---

## Quick reference — activity categories

| # | Activity | Category | Key device features |
|---|----------|----------|---------------------|
| 1 | Parachute Drop Challenge | Engineering | Camera, video, timers |
| 2 | Sound Pollution Hunter | Engineering | Microphone, location |
| 3 | Hand Fan Challenge | Engineering | Motion / fan intensity |
| 4 | Earthquake-Resistant Structure | Engineering | Vibration / motion sensors |
| 5 | Human Performance Lab | Health & Medical | Motion sensors, haptics |
| 6 | Reaction Board Challenge | Health & Medical | Touch, timing, tracing |
| 7 | Breathing Pace Trainer | Health & Medical | Chest motion / accelerometer |

---

*STEMM Lab — Transform real-world activities into engaging STEMM learning experiences.*

For technical setup (developers), see [README.md](README.md) in this repository.
