// User-facing profile type
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  aiConsentVersion?: string;
  aiConsentAt?: string;
  preferences: {
    theme: 'light' | 'dark';
  };
  createdAt: string;
  updatedAt: string;
}
