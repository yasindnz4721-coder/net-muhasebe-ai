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
  taksitler as taksitApi,
  Cari,
  auth,
  TaksitOdeme
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
  const [istatistikler, setIstatistikler] = useState<Istatistikler>({
    toplamCari: 0,
    toplamSatis: 0,
    toplamAlis: 0
  });
  const [todayIslemler, setTodayIslemler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [upcomingTaksitler, setUpcomingTaksitler] = useState<TaksitOdeme[]>([]);

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

        // Otomatik ödeme kontrolü
        await taksitApi.checkPayments(selectedProfile.id);

        const [cariRes, satisRes, alisRes, odemeRes, taksitRes] = await Promise.all([
          carilerApi.getAll(selectedProfile.id),
          satisApi.getAll(selectedProfile.id),
          alisApi.getAll(selectedProfile.id),
          odemelerApi.getAll(selectedProfile.id),
          taksitApi.getTakip(selectedProfile.id)
        ]);

        if (cariRes.error || satisRes.error || alisRes.error || odemeRes.error) {
          throw new Error(cariRes.error || satisRes.error || alisRes.error || odemeRes.error || "Veriler alınamadı");
        }

        const cariData = cariRes.data || [];
        const satisData = satisRes.data || [];
        const alisData = alisRes.data || [];
        const odemeData = odemeRes.data || [];
        const taksitData = taksitRes.data || [];

        // Gelecek 2 günün taksitlerini filtrele
        const bugun = new Date();
        const ikiGunSonra = new Date();
        ikiGunSonra.setDate(bugun.getDate() + 7);

        const upcoming = taksitData.filter(t => {
          const vade = new Date(t.vade_tarihi);
          return t.durum === 'Bekliyor' && vade >= bugun && vade <= ikiGunSonra;
        });
        setUpcomingTaksitler(upcoming);

        bugun.setHours(0, 0, 0, 0);

        const tumIslemler: any[] = [
          ...satisData.map((f: any) => ({ ...f, type: 'Satış Faturası', amount: f.toplam, iconColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10' })),
          ...alisData.map((f: any) => ({ ...f, type: 'Alış Faturası', amount: f.toplam, iconColor: 'text-orange-400', bgColor: 'bg-orange-500/10' })),
          ...odemeData.map((o: any) => ({ ...o, type: o.tip, amount: o.tutar, iconColor: o.tip === 'Tahsilat' ? 'text-blue-400' : 'text-red-400', bgColor: o.tip === 'Tahsilat' ? 'bg-blue-500/10' : 'bg-red-500/10' }))
        ].filter(item => {
          const itemDate = new Date(item.tarih);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === bugun.getTime();
        }).sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());

        const toplamSatis = satisData.reduce((acc: number, curr: any) => acc + (Number(curr.toplam || 0)), 0);
        const toplamAlis = alisData.reduce((acc: number, curr: any) => acc + (Number(curr.toplam || 0)), 0);

        setIstatistikler({
          toplamCari: cariData.length,
          toplamSatis: toplamSatis,
          toplamAlis: toplamAlis
        });

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

  const StatCardSkeleton = () => (
    <div className="premium-card p-10 animate-skeleton h-[180px]">
      <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
      <div className="h-10 w-32 bg-white/10 rounded"></div>
    </div>
  );

  const TableRowSkeleton = () => (
    <tr className="animate-skeleton">
      <td className="px-10 py-6 h-20"><div className="w-full h-4 bg-white/10 rounded"></div></td>
      <td className="px-10 py-6 h-20"><div className="w-full h-4 bg-white/10 rounded"></div></td>
      <td className="px-10 py-6 h-20"><div className="w-full h-4 bg-white/10 rounded"></div></td>
      <td className="px-10 py-6 h-20"><div className="w-full h-4 bg-white/10 rounded"></div></td>
    </tr>
  );

  const StatCard = ({ title, value, sub, color, icon: Icon }: any) => (
    <div className="premium-card p-10 group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden h-[180px] flex flex-col justify-between">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-${color}-500/10 transition-colors`}></div>
      <div className="relative z-10 flex justify-between items-start">
        <div className={`w-14 h-14 bg-${color}-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-${color}-500/20 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={24} className={`text-${color}-400`} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight opacity-60">{sub}</p>
      </div>
    </div>
  );

  if (hata) return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#020617] p-6 text-center font-sans text-white">
      <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
        <PlusCircle size={40} className="rotate-45" />
      </div>
      <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Bir Sorun Oluştu</h3>
      <p className="text-slate-400 max-w-sm mb-8 font-medium">{hata}</p>
      <button onClick={() => window.location.reload()} className="premium-button px-10 h-14 tracking-widest uppercase">TEKRAR DENE</button>
    </div>
  );

  if (!selectedProfile) return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#020617] p-6 text-center font-sans text-white">
      <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
        <Users size={40} />
      </div>
      <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Profil Seçilmedi</h3>
      <p className="text-slate-400 max-w-sm mb-8 font-medium">İşlem yapabilmek için lütfen bir profil seçin.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar />

        <div className="flex-1 flex flex-col p-10 overflow-y-auto max-w-full">
          <Header />
          <header className="flex justify-between items-center mb-12 mt-10 lg:mt-0">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-3 uppercase">Sistem <span className="text-gradient">Özeti.</span></h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] opacity-80">Finansal Verilerinizin Anlık Durumu</p>
            </div>
            <button onClick={() => navigate('/satis-faturasi')} className="premium-button px-8 h-14 tracking-widest uppercase flex items-center gap-3">
              <PlusCircle size={20} /> YENİ SATIŞ
            </button>
          </header>

          {upcomingTaksitler.length > 0 && (
            <div className="mb-12 animate-slide-down">
              <div className="premium-card p-6 bg-orange-500/5 border-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/30">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Taksit <span className="text-orange-400">Hatırlatıcı.</span></h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Ödeme vadesi yaklaşan {upcomingTaksitler.length} işleminiz var.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/taksit-takibi')}
                    className="bg-orange-500 text-white font-black text-[10px] tracking-widest px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors uppercase"
                  >
                    ÖDEMELERİ GÖR
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {yukleniyor ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard title="Paydaşlar" value={istatistikler.toplamCari.toString()} sub="Kayıtlı Cari Hesap" color="blue" icon={Users} />
                <StatCard title="Toplam Satış" value={`₺${istatistikler.toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} sub="Brüt Ciro (Tümü)" color="emerald" icon={FileText} />
                <StatCard title="Toplam Alış" value={`₺${istatistikler.toplamAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} sub="Gider Toplamı" color="orange" icon={Download} />
                <StatCard title="Sistem Durumu" value="Aktif" sub="Bulut Senkronizasyonu" color="indigo" icon={BarChart2} />
              </>
            )}
          </div>

          <div className="premium-card overflow-hidden">
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Güncel İşlemler</h3>
              <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest rounded-full uppercase">BUGÜN</div>
            </div>
            <div className="overflow-x-auto h-[450px] custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-[#020617] shadow-sm">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İŞLEM</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CARİ</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">TUTAR</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">SAAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {todayIslemler.length === 0 ? (
                    <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs opacity-50">Bugün henüz bir işlem kaydedilmedi.</td></tr>
                  ) : (
                    todayIslemler.map((islem: any, index: number) => (
                      <tr key={index} className="group hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => navigate(islem.type === 'Satış Faturası' ? '/satis-faturasi' : islem.type === 'Alış Faturası' ? '/alis-faturasi' : '/odemeler')}>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${islem.bgColor} ${islem.iconColor}`}>
                              <i className={islem.type === 'Satış Faturası' ? 'ri-arrow-left-up-line' : islem.type === 'Alış Faturası' ? 'ri-arrow-right-down-line' : 'ri-exchange-line'}></i>
                            </div>
                            <span className="font-black text-white text-xs tracking-tight uppercase">{islem.type}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-slate-300 font-black text-sm uppercase">{islem.cari_ad}</td>
                        <td className="px-10 py-6 text-right">
                          <span className={`text-lg font-black tracking-tighter ${islem.iconColor.includes('emerald') ? 'text-emerald-400' : islem.iconColor.includes('orange') ? 'text-orange-400' : 'text-blue-400'}`}>
                            ₺{Number(islem.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-slate-500 text-[10px] uppercase tracking-widest">
                          {new Date(islem.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuhasebeDashboard;