/**
 * Standalone Firestore seed script for mock leaderboard data.
 *
 * Requires a Firebase service account key (Admin SDK bypasses security rules).
 *
 * Usage:
 *   npm run seed:db          # replace existing seed teams and insert mock data
 *   npm run seed:db:clear    # remove all documents marked isSeedData: true
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const TOTAL_CHALLENGES = 7;
const GROUPS_COLLECTION = 'groups';
const SEED_MARKER = 'isSeedData';
const DISCRIMINATOR_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_GENERATION_ATTEMPTS = 12;

const MOCK_GROUP_TEMPLATES = [
  { name: 'Nova Pioneers', grade: 7, completionPercent: 95 },
  { name: 'Quantum Quokkas', grade: 7, completionPercent: 82 },
  { name: 'Binary Builders', grade: 8, completionPercent: 71 },
  { name: 'Circuit Surfers', grade: 6, completionPercent: 57 },
  { name: 'Pixel Pioneers', grade: 9, completionPercent: 43 },
  { name: 'Data Dragons', grade: 8, completionPercent: 29 },
  { name: 'Code Comets', grade: 7, completionPercent: 18 },
  { name: 'STEM Sparklers', grade: 10, completionPercent: 10 },
];

function generateDiscriminatorCode() {
  return Array.from({ length: 6 })
    .map(() => DISCRIMINATOR_ALPHABET[Math.floor(Math.random() * DISCRIMINATOR_ALPHABET.length)])
    .join('');
}

function percentToCompletedCount(percent) {
  const count = Math.round((percent / 100) * TOTAL_CHALLENGES);
  return Math.min(TOTAL_CHALLENGES, Math.max(1, count));
}

function resolveProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    ''
  );
}

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  const projectId = resolveProjectId();
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    const absolutePath = resolve(serviceAccountPath);
    const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
    return admin.firestore();
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
    return admin.firestore();
  }

  throw new Error(
    [
      'Missing Firebase Admin credentials.',
      'Set GOOGLE_APPLICATION_CREDENTIALS (or FIREBASE_SERVICE_ACCOUNT_PATH) to your service account JSON file.',
      'Download one from Firebase Console → Project settings → Service accounts → Generate new private key.',
    ].join('\n'),
  );
}

async function createUniqueTeamDiscriminatorId(db) {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = generateDiscriminatorCode();
    const snapshot = await db
      .collection(GROUPS_COLLECTION)
      .where('teamDiscriminatorId', '==', candidate)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique team code. Try again.');
}

async function clearSeedGroups(db) {
  const snapshot = await db.collection(GROUPS_COLLECTION).where(SEED_MARKER, '==', true).get();
  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

async function seedMockLeaderboardGroups(db, { replaceExisting = true } = {}) {
  if (replaceExisting) {
    const removed = await clearSeedGroups(db);
    if (removed > 0) {
      console.log(`Removed ${removed} existing seed team(s).`);
    }
  }

  let created = 0;

  for (const template of MOCK_GROUP_TEMPLATES) {
    const teamDiscriminatorId = await createUniqueTeamDiscriminatorId(db);
    const completedActivitiesCount = percentToCompletedCount(template.completionPercent);

    await db.collection(GROUPS_COLLECTION).add({
      name: template.name,
      grade: template.grade,
      gradeLevel: `Year ${template.grade}`,
      memberNames: ['Seed Member'],
      memberCount: 1,
      memberIds: [],
      teamDiscriminatorId,
      completedActivitiesCount,
      activityResults: [],
      [SEED_MARKER]: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastProgressUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    created += 1;
    console.log(
      `  + ${template.name} (${teamDiscriminatorId}) — ${template.completionPercent}% (${completedActivitiesCount}/${TOTAL_CHALLENGES})`,
    );
  }

  return created;
}

async function main() {
  const clearOnly = process.argv.includes('--clear');
  const db = initializeFirebaseAdmin();

  console.log(`Project: ${resolveProjectId() || admin.app().options.projectId}`);

  if (clearOnly) {
    const removed = await clearSeedGroups(db);
    console.log(removed > 0 ? `Cleared ${removed} seed team(s).` : 'No seed teams found.');
    return;
  }

  console.log('Seeding mock leaderboard teams...');
  const created = await seedMockLeaderboardGroups(db, { replaceExisting: true });
  console.log(`Done. Created ${created} mock team(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
