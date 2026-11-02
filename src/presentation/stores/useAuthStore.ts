import { create } from 'zustand';

export interface UserProfile {
  name: string;
  subtitle: string;
  avatarUrl: string;
  email: string;
  isOnline: boolean;
}

interface AuthState {
  user: UserProfile;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    name: 'Minh',
    subtitle: 'Sẵn sàng tăng tốc tư duy hôm nay chưa?',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6OdO_kainvrujw2WQSF1EElkO6BZXY7NYZTVD54KTQQwxkCP39Adzu1m6q0i6H00GLcbV4lMe9z92OOknCkeyClRZDnbfnJg4jPpA3xEXvD6pjJOjiGGje0xG6AGoCfuz4szuDMpC_fyDrnyKIF4jLpHznyHQNT_VU1BF0Jr-czwM2uVc6QN0gokN_BN4xM6WneGLgWkCqPShRxIJmNePuR0rNCzN4G7bGUQJUnE',
    email: 'nguyennt2.23itb@vku.udn.vn',
    isOnline: true
  },
  setOnlineStatus: (isOnline) =>
    set((state) => ({ user: { ...state.user, isOnline } }))
}));
