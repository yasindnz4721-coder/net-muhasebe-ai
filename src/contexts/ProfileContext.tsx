
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
  togglePro: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileList, setProfileList] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('isPro') === 'true';
  });

  // Kullanıcı oturum kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      // Token var mı kontrol et
      if (!auth.isAuthenticated()) {
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/kayit', '/sifre-sifirlama', '/yeni-sifre'];

        if (!publicPaths.some(path => currentPath.startsWith(path))) {
          window.location.href = '/login';
        }
        setLoading(false);
        return;
      }

      // Kullanıcı bilgisini al
      const { data, error: userError } = await auth.getUser();

      if (userError || !data?.user) {
        // Token geçersiz, temizle ve login'e yönlendir
        await auth.logout();
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/kayit', '/sifre-sifirlama', '/yeni-sifre'];

        if (!publicPaths.some(path => currentPath.startsWith(path))) {
          window.location.href = '/login';
        }
        setLoading(false);
        return;
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

      // Profil bilgisini al
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
      setError('Profil yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
      setProfileList([]);
      setSelectedProfileState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProfiles();
      // Sync Pro status from database
      const proStatus = currentUser.subscription_tier === 'pro';
      setIsPro(proStatus);
      localStorage.setItem('isPro', proStatus.toString());
    }
  }, [currentUser]);

  const setSelectedProfile = (profile: Profile) => {
    setSelectedProfileState(profile);
  };

  const togglePro = () => {
    setIsPro(prev => {
      const next = !prev;
      localStorage.setItem('isPro', next.toString());
      return next;
    });
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
        isPro,
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
