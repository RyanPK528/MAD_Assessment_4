import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/config/firebaseNative';

const GROUPS_COLLECTION = 'groups';
const DISCRIMINATOR_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_GENERATION_ATTEMPTS = 12;

export function generateDiscriminatorCode(): string {
  return Array.from({ length: 6 })
    .map(() => DISCRIMINATOR_ALPHABET[Math.floor(Math.random() * DISCRIMINATOR_ALPHABET.length)])
    .join('');
}

export async function createUniqueTeamDiscriminatorId(): Promise<string> {
  const firestore = getFirebaseFirestore();
  const groupsRef = collection(firestore, GROUPS_COLLECTION);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = generateDiscriminatorCode();
    const existing = await getDocs(query(groupsRef, where('teamDiscriminatorId', '==', candidate)));
    if (existing.empty) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique team code at this time. Please try again.');
}
