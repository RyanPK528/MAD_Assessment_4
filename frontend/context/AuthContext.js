import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { fetchTeamData } from '../services/firebase/authService';

export const AuthContext = createContext(null);

/**
 * Wraps the entire app. Tracks:
 *   user       — Firebase user object (null if logged out)
 *   teamData   — Firestore team document (null if not yet set up)
 *   loading    — true while checking auth state on cold start
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires on app start (checking AsyncStorage) and on login/logout
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const data = await fetchTeamData(firebaseUser.uid);
          setTeamData(data); // null if they haven't completed team setup yet
        } catch (err) {
          console.error('[AuthContext] fetchTeamData error:', err);
          setTeamData(null);
        }
      } else {
        setUser(null);
        setTeamData(null);
      }
      setLoading(false);
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, teamData, setTeamData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook — use this instead of useContext(AuthContext) directly */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
  return ctx;
}
