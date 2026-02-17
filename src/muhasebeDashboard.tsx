/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, CreditCard,
  PlusCircle, LogOut, Settings, BarChart2, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as api from './lib/api';
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
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [excelDates, setExcelDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);

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

  const handleExcelExport = async () => {
    if (!selectedProfile) return;
    try {
      setExporting(true);
      const start = new Date(excelDates.startDate);
      const end = new Date(excelDates.endDate);
      end.setHours(23, 59, 59, 999);

      const [
        { data: satislar },
        { data: alislar },
        { data: giderler },
        { data: odemeler },
        { data: stokHareketi },
        { data: personeller }
      ] = await Promise.all([
        api.satisFaturalari.getAll(selectedProfile.id),
        api.alisFaturalari.getAll(selectedProfile.id),
        api.giderler.getAll(selectedProfile.id),
        api.odemeler.getAll(selectedProfile.id),
        api.stokHareketleri.getAll(selectedProfile.id),
        api.personel.getAll(selectedProfile.id)
      ]);

      const dateFilter = (item: any) => {
        const d = new Date(item.tarih);
        return d >= start && d <= end;
      };

      const fSatislar = (satislar || []).filter(dateFilter);
      const fAlislar = (alislar || []).filter(dateFilter);
      const fGiderler = (giderler || []).filter(dateFilter);
      const fOdemeler = (odemeler || []).filter(dateFilter);
      const fUretim = (stokHareketi || []).filter(h => h.hareket_tipi === 'Üretim' && dateFilter(h));

      const toplamSatis = fSatislar.reduce((sum, f) => sum + Number(f.toplam), 0);
      const toplamAlis = fAlislar.reduce((sum, f) => sum + Number(f.toplam), 0);
      const toplamGider = fGiderler.reduce((sum, g) => sum + Number(g.tutar), 0);
      const toplamPersonel = (personeller || []).reduce((sum, p) => sum + Number(p.maas || 0), 0);

      const netKar = toplamSatis - (toplamAlis + toplamGider + toplamPersonel);

      const ozetData = [
        ['Net Kar Raporu', `${excelDates.startDate} - ${excelDates.endDate}`],
        [],
        ['KALEM', 'TUTAR (TL)'],
        ['TOPLAM SATIŞ', toplamSatis],
        ['TOPLAM ALIŞ', toplamAlis],
        ['TOPLAM GİDER', toplamGider],
        ['PERSONEL MALİYETİ', toplamPersonel],
        [],
        ['NET KÂR / ZARAR', netKar]
      ];

      const satislarSheet = fSatislar.map(f => ({
        'Fatura No': f.fatura_no,
        'Cari': f.cari_ad,
        'Tarih': new Date(f.tarih).toLocaleDateString('tr-TR'),
        'Tutar': f.tutar,
        'KDV': f.kdv,
        'Toplam': f.toplam
      }));

      const alislarSheet = fAlislar.map(f => ({
        'Fatura No': f.fatura_no,
        'Cari': f.cari_ad,
        'Tarih': new Date(f.tarih).toLocaleDateString('tr-TR'),
        'Tutar': f.tutar,
        'KDV': f.kdv,
        'Toplam': f.toplam
      }));

      const giderlerSheet = fGiderler.map(g => ({
        'Kategori': g.kategori_ad,
        'Açıklama': g.aciklama,
        'Tarih': new Date(g.tarih).toLocaleDateString('tr-TR'),
        'Tutar': g.tutar
      }));

      const uretimSheet = fUretim.map(u => ({
        'Ürün': u.urun_ad,
        'Miktar': u.miktar,
        'Tarih': new Date(u.tarih).toLocaleDateString('tr-TR'),
        'Açıklama': u.aciklama
      }));

      const odemelerSheet = fOdemeler.map(o => ({
        'Tip': o.tip,
        'Cari': o.cari_ad,
        'Tarih': new Date(o.tarih).toLocaleDateString('tr-TR'),
        'Tutar': o.tutar,
        'Yöntem': o.odeme_yontemi,
        'Açıklama': o.aciklama
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ozetData), 'Özet');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(satislarSheet), 'Satışlar');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alislarSheet), 'Alışlar');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(giderlerSheet), 'Giderler');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(uretimSheet), 'Üretim');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(odemelerSheet), 'Ödemeler');

      XLSX.writeFile(wb, `Net_Muhasebe_Rapor_${excelDates.startDate}_${excelDates.endDate}.xlsx`);
      setShowExcelModal(false);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Rapor olusturulurken bir hata olustu.');
    } finally {
      setExporting(false);
    }
  };

  const handlePdfExport = async () => {
    if (!selectedProfile) return;
    try {
      setExporting(true);
      const start = new Date(excelDates.startDate);
      const end = new Date(excelDates.endDate);
      end.setHours(23, 59, 59, 999);

      const [
        { data: satislar },
        { data: alislar },
        { data: giderler },
        { data: odemeler },
        { data: stokHareketi },
        { data: personeller }
      ] = await Promise.all([
        api.satisFaturalari.getAll(selectedProfile.id),
        api.alisFaturalari.getAll(selectedProfile.id),
        api.giderler.getAll(selectedProfile.id),
        api.odemeler.getAll(selectedProfile.id),
        api.stokHareketleri.getAll(selectedProfile.id),
        api.personel.getAll(selectedProfile.id)
      ]);

      const dateFilter = (item: any) => {
        const d = new Date(item.tarih);
        return d >= start && d <= end;
      };

      const fSatislar = (satislar || []).filter(dateFilter);
      const fAlislar = (alislar || []).filter(dateFilter);
      const fGiderler = (giderler || []).filter(dateFilter);

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('NET MUHASEBE AI - FINANSAL RAPOR', 14, 22);
      doc.setFontSize(11);
      doc.text(`Donem: ${excelDates.startDate} - ${excelDates.endDate}`, 14, 30);

      const toplamSatis = fSatislar.reduce((sum, f) => sum + Number(f.toplam), 0);
      const toplamAlis = fAlislar.reduce((sum, f) => sum + Number(f.toplam), 0);
      const toplamGider = fGiderler.reduce((sum, g) => sum + Number(g.tutar), 0);
      const toplamPersonel = (personeller || []).reduce((sum, p) => sum + Number(p.maas || 0), 0);
      const netKar = toplamSatis - (toplamAlis + toplamGider + toplamPersonel);

      autoTable(doc, {
        startY: 40,
        head: [['KALEM', 'TUTAR (TL)']],
        body: [
          ['TOPLAM SATIŞ', toplamSatis.toLocaleString('tr-TR') + ' TL'],
          ['TOPLAM ALIŞ', toplamAlis.toLocaleString('tr-TR') + ' TL'],
          ['TOPLAM GİDER', toplamGider.toLocaleString('tr-TR') + ' TL'],
          ['PERSONEL MALİYETİ', toplamPersonel.toLocaleString('tr-TR') + ' TL'],
          ['NET KÂR / ZARAR', netKar.toLocaleString('tr-TR') + ' TL']
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.addPage();
      doc.text('SATIŞ FATURALARI DETAYI', 14, 22);
      autoTable(doc, {
        startY: 30,
        head: [['Fatura No', 'Cari', 'Tarih', 'Toplam']],
        body: fSatislar.map(f => [f.fatura_no, f.cari_ad, new Date(f.tarih).toLocaleDateString('tr-TR'), f.toplam.toLocaleString('tr-TR') + ' TL']),
      });

      doc.save(`Net_Muhasebe_Rapor_${excelDates.startDate}_${excelDates.endDate}.pdf`);
      setShowExcelModal(false);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Rapor olusturulurken bir hata olustu.');
    } finally {
      setExporting(false);
    }
  };

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
            <div className="flex gap-4">
              <button
                onClick={() => { setExportType('excel'); setShowExcelModal(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3"
              >
                <i className="ri-file-excel-2-line text-xl"></i> EXCEL
              </button>
              <button
                onClick={() => { setExportType('pdf'); setShowExcelModal(true); }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-8 h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3"
              >
                <i className="ri-file-pdf-line text-xl"></i> PDF
              </button>
              <button onClick={() => navigate('/satis-faturasi')} className="premium-button px-8 h-14 tracking-widest uppercase flex items-center gap-3">
                <PlusCircle size={20} /> YENİ SATIŞ
              </button>
            </div>
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
                          {(() => {
                            const d = new Date(islem.tarih);
                            // TR saatiyle tam 03:00:00 ise (UTC 00:00:00), bu muhtemelen saat bilgisi girilmemiş eski bir kayıttır.
                            if (d.getHours() === 3 && d.getMinutes() === 0 && d.getSeconds() === 0) {
                              return "--:--";
                            }
                            return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                          })()}
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
      {showExcelModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 md:p-12 w-full max-w-xl shadow-2xl animate-scale shadow-indigo-500/10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Rapor Oluştur</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tarih aralığı seçerek {exportType.toUpperCase()} raporunuzu indirin.</p>
              </div>
              <button onClick={() => setShowExcelModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                <PlusCircle className="rotate-45" size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={excelDates.startDate}
                  onChange={(e) => setExcelDates({ ...excelDates, startDate: e.target.value })}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={excelDates.endDate}
                  onChange={(e) => setExcelDates({ ...excelDates, endDate: e.target.value })}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={exportType === 'excel' ? handleExcelExport : handlePdfExport}
              disabled={exporting}
              className={`w-full h-16 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${exportType === 'excel' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                } text-white disabled:opacity-50`}
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  HAZIRLANIYOR...
                </>
              ) : (
                <>
                  <i className={exportType === 'excel' ? 'ri-file-excel-2-line text-xl' : 'ri-file-pdf-line text-xl'}></i>
                  RAPORU İNDİR
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MuhasebeDashboard;