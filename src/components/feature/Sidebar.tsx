import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';

interface SidebarProps {
  mbOpen?: boolean;
  setMbOpen?: (open: boolean) => void;
}

export default function Sidebar({ mbOpen, setMbOpen }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  // Menü her sayfa değiştiğinde otomatik kapansın
  useEffect(() => {
    setIsOpen(false);
    if (setMbOpen) setMbOpen(false);
  }, [location.pathname]);

  const sidebarOpen = mbOpen !== undefined ? mbOpen : isOpen;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line', path: '/' },
    { id: 'cariler', label: 'Cariler', icon: 'ri-team-line', path: '/cariler' },
    { id: 'urunler', label: 'Ürünlerimiz', icon: 'ri-box-3-line', path: '/urunler' },
    { id: 'satis', label: 'Satış Faturaları', icon: 'ri-file-text-line', path: '/satis-faturasi' },
    { id: 'alis', label: 'Alış Faturaları', icon: 'ri-file-list-3-line', path: '/alis-faturasi' },
    { id: 'odemeler', label: 'Kasa & Ödemeler', icon: 'ri-wallet-3-line', path: '/odemeler' },
    { id: 'stok', label: 'Stok Takibi', icon: 'ri-archive-line', path: '/stok' },
    { id: 'islemler', label: 'İşlem Geçmişi', icon: 'ri-history-line', path: '/tum-islemler' },
    { id: 'raporlar', label: 'Finansal Raporlar', icon: 'ri-pie-chart-2-line', path: '/raporlar' },
    { id: 'ai-analiz', label: 'AI Akıllı Analiz', icon: 'ri-sparkling-2-line', path: '/ai-analiz' },
    { id: 'admin', label: 'Yönetici Paneli', icon: 'ri-settings-5-line', path: '/admin', adminOnly: true },
  ];

  const handleToggle = () => {
    if (setMbOpen) {
      setMbOpen(!mbOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button - Global Trigger */}
      <button
        onClick={handleToggle}
        className="lg:hidden fixed top-4 left-4 z-[70] w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-90 transition-all border border-indigo-400/30"
      >
        <i className={sidebarOpen ? "ri-close-line text-2xl" : "ri-menu-2-fill text-2xl"}></i>
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-[55] animate-fade-in"
          onClick={handleToggle}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#020617] border-r border-white/5 
        overflow-y-auto z-[60] transition-all duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-indigo-600/10' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 mt-12 lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="ri-file-list-3-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">Net Muhasebe AI</h1>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">netmuhasebe.net.tr</span>
            </div>
          </div>
        </div>

        <nav className="px-4 py-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isHidden = item.adminOnly && !isAdmin;

            if (isHidden) return null;

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => {
                  setIsOpen(false);
                  if (setMbOpen) setMbOpen(false);
                }}
                className={`
                  flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${isActive
                    ? 'bg-indigo-600/10 text-white border border-white/10'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                )}

                <i className={`${item.icon} text-xl ${isActive ? 'text-indigo-400' : 'group-hover:scale-110 group-hover:text-indigo-400 transition-all'}`}></i>
                <span className={`font-bold text-sm tracking-tight ${isActive ? 'translate-x-1 transition-transform' : ''}`}>{item.label}</span>

                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-8">
          <div className="p-5 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 relative overflow-hidden group hover:bg-indigo-600/10 transition-colors">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-600/10 blur-[40px] rounded-full group-hover:bg-indigo-600/20 transition-all"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Teknik Destek</p>
            <a
              href="tel:5347401256"
              className="flex items-center gap-3 text-white font-bold group-hover:translate-x-1 transition-transform"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <i className="ri-phone-fill text-sm"></i>
              </div>
              <span className="text-sm">534 740 12 56</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
