import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';

export default function Sidebar() {
  const location = useLocation();
  const { isPro } = useProfile();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', path: '/' },
    { id: 'cariler', label: 'Cariler', icon: 'ri-user-line', path: '/cariler' },
    { id: 'urunler', label: 'Ürünler', icon: 'ri-box-line', path: '/urunler' },
    { id: 'satis', label: 'Satış Faturası', icon: 'ri-file-text-line', path: '/satis-faturasi' },
    { id: 'alis', label: 'Alış Faturası', icon: 'ri-file-list-line', path: '/alis-faturasi' },
    { id: 'odemeler', label: 'Ödemeler', icon: 'ri-money-dollar-circle-line', path: '/odemeler' },
    { id: 'stok', label: 'Depodaki Stok', icon: 'ri-archive-line', path: '/stok' },
    { id: 'islemler', label: 'Tüm İşlemler', icon: 'ri-list-check-2', path: '/tum-islemler' },
    { id: 'raporlar', label: 'Raporlar', icon: 'ri-bar-chart-box-line', path: '/raporlar' },
    { id: 'ai-analiz', label: 'AI Finansal Analiz', icon: 'ri-magic-line', path: '/ai-analiz', pro: true },
    { id: 'pro-raporlar', label: 'Gelişmiş Raporlar', icon: 'ri-pulse-line', path: '/pro-raporlar', pro: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Muhasebe</h1>
          {isPro && (
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <i className="ri-star-fill"></i> PRO
            </span>
          )}
        </div>
      </div>
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <i className={`${item.icon} text-xl`}></i>
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                </div>
                {item.pro && (
                  isPro ? (
                    <i className="ri-star-fill text-amber-400 text-xs shadow-sm"></i>
                  ) : (
                    <i className="ri-lock-2-line text-gray-400 text-xs"></i>
                  )
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100">
        <Link
          to="/premium"
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group"
        >
          <i className="ri-vip-crown-2-line text-lg group-hover:rotate-12 transition-transform"></i>
          <span>Pro'ya Geç</span>
        </Link>
      </div>
    </aside>
  );
}
