/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, FileText, CreditCard,
  PlusCircle
} from 'lucide-react';
import { cariler as carilerApi, satisFaturalari as satisApi, Cari } from './lib/api';
import { useProfile } from './contexts/ProfileContext';

interface Istatistikler {
  toplamCari: number;
  toplamSatis: number;
  toplamAlis: number;
}

const MuhasebeDashboard = () => {
  const { selectedProfile } = useProfile();
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [istatistikler, setIstatistikler] = useState<Istatistikler>({
    toplamCari: 0,
    toplamSatis: 0,
    toplamAlis: 0
  });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

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
        const [cariRes, satisRes] = await Promise.all([
          carilerApi.getAll(selectedProfile.id),
          satisApi.getAll(selectedProfile.id)
        ]);

        if (cariRes.error || satisRes.error) {
          throw new Error(cariRes.error || satisRes.error || "Veriler alınamadı");
        }

        const cariData = cariRes.data || [];
        const satisData = satisRes.data || [];

        setCariler(cariData);

        // Satış toplamını hesapla
        const toplamSatis = satisData.reduce((acc: number, curr: any) =>
          acc + parseFloat(curr.toplam || curr.toplam_tutar || 0), 0
        );

        setIstatistikler({
          toplamCari: cariData.length,
          toplamSatis: toplamSatis,
          toplamAlis: 0
        });
      } catch (error: any) {
        console.error("Veri çekme hatası:", error);
        setHata(error.message || "Sistemle iletişim kurulurken bir sorun oluştu.");
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, [selectedProfile]);

  if (yukleniyor) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 gap-4 font-sans">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="font-black text-slate-400 uppercase tracking-widest text-xs">Veriler Hazırlanıyor...</div>
    </div>
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

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans antialiased text-slate-900">
      {/* Sidebar - Modern Design */}
      <div className="w-72 bg-slate-900 text-white p-8 shadow-2xl flex flex-col shrink-0">
        <div className="mb-12">
          <h1 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter leading-none">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <LayoutDashboard size={24} />
            </div>
            MUHASEBE<span className="text-blue-500 uppercase">Pro</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { label: 'Dashboard', icon: LayoutDashboard, active: true },
            { label: 'Cari Hesaplar', icon: Users, active: false },
            { label: 'Faturalar', icon: FileText, active: false },
            { label: 'Ödemeler', icon: CreditCard, active: false },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5 uppercase">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hesap Türü</p>
          <p className="text-sm font-bold text-blue-400 uppercase">Premium Plan</p>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase">Finansal Durum</h2>
            <p className="text-slate-500 font-medium tracking-tight">İşletmenizin anlık verilerine hoş geldiniz.</p>
          </div>
          <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-14 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10 font-bold text-sm uppercase">
            <PlusCircle size={20} /> YENİ İŞLEM EKLE
          </button>
        </header>

        {/* Dinamik İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard title="Toplam Cari" value={istatistikler.toplamCari.toString()} sub="Kayıtlı Paydaş" color="blue" />
          <StatCard title="Toplam Satış" value={`₺${istatistikler.toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} sub="Bu Ayki Ciro" color="green" />
          <StatCard title="Sistem Durumu" value="Aktif" sub="Veriler Güncel" color="indigo" isStatus />
        </div>

        {/* Gerçek Cari Listesi */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-slate-800">
            <h3 className="font-black uppercase tracking-widest text-xs">Son Eklenen Cariler</h3>
            <button className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">Tümünü Gör</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Cari Unvan / Adı</th>
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Vergi No</th>
                  <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Bakiye</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 uppercase">
                {cariler.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">Henüz veri bulunmuyor.</td></tr>
                ) : (
                  cariler.slice(0, 5).map((cari) => (
                    <tr key={cari.id} className="hover:bg-blue-50/30 transition-all group cursor-pointer">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all uppercase">
                            {(cari.ad || '??').substring(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-700 uppercase text-xs">{cari.ad}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-400 font-medium text-xs tracking-widest tabular-nums uppercase">{cari.vergi_no || '---'}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`font-black tabular-nums text-sm ${(parseFloat((cari.bakiye || 0).toString()) || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ₺{parseFloat((cari.bakiye || 0).toString()).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
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
  );
};

const StatCard = ({ title, value, sub, color, isStatus }: { title: string, value: string, sub: string, color: string, isStatus?: boolean }) => (
  <div className="bg-white p-8 rounded-[28px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden text-slate-900">
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