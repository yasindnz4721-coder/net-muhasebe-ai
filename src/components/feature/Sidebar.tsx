import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';

interface SidebarProps {
  mbOpen?: boolean;
  setMbOpen?: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  adminOnly?: boolean;
  isNew?: boolean;
  subItems?: { id: string; label: string; path: string; isNew?: boolean }[];
}

export default function Sidebar({ mbOpen, setMbOpen }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, currentUser } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Menü her sayfa değiştiğinde otomatik kapansın (mobil için)
  useEffect(() => {
    if (setMbOpen) setMbOpen(false);
  }, [location.pathname]);

  const sidebarOpen = mbOpen !== undefined ? mbOpen : isOpen;

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Anasayfa', icon: 'ri-home-4-line', path: '/dashboard' },
    {
      id: 'satis',
      label: 'Satış',
      icon: 'ri-file-list-3-line',
      subItems: [
        { id: 'satis-faturasi', label: 'Satış Faturaları', path: '/satis-faturasi' },
        { id: 'teklifler', label: 'Teklifler', path: '/teklifler' },
        { id: 'siparisler', label: 'Siparişler', path: '/satis-siparis' },
      ]
    },
    {
      id: 'alis',
      label: 'Alış',
      icon: 'ri-file-list-line',
      subItems: [
        { id: 'alis-faturasi', label: 'Alış Faturaları', path: '/alis-faturasi' },
        { id: 'alis-siparis', label: 'Siparişler', path: '/alis-siparis' },
      ]
    },
    {
      id: 'urun',
      label: 'Ürün',
      icon: 'ri-box-3-line',
      isNew: true,
      subItems: [
        { id: 'urun-listesi', label: 'Ürün Listesi', path: '/urunler' },
        { id: 'varyantlar', label: 'Ürün Varyantları', path: '/urun-varyantlari' },
        { id: 'recete', label: 'Üretim Reçetesi', path: '/uretim-recetesi' },
        { id: 'uretim', label: 'Üretim', path: '/uretim' },
        { id: 'depolar', label: 'Depo Listesi', path: '/stok' },
        { id: 'transfer', label: 'Stok Transferi', path: '/stok-transferi' },
        { id: 'karlilik', label: 'Stok Kârlılık', path: '/stok-karlilik', isNew: true },
        { id: 'ekstre', label: 'Ürün Ekstre', path: '/urun-ekstre' },
      ]
    },
    {
      id: 'finansman',
      label: 'Finansman',
      icon: 'ri-bank-card-line',
      isNew: true,
      subItems: [
        { id: 'kasalar', label: 'Kasalar', path: '/odemeler' },
        { id: 'giderler', label: 'Giderler', path: '/giderler', isNew: true },
        { id: 'bankalar', label: 'Bankalar', path: '/bankalar' },
        { id: 'cek-senet', label: 'Çek-Senet', path: '/cek-senet' },
      ]
    },
    {
      id: 'taksit',
      label: 'Taksit Takibi',
      icon: 'ri-calendar-todo-line',
      subItems: [
        { id: 'taksit-takibi', label: 'Taksit Takibi', path: '/taksit-takibi' },
        { id: 'taksitler', label: 'Taksitler', path: '/taksitler' },
      ]
    },
    { id: 'cariler', label: 'Cariler', icon: 'ri-team-line', path: '/cariler' },
    {
      id: 'raporlar',
      label: 'Raporlar',
      icon: 'ri-pie-chart-2-line',
      subItems: [
        { id: 'fatura-raporu', label: 'Fatura Raporu', path: '/raporlar' },
        { id: 'kdv-raporu', label: 'KDV Raporu', path: '/kdv-raporu' },
        { id: 'cari-ekstre', label: 'Cari Ekstre', path: '/cari-ekstre' },
        { id: 'tum-islemler', label: 'Tüm İşlemler', path: '/tum-islemler' },
      ]
    },
    {
      id: 'personel',
      label: 'Personel',
      icon: 'ri-user-star-line',
      subItems: [
        { id: 'personel-listesi', label: 'Personel Listesi', path: '/personel' },
        { id: 'zimmet', label: 'Zimmet Listesi', path: '/zimmet-listesi' },
      ]
    },
    { id: 'ai-analiz', label: 'AI Analiz', icon: 'ri-sparkling-2-line', path: '/ai-analiz' },
    { id: 'denetim', label: 'Denetim Kayıtları', icon: 'ri-shield-check-line', path: '/denetim', adminOnly: true },
    { id: 'admin', label: 'Yönetici', icon: 'ri-settings-5-line', path: '/admin', adminOnly: true },
  ];

  // Rota değiştiğinde ilgili ana menüyü otomatik aç
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems?.some(sub => sub.path === location.pathname)) {
        setExpandedMenus(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
      }
    });
  }, [location.pathname]);

  const toggleMenu = (id: string, hasSubItems: boolean) => {
    if (!hasSubItems) return;
    setExpandedMenus(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleToggle = () => {
    if (setMbOpen) {
      setMbOpen(!mbOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="lg:hidden fixed top-4 left-4 z-[70] w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-xl border border-indigo-400/30"
      >
        <i className={sidebarOpen ? "ri-close-line text-2xl" : "ri-menu-2-fill text-2xl"}></i>
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-[55] animate-fade-in"
          onClick={handleToggle}
        ></div>
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 glass-morphism border-r border-white/5 
        overflow-y-auto z-[60] transition-all duration-300 ease-out custom-scrollbar
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 backdrop-blur-2xl rounded-xl flex items-center justify-center border border-white/10 shadow-lg p-1.5">
              <img src="/logo.png" alt="İşletme Yönetim Sistemi" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">İşletme Yönetim <span className="text-indigo-400 italic font-black">SİSTEMİ</span></h1>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">KURUMSAL ZEKÂ</span>
            </div>
          </div>
        </div>

        <nav className="px-4 py-2 space-y-1">
          {menuItems.map((item) => {
            const hasSubItems = !!item.subItems?.length;
            const isExpanded = expandedMenus.includes(item.id);
            const isHidden = item.adminOnly && !isAdmin;
            const isActive = item.path ? location.pathname === item.path : item.subItems?.some(s => s.path === location.pathname);

            if (isHidden) return null;

            return (
              <div key={item.id} className="space-y-1">
                {item.path ? (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group relative ${isActive ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <i className={`${item.icon} text-xl ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`}></i>
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    {item.isNew && <span className="ml-auto bg-rose-500 text-[8px] font-black px-1.5 py-0.5 rounded-lg text-white">YENİ</span>}
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleMenu(item.id, hasSubItems)}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group relative ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <i className={`${item.icon} text-xl ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`}></i>
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {item.isNew && <span className="bg-rose-500 text-[8px] font-black px-1.5 py-0.5 rounded-lg text-white">YENİ</span>}
                      <i className={`ri-arrow-right-s-line transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}></i>
                    </div>
                  </button>
                )}

                {hasSubItems && isExpanded && (
                  <div className="pl-12 space-y-1 animate-slide-down">
                    {item.subItems?.map((sub) => (
                      <Link
                        key={sub.id}
                        to={sub.path}
                        className={`block py-2 text-[11px] font-bold transition-colors ${location.pathname === sub.path ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{sub.label}</span>
                          {sub.isNew && <span className="bg-rose-500 text-[7px] font-black px-1 py-0.5 rounded-md text-white">YENİ</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {currentUser?.subscription_status === 'trial' && currentUser?.trial_ends_at && (
          <div className="px-6 mb-4">
            <div className={`p-4 rounded-2xl border ${new Date(currentUser.trial_ends_at).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
              <div className="flex items-center gap-3 mb-2">
                <i className={`ri-flashlight-line ${new Date(currentUser.trial_ends_at).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000 ? 'text-rose-500' : 'text-indigo-400'}`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {new Date(currentUser.trial_ends_at).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000 ? 'Süre Dolmak Üzere' : 'Deneme Süresi'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-300 leading-tight">
                {Math.ceil((new Date(currentUser.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} gün kaldı. Verimli kullanım dileriz!
              </p>
            </div>
          </div>
        )}

        <div className="p-6 mt-auto space-y-3">
          <a
            href="/NetMuhasebe_AI_Kurulum.exe"
            download
            className="flex items-center gap-3 p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl hover:bg-indigo-600 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <i className="ri-download-cloud-2-line text-sm"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-tighter">Masaüstüne Kur</span>
              <span className="text-[9px] text-slate-400 group-hover:text-indigo-100 font-bold">Windows App</span>
            </div>
          </a>

          <div className="p-5 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 group hover:bg-indigo-600/10 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 opacity-60">Teknik Destek</p>
            <a href="tel:5347401256" className="flex items-center gap-3 text-white font-bold group-hover:translate-x-1 transition-transform">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
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
