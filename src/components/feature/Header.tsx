import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProfileSelector from './ProfileSelector';
import { auth } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = useProfile();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  const currentLanguage = i18n.language === 'tr' ? 'TR' : 'EN';

  const handleLogout = async () => {
    await auth.logout();
    window.location.href = '/login';
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    navigate('/profil-ayarlari');
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ProfileSelector />
              {isPro && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full shadow-sm animate-pulse">
                  <i className="ri-vip-diamond-fill text-amber-500"></i>
                  <span className="text-[10px] font-black text-amber-700 tracking-wider">PREMIUM MODE</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-gray-700">{currentLanguage}</span>
                </button>

                {showLangMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLangMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => changeLanguage('tr')}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 ${i18n.language === 'tr' ? 'text-teal-600 font-semibold' : 'text-gray-600'
                          }`}
                      >
                        <i className="ri-checkbox-circle-fill"></i>
                        Türkçe
                      </button>
                      <button
                        onClick={() => changeLanguage('en')}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 ${i18n.language === 'en' ? 'text-teal-600 font-semibold' : 'text-gray-600'
                          }`}
                      >
                        <i className="ri-checkbox-circle-fill"></i>
                        English
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-notification-3-line text-xl text-gray-600"></i>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg cursor-pointer"
                >
                  <i className="ri-user-line text-xl text-white"></i>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={handleSettingsClick}
                        className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <i className="ri-settings-3-line"></i>
                        {t('settings')}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Çıkış Butonu */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Çıkış Yap"
              >
                <i className="ri-logout-box-line text-xl"></i>
                <span className="text-sm font-medium">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Çıkış Onay Modalı */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-logout-box-line text-3xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Çıkış Yapmak İstiyor Musunuz?
              </h3>
              <p className="text-gray-600 text-sm">
                Çıkış yaptığınızda tekrar giriş yapmanız gerekecek.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                İptal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
