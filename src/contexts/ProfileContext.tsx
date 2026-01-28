
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, profiles, Profile } from '../lib/api';

interface ProfileContextType {
  profiles: Profile[];
  selectedProfile: Profile | null;
  setSelectedProfile: (profile: Profile) => void;
  loading: boolean;
  error: string | null;
  refreshProfiles: () => Promise<void>;
  currentUser: any;
  isPro: boolean;
  isAdmin: boolean;
  togglePro: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileList, setProfileList] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPro] = useState<boolean>(true); // All users are PRO now

  // Kullanıcı oturum kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.isAuthenticated()) {
        const currentPath = window.location.pathname;
        const publicPaths = ['/', '/login', '/kayit', '/sifre-sifirlama', '/yeni-sifre', '/tanitim-filmi', '/tanitim_filmi', '/gizlilik-politikasi'];

        if (!publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'))) {
          if (currentPath !== '/') {
            window.location.href = '/';
          }
        }
        setLoading(false);
        return;
      }

      const { data, error: userError } = await auth.getUser();

      if (userError || !data?.user) {
        await auth.logout();
        const currentPath = window.location.pathname;
        const publicPaths = ['/', '/login', '/kayit', '/sifre-sifirlama', '/yeni-sifre', '/tanitim-filmi', '/tanitim_filmi', '/gizlilik-politikasi'];

        if (!publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'))) {
          window.location.href = '/';
        }
        setLoading(false);
        return;
      }

      // If logged in and at root, redirect to dashboard
      if (window.location.pathname === '/') {
        window.location.href = '/dashboard';
      }

      setCurrentUser(data.user);
    };

    checkAuth();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        setProfileList([]);
        setSelectedProfileState(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await profiles.get();

      if (fetchError) {
        throw new Error(fetchError);
      }

      if (data) {
        setProfileList([data]);
        setSelectedProfileState(data);
      } else {
        setProfileList([]);
        setSelectedProfileState(null);
      }

    } catch (err) {
      console.error('Profil yüklenirken hata:', err);
      setError('Profil verileri alınamadı.');
      setProfileList([]);
      setSelectedProfileState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProfiles();
    }
  }, [currentUser]);

  const setSelectedProfile = (profile: Profile) => {
    setSelectedProfileState(profile);
  };

  const togglePro = () => {
    // No longer needed as everyone is Pro, but kept for compatibility
    console.log('Tüm kullanıcılar zaten PRO sürümündedir.');
  };

  const refreshProfiles = async () => {
    await loadProfiles();
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles: profileList,
        selectedProfile,
        setSelectedProfile,
        loading,
        error,
        refreshProfiles,
        currentUser,
        isPro: true,
        isAdmin: currentUser?.role === 'admin',
        togglePro,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
