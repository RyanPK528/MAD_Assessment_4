export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  grade: number;
  groupId: string | null;
  createdAt: string;
}

export interface UserRegistrationPayload {
  email: string;
  password: string;
  firstName: string;
  grade: number;
}

export interface UserCredentials {
  email: string;
  password: string;
}
