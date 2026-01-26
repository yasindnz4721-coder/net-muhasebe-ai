import { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { profiles, auth } from '../../lib/api';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import { useTranslation } from 'react-i18next';

export default function ProfilAyarlariPage() {
  const { selectedProfile, refreshProfiles, currentUser } = useProfile();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>('profile');

  // Profil bilgileri
  const [profileName, setProfileName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Şifre değiştirme
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Dil seçimi
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    if (selectedProfile) {
      setProfileName(selectedProfile.name);
      setLogoPreview(selectedProfile.logo_url || null);
    }
  }, [selectedProfile]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await profiles.update(profileName, logoPreview || undefined);
      if (error) throw new Error(error);

      await refreshProfiles();
      setMessage({ type: 'success', text: t('profileUpdatedSuccess') || 'Profil başarıyla güncellendi' });
    } catch (error: any) {
      console.error('Profil güncellenirken hata:', error);
      setMessage({ type: 'error', text: error.message || t('profileUpdateError') || 'Güncelleme hatası' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır!' });
      return;
    }

    setPasswordLoading(true);
    setMessage(null);

    try {
      const { error } = await auth.updatePassword(newPassword);
      if (error) throw new Error(error);

      setMessage({ type: 'success', text: 'Şifreniz başarıyla değiştirildi!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      setMessage({ type: 'error', text: error.message || 'Şifre değiştirilemedi!' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
    setMessage({ type: 'success', text: 'Sistem dili güncellendi.' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative text-xs">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] animate-aurora-1"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                <i className="ri-settings-4-line"></i>
                <span>SİSTEM VE KULLANICI AYARLARI</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Tercihler & <span className="text-gradient from-indigo-400 to-purple-500 italic">Profil.</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-xl">Hesap ayarlarınızı, şirket bilgilerinizi ve güvenlik tercihlerini buradan yönetin.</p>
            </div>

            {/* Notification */}
            {message && (
              <div className={`p-6 rounded-[2rem] border animate-slide-up flex items-center gap-6 ${message.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-500'
                }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                  }`}>
                  <i className={`${message.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-2xl`}></i>
                </div>
                <span className="font-black uppercase tracking-widest">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity">
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Tabs Sidebar */}
              <div className="lg:w-80 shrink-0 space-y-2">
                {[
                  { id: 'profile', label: 'PROFİL BİLGİLERİ', icon: 'ri-user-settings-line' },
                  { id: 'account', label: 'HESAP DETAYLARI', icon: 'ri-bank-card-line' },
                  { id: 'security', label: 'GÜVENLİK', icon: 'ri-shield-keyhole-line' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-4 px-8 py-6 rounded-3xl font-black text-[10px] tracking-widest uppercase transition-all border ${activeTab === tab.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <i className={`${tab.icon} text-xl`}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 animate-slide-up">
                {activeTab === 'profile' && (
                  <div className="premium-card p-10 space-y-10">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <i className="ri-user-settings-line text-2xl"></i>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Profil Bilgilerini Düzenle</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ŞİRKET VEYA PROFİL ADI</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="premium-input h-14 px-6 text-[10px] font-black uppercase tracking-widest"
                            required
                          />
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PROFİL LOGOSU / İKONU</label>
                          <div className="flex items-center gap-6">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-2xl object-cover border border-indigo-500/30 shadow-lg shadow-indigo-500/20" />
                            ) : (
                              <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-slate-600">
                                <i className="ri-image-add-line text-2xl"></i>
                              </div>
                            )}
                            <label className="premium-button px-6 h-14 text-[8px] tracking-[0.2em] uppercase cursor-pointer hover:bg-indigo-600">
                              <span>FOTOĞRAF YÜKLE</span>
                              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SİSTEM DİLİ</label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => handleLanguageChange('tr')}
                            className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all border ${selectedLanguage === 'tr' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'
                              }`}
                          >
                            🇹🇷 TÜRKÇE
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLanguageChange('en')}
                            className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all border ${selectedLanguage === 'en' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'
                              }`}
                          >
                            🇬🇧 ENGLISH
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="premium-button w-full h-16 bg-indigo-600 hover:bg-indigo-500 border-indigo-400/30 text-[10px] font-black tracking-[0.3em] uppercase"
                      >
                        {loading ? 'YÜKLENİYOR...' : 'DEĞİŞİKLİKLERİ SİSTEME İŞLE'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="premium-card p-10 space-y-8">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <i className="ri-bank-card-line text-2xl"></i>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Hesap Detayları</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-POSTA ADRESİ</p>
                        <p className="text-xl font-black tracking-tighter text-indigo-400">{currentUser?.email}</p>
                      </div>
                      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ÜYELİK PLANI</p>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-black tracking-tighter text-emerald-400 uppercase">PREMIUM PRO AI</p>
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[8px] font-black uppercase border border-emerald-500/20">AKTİF</span>
                        </div>
                      </div>
                      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KULLANICI KİMLİĞİ</p>
                        <p className="text-xs font-mono text-slate-400">{currentUser?.id}</p>
                      </div>
                      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KAYIT TARİHİ</p>
                        <p className="text-xl font-black tracking-tighter text-slate-300">
                          {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="premium-card p-10 space-y-10">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20">
                        <i className="ri-shield-keyhole-line text-2xl"></i>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Güvenlik Ayarları</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">YENİ ŞİFRE</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="premium-input h-14 px-6 font-mono text-lg"
                            placeholder="••••••••"
                            required
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">YENİ ŞİFRE (TEKRAR)</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="premium-input h-14 px-6 font-mono text-lg"
                            placeholder="••••••••"
                            required
                          />
                        </div>
                      </div>

                      <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                        <i className="ri-information-line text-2xl text-blue-400"></i>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ŞİFRE KRİTERLERİ</p>
                          <p className="text-slate-400 text-xs font-medium">En az 6 karakter, büyük/küçük harf kombinasyonu ve en az bir özel karakter kullanmanız önerilir.</p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="premium-button w-full h-16 bg-rose-600 hover:bg-rose-500 border-rose-400/30 text-[10px] font-black tracking-[0.3em] uppercase"
                      >
                        {passwordLoading ? 'DEĞİŞTİRİLİYOR...' : 'ŞİFREYİ GÜNCELLE'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
