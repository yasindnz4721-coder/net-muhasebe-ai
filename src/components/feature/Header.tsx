import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProfileSelector from './ProfileSelector';
import { auth } from '../../lib/api';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  const currentLanguage = i18n.language === 'tr' ? 'TR' : 'EN';

  const handleLogout = async () => {
    await auth.logout();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="bg-[#020617] border-b border-white/5 sticky top-0 z-40 px-8 py-4 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <ProfileSelector />
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sistem Aktif</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Language Selection */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all font-bold text-xs"
              >
                {currentLanguage}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-3 w-40 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-slide-up">
                  <button onClick={() => changeLanguage('tr')} className="w-full px-5 py-3 text-left text-sm hover:bg-indigo-600/20 flex items-center gap-3 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Türkçe
                  </button>
                  <button onClick={() => changeLanguage('en')} className="w-full px-5 py-3 text-left text-sm hover:bg-indigo-600/20 flex items-center gap-3 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> English
                  </button>
                </div>
              )}
            </div>

            <button className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all relative">
              <i className="ri-notification-3-line text-slate-400"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>

            <div className="h-8 w-px bg-white/5 mx-2"></div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
              >
                <i className="ri-user-smile-line text-xl text-white"></i>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl py-3 z-50 animate-slide-up overflow-hidden">
                  <div className="px-5 py-3 mb-2 border-b border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kullanıcı Paneli</p>
                  </div>
                  <button onClick={() => navigate('/profil-ayarlari')} className="w-full px-5 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-4 transition-colors">
                    <i className="ri-settings-4-line text-lg text-indigo-400"></i> {t('settings')}
                  </button>
                  <button onClick={() => setShowLogoutModal(true)} className="w-full px-5 py-3 text-left text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-4 transition-colors">
                    <i className="ri-logout-circle-r-line text-lg"></i> Güvenli Çıkış
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="premium-card p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i className="ri-logout-box-r-line text-4xl text-red-500"></i>
            </div>
            <h3 className="text-2xl font-black mb-3">Seni özleyeceğiz!</h3>
            <p className="text-slate-400 font-medium mb-10">
              Oturumunuzu sonlandırmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
              >
                İptal Et
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all uppercase tracking-widest text-xs"
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
