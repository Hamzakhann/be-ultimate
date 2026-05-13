export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  createdAt?: string;
}
