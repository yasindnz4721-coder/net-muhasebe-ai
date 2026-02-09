/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, CreditCard,
  PlusCircle, LogOut, Settings, BarChart2, Download
} from 'lucide-react';
import {
  cariler as carilerApi,
  satisFaturalari as satisApi,
  alisFaturalari as alisApi,
  odemeler as odemelerApi,
  Cari,
  auth
} from './lib/api';
import { useProfile } from './contexts/ProfileContext';
import Sidebar from './components/feature/Sidebar';
import Header from './components/feature/Header';

interface Istatistikler {
  toplamCari: number;
  toplamSatis: number;
  toplamAlis: number;
}

const MuhasebeDashboard = () => {
  const navigate = useNavigate();
  const { selectedProfile, currentUser } = useProfile();
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [istatistikler, setIstatistikler] = useState<Istatistikler>({
    toplamCari: 0,
    toplamSatis: 0,
    toplamAlis: 0
  });
  const [todayIslemler, setTodayIslemler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!currentUser?.created_at) return;

    const timer = setInterval(() => {
      const createdAt = new Date(currentUser.created_at);
      const expiryDate = new Date(createdAt.getTime() + (365 * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, mins, secs });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  useEffect(() => {
    const veriGetir = async () => {
      if (!selectedProfile) {
        setYukleniyor(false);
        return;
      }

      try {
        setYukleniyor(true);
        setHata(null);

        // API çağrılarını paralel yapalım (performans için)
        const [cariRes, satisRes, alisRes, odemeRes] = await Promise.all([
          carilerApi.getAll(selectedProfile.id),
          satisApi.getAll(selectedProfile.id),
          alisApi.getAll(selectedProfile.id),
          odemelerApi.getAll(selectedProfile.id)
        ]);

        if (cariRes.error || satisRes.error || alisRes.error || odemeRes.error) {
          throw new Error(cariRes.error || satisRes.error || alisRes.error || odemeRes.error || "Veriler alınamadı");
        }

        const cariData = cariRes.data || [];
        const satisData = satisRes.data || [];
        const alisData = alisRes.data || [];
        const odemeData = odemeRes.data || [];

        setCariler(cariData);

        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);

        const tumIslemler: any[] = [
          ...satisData.map((f: any) => ({ ...f, type: 'Satış Faturası', amount: f.toplam, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' })),
          ...alisData.map((f: any) => ({ ...f, type: 'Alış Faturası', amount: f.toplam, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' })),
          ...odemeData.map((o: any) => ({ ...o, type: o.tip, amount: o.tutar, iconColor: o.tip === 'Tahsilat' ? 'text-blue-600' : 'text-red-600', bgColor: o.tip === 'Tahsilat' ? 'bg-blue-50' : 'bg-red-50' }))
        ].filter(item => {
          const itemDate = new Date(item.tarih);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === bugun.getTime();
        }).sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());

        // Satış toplamını hesapla
        const toplamSatis = satisData.reduce((acc: number, curr: any) =>
          acc + (Number(curr.toplam || curr.toplam_tutar || 0)), 0
        );

        const toplamAlis = alisData.reduce((acc: number, curr: any) =>
          acc + (Number(curr.toplam || curr.toplam_tutar || 0)), 0
        );

        setIstatistikler({
          toplamCari: cariData.length,
          toplamSatis: toplamSatis,
          toplamAlis: toplamAlis
        });

        // @ts-ignore
        setTodayIslemler(tumIslemler);
      } catch (error: any) {
        console.error("Veri çekme hatası:", error);
        setHata(error.message || "Sistemle iletişim kurulurken bir sorun oluştu.");
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, [selectedProfile]);

  const handleLogout = () => {
    auth.logout();
    window.location.href = '/login';
  };

  const StatCardSkeleton = () => (
    <div className="bg-white p-8 rounded-[28px] border border-gray-100 animate-skeleton overflow-hidden h-[160px]">
      <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
      <div className="h-10 w-32 bg-white/10 rounded"></div>
    </div>
  );

  const TableRowSkeleton = () => (
    <tr className="animate-skeleton">
      <td className="px-8 py-5 h-16"><div className="w-full h-4 bg-white/10 rounded"></div></td>
      <td className="px-8 py-5 h-16"><div className="w-full h-4 bg-white/10 rounded"></div></td>
      <td className="px-8 py-5 h-16"><div className="w-full h-4 bg-white/10 rounded"></div></td>
      <td className="px-8 py-5 h-16"><div className="w-full h-4 bg-white/10 rounded"></div></td>
    </tr>
  );

  if (hata) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-6 text-center font-sans text-slate-900">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
        <PlusCircle size={32} className="rotate-45" />
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Bir Sorun Oluştu</h3>
      <p className="text-slate-500 max-w-sm mb-6 mx-auto">{hata}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
      >
        TEKRAR DENE
      </button>
    </div>
  );

  if (!selectedProfile) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-6 text-center font-sans text-slate-900">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
        <Users size={32} />
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Profil Seçilmedi</h3>
      <p className="text-slate-500 max-w-sm mb-6 mx-auto">İşlem yapabilmek için lütfen bir profil seçin.</p>
    </div>
  );

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', active: true },
    { label: 'Cari Hesaplar', icon: Users, path: '/cariler' },
    { label: 'Faturalar', icon: FileText, path: '/satis-faturasi' },
    { label: 'Ödemeler', icon: CreditCard, path: '/odemeler' },
    { label: 'AI Analiz', icon: BarChart2, path: '/ai-analiz' },
    { label: 'Ayarlar', icon: Settings, path: '/profil-ayarlari' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col p-10 overflow-y-auto">
        <Header />
        <header className="flex justify-between items-center mb-12 mt-10 lg:mt-0">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3 uppercase">Pano Paneli</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] opacity-80">Finansal Verilerinizin Anlık Özeti</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/satis-faturasi')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-14 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20 font-black text-[10px] tracking-widest uppercase"
            >
              <PlusCircle size={20} /> YENİ SATIŞ EKLE
            </button>
          </div>
        </header>

        {/* Abonelik Banner (Cari Style) */}
        {timeLeft.days <= 14 && (
          <div className="bg-rose-600 rounded-[32px] p-10 mb-12 relative overflow-hidden flex flex-col xl:flex-row items-center justify-between gap-10 shadow-2xl shadow-rose-500/30 text-white group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors"></div>

            <div className="flex flex-col lg:flex-row items-center gap-10 z-10">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-4xl font-black border border-white/20 shadow-lg">{timeLeft.days}</div>
                  <span className="text-[9px] font-black uppercase mt-3 opacity-60 tracking-widest">GÜN</span>
                </div>
                <div className="flex flex-col items-center text-white/50 text-4xl font-thin mt-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-4xl font-black border border-white/20 shadow-lg">{timeLeft.hours}</div>
                  <span className="text-[9px] font-black uppercase mt-3 opacity-60 tracking-widest">SAAT</span>
                </div>
                <div className="flex flex-col items-center text-white/50 text-4xl font-thin mt-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-4xl font-black border border-white/20 shadow-lg">{timeLeft.mins}</div>
                  <span className="text-[9px] font-black uppercase mt-3 opacity-60 tracking-widest">DAKİKA</span>
                </div>
                <div className="flex flex-col items-center text-white/50 text-4xl font-thin mt-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-4xl font-black border border-white/20 shadow-lg">{timeLeft.secs}</div>
                  <span className="text-[9px] font-black uppercase mt-3 opacity-60 tracking-widest">SANİYE</span>
                </div>
              </div>
              <div className="text-center lg:text-left">
                <h4 className="text-3xl font-black tracking-tight leading-tight mb-3">Abonelik süreniz yakın zamanda sona erecek</h4>
                <p className="text-white/80 font-bold text-base max-w-lg">Sistemi kesintisiz kullanmaya devam edebilmek için lütfen abonelik sürenizi uzatınız.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/premium')}
              className="bg-white text-rose-600 px-10 h-16 rounded-[24px] font-black text-xs tracking-[0.1em] uppercase hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-900/40 z-10 shrink-0"
            >
              PAKETLERİ GÖR VE UZAT
            </button>
          </div>
        )}

        {/* Dinamik İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {yukleniyor ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard title="Toplam Cari" value={istatistikler.toplamCari.toString()} sub="Kayıtlı Paydaş" color="blue" />
              <StatCard title="Toplam Satış" value={`₺${istatistikler.toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} sub="Bu Ayki Ciro" color="green" />
              <StatCard title="Sistem Durumu" value="Aktif" sub="Veriler Güncel" color="indigo" isStatus />
            </>
          )}
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-slate-800">
            <h3 className="font-black uppercase tracking-widest text-xs">Bugünün İşlemleri</h3>
            <button
              onClick={() => navigate('/tum-islemler')}
              className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
            >
              Tüm İşlemleri Gör
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">İşlem</th>
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Cari</th>
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Tutar</th>
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 uppercase">
                {yukleniyor ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : todayIslemler.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">Bugün henüz işlem yapılmadı.</td></tr>
                ) : (
                  todayIslemler.map((islem, idx) => {
                    // ... existing mapping logic
                    const getTargetPage = (tip: string) => {
                      switch (tip) {
                        case 'Satış Faturası': return '/satis-faturasi';
                        case 'Alış Faturası': return '/alis-faturasi';
                        default: return '/odemeler';
                      }
                    };

                    const handleAction = (action: 'edit' | 'print') => {
                      navigate(getTargetPage(islem.type), {
                        state: {
                          action,
                          id: islem.id,
                          autoOpen: true
                        }
                      });
                    };

                    return (
                      <tr key={`${islem.type}-${islem.id}-${idx}`} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${islem.bgColor} ${islem.iconColor} flex items-center justify-center font-black text-xs transition-all uppercase`}>
                              {islem.type.substring(0, 1).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700 uppercase text-xs">{islem.type}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-slate-400 font-medium text-xs tracking-widest uppercase">{islem.cari_ad}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`font-black tabular-nums text-sm ${islem.type === 'Satış Faturası' || islem.type === 'Tahsilat' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₺{Number(islem.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleAction('print')}
                              className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                              title="Yazdır"
                            >
                              <i className="ri-printer-line"></i>
                            </button>
                            <button
                              onClick={() => handleAction('edit')}
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                              title="Düzenle"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, color, isStatus }: { title: string, value: string, sub: string, color: string, isStatus?: boolean }) => (
  <div className="bg-white p-8 rounded-[28px] border border-gray-100 transition-all group relative overflow-hidden text-slate-900 hover-glow">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500`}></span>
      {title}
    </h3>
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className={`text-4xl font-black text-slate-800 tracking-tighter ${isStatus ? 'text-blue-600' : ''}`}>{value}</p>
        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-tighter">{sub}</p>
      </div>
      {isStatus && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-100 mb-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
        </div>
      )}
    </div>
  </div>
);

export default MuhasebeDashboard;