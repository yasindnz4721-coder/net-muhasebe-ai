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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = useState('');
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
      setLogoFile(file);
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
      let logoUrl = selectedProfile.logo_url;

      // Logo yükleme işlemi backend'de ele alınmalı veya base64 string olarak gönderilmeli
      // Şimdilik sadece text alanı güncelliyoruz, logo için backend desteği eklenmeli

      const { error } = await profiles.update(profileName, logoUrl);

      if (error) throw new Error(error);

      await refreshProfiles();
      setMessage({ type: 'success', text: t('profileUpdatedSuccess') });
      setLogoFile(null);
    } catch (error: any) {
      console.error('Profil güncellenirken hata:', error);
      setMessage({ type: 'error', text: error.message || t('profileUpdateError') });
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
      setCurrentPassword('');
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
    setMessage({ type: 'success', text: 'Dil başarıyla değiştirildi!' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('settings')}</h1>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <i className="ri-user-settings-line mr-2"></i>
                    Profil Bilgileri
                  </button>
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'account'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <i className="ri-account-circle-line mr-2"></i>
                    Hesap Bilgileri
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <i className="ri-lock-password-line mr-2"></i>
                    Güvenlik
                  </button>
                </nav>
              </div>
            </div>

            {/* Mesaj */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
              >
                <div className="flex items-center">
                  <i className={`${message.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-xl mr-2`}></i>
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            {/* Profil Bilgileri Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profil Bilgilerini Düzenle</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şirket Adı
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                        />
                      )}
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                        <i className="ri-upload-2-line mr-2"></i>
                        {logoPreview ? 'Logoyu Değiştir' : 'Logo Yükle'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dil Seçimi
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('tr')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedLanguage === 'tr'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        🇹🇷 Türkçe
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('en')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedLanguage === 'en'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line mr-2"></i>
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Hesap Bilgileri Tab */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Hesap Bilgileri</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">E-posta Adresi</p>
                      <p className="text-base font-medium text-gray-900">{currentUser?.email}</p>
                    </div>
                    <i className="ri-mail-line text-2xl text-gray-400"></i>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Kullanıcı ID</p>
                      <p className="text-base font-mono text-gray-900">{currentUser?.id}</p>
                    </div>
                    <i className="ri-fingerprint-line text-2xl text-gray-400"></i>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Hesap Oluşturma Tarihi</p>
                      <p className="text-base font-medium text-gray-900">
                        {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('tr-TR') : '-'}
                      </p>
                    </div>
                    <i className="ri-calendar-line text-2xl text-gray-400"></i>
                  </div>
                </div>
              </div>
            )}

            {/* Güvenlik Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Şifre Değiştir</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre (Tekrar)
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Şifrenizi tekrar girin"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <i className="ri-information-line text-blue-500 text-xl mr-3 flex-shrink-0"></i>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Güvenli Şifre Önerileri:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>En az 6 karakter kullanın</li>
                          <li>Büyük ve küçük harf karışımı kullanın</li>
                          <li>Rakam ve özel karakter ekleyin</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {passwordLoading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Değiştiriliyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-lock-password-line mr-2"></i>
                        Şifreyi Değiştir
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
