import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import * as api from '../../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
  Legend
} from 'recharts';

interface DashboardStats {
  toplamCari: number;
  toplamUrun: number;
  bekleyenSatisFaturasi: number;
  bekleyenAlisFaturasi: number;
  toplamAlacak: number;
  toplamBorc: number;
  aylikSatis: number;
  aylikAlis: number;
  toplamSatisFaturalari: number;
  toplamAlisFaturalari: number;
  toplamTahsilat: number;
  toplamTediye: number;
  gunlukSatis: number;
  gunlukTahsilat: number;
  gunlukNetKasa: number;
  aylikKarZarar: number;
  enCokGelirMusteri: string;
  aylikTrend: any[];
  sonIslemler: any[];
  tahminlemeData?: any[];
  aiHealthScore?: number;
  cariOran?: number;
  tahsilatVerimi?: number;
}

export default function HomePage() {
  const { selectedProfile, isPro } = useProfile();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    toplamCari: 0,
    toplamUrun: 0,
    bekleyenSatisFaturasi: 0,
    bekleyenAlisFaturasi: 0,
    toplamAlacak: 0,
    toplamBorc: 0,
    aylikSatis: 0,
    aylikAlis: 0,
    toplamSatisFaturalari: 0,
    toplamAlisFaturalari: 0,
    toplamTahsilat: 0,
    toplamTediye: 0,
    gunlukSatis: 0,
    gunlukTahsilat: 0,
    gunlukNetKasa: 0,
    aylikKarZarar: 0,
    enCokGelirMusteri: '-',
    aylikTrend: [],
    sonIslemler: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [excelDates, setExcelDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (selectedProfile) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [selectedProfile]);

  const loadStats = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      setError(null);

      const [
        { data: cariler },
        { data: urunler },
        { data: satisFaturalari },
        { data: alisFaturalari },
        { data: odemeler },
        { data: personeller },
      ] = await Promise.all([
        api.cariler.getAll(selectedProfile.id),
        api.urunler.getAll(selectedProfile.id),
        api.satisFaturalari.getAll(selectedProfile.id),
        api.alisFaturalari.getAll(selectedProfile.id),
        api.odemeler.getAll(selectedProfile.id),
        api.personel.getAll(selectedProfile.id),
      ]);

      const bekleyenSatis = satisFaturalari?.filter((f: any) => f.durum === 'Onaylandı')?.length || 0;
      const bekleyenAlis = alisFaturalari?.filter((f: any) => f.durum === 'Onaylandı')?.length || 0;

      const toplamSatisFaturalari = satisFaturalari?.reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0) || 0;
      const toplamAlisFaturalari = alisFaturalari?.reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0) || 0;

      const tahsilatlar = odemeler?.filter((o: any) => o.tip === 'Tahsilat').reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0) || 0;
      const tediyeler = odemeler?.filter((o: any) => o.tip === 'Tediye').reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0) || 0;

      const netAlacak = toplamSatisFaturalari - tahsilatlar;
      const netBorc = toplamAlisFaturalari - tediyeler;

      const buAy = new Date().getMonth();
      const buYil = new Date().getFullYear();

      const aylikSatisToplam = (satisFaturalari || [])
        .filter((f: any) => {
          const faturaTarih = new Date(f.tarih);
          return faturaTarih.getMonth() === buAy && faturaTarih.getFullYear() === buYil;
        })
        .reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

      const aylikAlisToplam = (alisFaturalari || [])
        .filter((f: any) => {
          const faturaTarih = new Date(f.tarih);
          return faturaTarih.getMonth() === buAy && faturaTarih.getFullYear() === buYil;
        })
        .reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);

      const gunlukSatisToplam = (satisFaturalari || [])
        .filter((f: any) => {
          const faturaTarih = new Date(f.tarih);
          faturaTarih.setHours(0, 0, 0, 0);
          return faturaTarih.getTime() === bugun.getTime();
        })
        .reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

      const gunlukTahsilatToplam = (odemeler || [])
        .filter((o: any) => {
          if (o.tip !== 'Tahsilat') return false;
          const odemeTarih = new Date(o.tarih);
          odemeTarih.setHours(0, 0, 0, 0);
          return odemeTarih.getTime() === bugun.getTime();
        })
        .reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0);

      const gunlukOdemeToplam = (odemeler || [])
        .filter((o: any) => {
          if (o.tip !== 'Ödeme') return false;
          const odemeTarih = new Date(o.tarih);
          odemeTarih.setHours(0, 0, 0, 0);
          return odemeTarih.getTime() === bugun.getTime();
        })
        .reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0);

      const gunlukNetKasa = gunlukTahsilatToplam - gunlukOdemeToplam;

      // Aylık Personel Maliyeti
      const toplamPersonelMaas = personeller?.reduce((sum: number, p: any) => sum + (Number(p.maas) || 0), 0) || 0;
      const aylikKarZararValue = aylikSatisToplam - aylikAlisToplam - toplamPersonelMaas;

      // En Çok Gelir Getiren Müşteri
      const musteriler = satisFaturalari?.reduce((acc: any, f: any) => {
        acc[f.cari_ad] = (acc[f.cari_ad] || 0) + Number(f.toplam);
        return acc;
      }, {}) || {};
      const enCokGelirMusteri = Object.entries(musteriler).sort((a: any, b: any) => b[1] - a[1])[0] || ['-', 0];

      const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const aylikTrendData = [];
      const simdi = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1);
        const ayIndex = d.getMonth();
        const yilValue = d.getFullYear();

        const satis = (satisFaturalari || []).filter((f: any) => {
          const ft = new Date(f.tarih);
          return ft.getMonth() === ayIndex && ft.getFullYear() === yilValue;
        }).reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

        const alis = (alisFaturalari || []).filter((f: any) => {
          const ft = new Date(f.tarih);
          return ft.getMonth() === ayIndex && ft.getFullYear() === yilValue;
        }).reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

        aylikTrendData.push({ name: aylar[ayIndex], satis, alis });
      }

      const islemler = [
        ...(satisFaturalari || []).map((f: any) => ({ ...f, tur: 'Satış Faturası', simge: 'ri-file-text-line', renk: 'text-green-600', bg: 'bg-green-50' })),
        ...(alisFaturalari || []).map((f: any) => ({ ...f, tur: 'Alış Faturası', simge: 'ri-file-list-line', renk: 'text-orange-600', bg: 'bg-orange-50' })),
        ...(odemeler || []).map((o: any) => ({
          ...o,
          tur: o.tip === 'Tahsilat' ? 'Tahsilat' : 'Ödeme',
          toplam: o.tutar,
          simge: o.tip === 'Tahsilat' ? 'ri-arrow-down-circle-line' : 'ri-arrow-up-circle-line',
          renk: o.tip === 'Tahsilat' ? 'text-blue-600' : 'text-red-600',
          bg: o.tip === 'Tahsilat' ? 'bg-blue-50' : 'bg-red-50'
        })),
      ].sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).slice(0, 10);

      setStats({
        toplamCari: cariler?.length || 0,
        toplamUrun: urunler?.length || 0,
        bekleyenSatisFaturasi: bekleyenSatis,
        bekleyenAlisFaturasi: bekleyenAlis,
        toplamAlacak: Math.max(0, netAlacak),
        toplamBorc: Math.max(0, netBorc),
        aylikSatis: aylikSatisToplam,
        aylikAlis: aylikAlisToplam,
        toplamSatisFaturalari,
        toplamAlisFaturalari,
        toplamTahsilat: tahsilatlar,
        toplamTediye: tediyeler,
        gunlukSatis: gunlukSatisToplam,
        gunlukTahsilat: gunlukTahsilatToplam,
        gunlukNetKasa: gunlukNetKasa,
        aylikKarZarar: aylikKarZararValue,
        enCokGelirMusteri: enCokGelirMusteri[0] as string,
        aylikTrend: aylikTrendData,
        sonIslemler: islemler,
        tahminlemeData: [
          ...aylikTrendData,
          { name: 'Gelecek 1', satis: aylikSatisToplam * 1.15, alis: aylikAlisToplam * 0.95, type: 'Tahmin' },
          { name: 'Gelecek 2', satis: aylikSatisToplam * 1.25, alis: aylikAlisToplam * 0.9, type: 'Tahmin' }
        ],
        aiHealthScore: Math.min(100, Math.round((netAlacak / (netBorc || 1)) * 40 + (tahsilatlar / (toplamSatisFaturalari || 1)) * 60)),
        cariOran: Number((netAlacak / (netBorc || 1)).toFixed(2)),
        tahsilatVerimi: Math.round((tahsilatlar / (toplamSatisFaturalari || 1)) * 100),
      });
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
      setError('Veriler yüklenemedi. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

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

      // Sheets data
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
      alert('Rapor oluşturulurken bir hata oluştu.');
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
      const fOdemeler = (odemeler || []).filter(dateFilter);
      const fUretim = (stokHareketi || []).filter(h => h.hareket_tipi === 'Üretim' && dateFilter(h));

      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('NET MUHASEBE AI - FINANSAL RAPOR', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Donem: ${excelDates.startDate} - ${excelDates.endDate}`, 14, 30);
      doc.text(`Olusturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 37);

      // Summary Table
      const toplamSatis = fSatislar.reduce((sum, f) => sum + Number(f.toplam), 0);
      const toplamAlis = fAlislar.reduce((sum, f) => sum + Number(f.toplam), 0);
      const toplamGider = fGiderler.reduce((sum, g) => sum + Number(g.tutar), 0);
      const toplamPersonel = (personeller || []).reduce((sum, p) => sum + Number(p.maas || 0), 0);
      const netKar = toplamSatis - (toplamAlis + toplamGider + toplamPersonel);

      autoTable(doc, {
        startY: 45,
        head: [['KALEM', 'TUTAR (TL)']],
        body: [
          ['TOPLAM SATIS', toplamSatis.toLocaleString('tr-TR') + ' TL'],
          ['TOPLAM ALIS', toplamAlis.toLocaleString('tr-TR') + ' TL'],
          ['TOPLAM GIDER', toplamGider.toLocaleString('tr-TR') + ' TL'],
          ['PERSONEL MALIYETI', toplamPersonel.toLocaleString('tr-TR') + ' TL'],
          [{ content: 'NET KAR / ZARAR', styles: { fontStyle: 'bold' } }, { content: netKar.toLocaleString('tr-TR') + ' TL', styles: { fontStyle: 'bold', textColor: netKar >= 0 ? [0, 150, 0] : [200, 0, 0] } }]
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Satislar Detail
      doc.addPage();
      doc.text('SATIS FATURALARI DETAYI', 14, 22);
      autoTable(doc, {
        startY: 30,
        head: [['Fatura No', 'Cari', 'Tarih', 'Toplam']],
        body: fSatislar.map(f => [f.fatura_no, f.cari_ad, new Date(f.tarih).toLocaleDateString('tr-TR'), f.toplam.toLocaleString('tr-TR') + ' TL']),
      });

      doc.save(`Net_Muhasebe_Rapor_${excelDates.startDate}_${excelDates.endDate}.pdf`);
      setShowExcelModal(false);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Rapor oluşturulurken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    if (exportType === 'excel') {
      handleExcelExport();
    } else {
      handlePdfExport();
    }
  };

  if (!selectedProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-user-add-line text-3xl text-yellow-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil Seçin</h3>
              <p className="text-gray-600">Profil seçmek için üst menüyü kullanın.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-48 bg-gray-200 rounded-3xl w-full"></div>
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
              </div>
              <div className="h-96 bg-gray-200 rounded-3xl w-full"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <button onClick={loadStats} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-colors cursor-pointer text-sm font-semibold">Yeniden Dene</button>
            </div>
          )}

          {/* AI Advisor */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-px shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-[31px] p-8 text-white relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <i className="ri-brain-line text-4xl text-indigo-400"></i>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">AI Live</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-black mb-2 bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">Finansal Strateji Raporu</h2>
                    <div className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                      {stats.toplamAlacak > stats.toplamBorc * 1.5
                        ? <p>İşletmeniz <strong>yüksek likidite</strong> bölgesinde. Cari oranınız (<strong>{stats.cariOran}</strong>) sektör ortalamasının üzerinde. Bu durum, önümüzdeki 3 ay için agresif büyüme fırsatı sunuyor.</p>
                        : (stats.cariOran || 0) < 1
                          ? <p><strong className="text-rose-400">Kritik Uyarı:</strong> Cari oran 1.00'in altında. Kısa vadeli nakit akışınızı güçlendirmek için tahsilatlara öncelik verin.</p>
                          : <p><strong>Dengeli Yapı:</strong> Finansal göstergeleriniz stabil. Mevcut alacak-borç dengesi büyüme hedeflerinizi destekliyor.</p>
                      }
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Cari Oran</div>
                      <div className="text-xl font-bold text-indigo-400">{stats.cariOran} <span className="text-xs font-normal opacity-50 px-1">Seviyesi</span></div>
                    </div>
                    <div className="p-4 bg-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Tahsilat Verimi</div>
                      <div className="text-xl font-bold text-emerald-400">%{stats.tahsilatVerimi} <span className="text-xs font-normal opacity-50 px-1">Başarı</span></div>
                    </div>
                    <div className="p-4 bg-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Yapay Zeka Büyüme Skoru</div>
                      <div className="text-xl font-bold text-amber-400">%{stats.aiHealthScore} <span className="text-xs font-normal opacity-50 px-1">Skor</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 shrink-0">
                  <button onClick={() => navigate('/ai-analiz')} className="group px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer">
                    STRATEJİ RAPORU
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <button
              onClick={() => { setExportType('excel'); setShowExcelModal(true); }}
              className="flex flex-col items-center gap-3 p-4 bg-emerald-600 rounded-2xl border border-emerald-500 shadow-lg hover:bg-emerald-700 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <i className="ri-file-excel-2-line text-2xl"></i>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">Excel Raporu</span>
            </button>
            <button
              onClick={() => { setExportType('pdf'); setShowExcelModal(true); }}
              className="flex flex-col items-center gap-3 p-4 bg-rose-600 rounded-2xl border border-rose-500 shadow-lg hover:bg-rose-700 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <i className="ri-file-pdf-line text-2xl"></i>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">PDF Raporu</span>
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/NetMuhasebe_AI_Kurulum.exe';
                link.download = 'NetMuhasebe_AI_Kurulum.exe';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex flex-col items-center gap-3 p-4 bg-indigo-600 rounded-2xl border border-indigo-500 shadow-lg hover:bg-indigo-700 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <i className="ri-download-cloud-2-line text-2xl"></i>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">Masaüstüne Kur</span>
            </button>

            {[
              { label: 'Satış Faturası', path: '/satis-faturasi', icon: 'ri-add-line', color: 'teal' },
              { label: 'Alış Faturası', path: '/alis-faturasi', icon: 'ri-subtract-line', color: 'orange' },
              { label: 'Ödeme/Tahsilat', path: '/odemeler', icon: 'ri-money-dollar-circle-line', color: 'blue' },
              { label: 'Yeni Cari', path: '/cariler', icon: 'ri-user-add-line', color: 'indigo' },
              { label: 'Yeni Ürün', path: '/urunler', icon: 'ri-box-line', color: 'purple' },
              { label: 'Raporlar', path: '/raporlar', icon: 'ri-bar-chart-box-line', color: 'gray' },
            ].map((action, i) => (
              <button key={i} onClick={() => navigate(action.path)} className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group cursor-pointer">
                <div className={`w-12 h-12 bg-${action.color}-50 rounded-xl flex items-center justify-center text-${action.color}-600 group-hover:bg-${action.color}-600 group-hover:text-white transition-colors`}>
                  <i className={`${action.icon} text-2xl`}></i>
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="BÜGÜNKÜ KASA DURUMU"
              value={(stats as any).gunlukNetKasa || 0}
              icon="ri-wallet-3-line"
              color={(stats as any).gunlukNetKasa < 0 ? "rose" : "teal"}
              sub="Günlük Net"
              currency="₺"
            />
            <StatCard
              label="BU AY KÂR / ZARAR"
              value={(stats as any).aylikKarZar || 0}
              icon="ri-funds-line"
              color={(stats as any).aylikKarZar < 0 ? "rose" : "emerald"}
              sub="Net Finansal"
              currency="₺"
            />
            <StatCard
              label="EN DEĞERLİ MÜŞTERİ"
              value={(stats as any).enCokGelirMusteri || '-'}
              icon="ri-vip-crown-line"
              color="indigo"
              sub="Revenue Top"
              isText
            />
            <StatCard
              label="TOPLAM ALACAK"
              value={stats.toplamAlacak}
              icon="ri-arrow-left-down-line"
              color="blue"
              sub="Kümülatif"
              currency="₺"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Gelişmiş Trend ve Tahminleme</h2>
                  <p className="text-sm text-gray-500">AI Destekli gelecek öngörüsü aktif</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-600"><span className="w-2 h-2 bg-teal-500 rounded-full"></span> Satiş</span>
                  <span className="flex items-center gap-1.5 text-orange-500"><span className="w-2 h-2 bg-orange-400 rounded-full"></span> Alış</span>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.tahminlemeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val.toLocaleString('tr-TR')} ₺`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="satis" stroke="#0d9488" strokeWidth={3} fill="#0d9488" fillOpacity={0.05} />
                    <Bar dataKey="alis" barSize={12} fill="#ea580c" radius={[4, 4, 0, 0]} />
                    <Line type="basis" dataKey="satis" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 6" dot={false} name="AI Tahmini" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <i className="ri-arrow-left-down-line absolute -bottom-6 -right-6 text-9xl opacity-10"></i>
                <h3 className="text-sm font-semibold opacity-80 mb-1">Toplam Alacak</h3>
                <p className="text-3xl font-black mb-4">{stats.toplamAlacak.toLocaleString('tr-TR')} ₺</p>
                <div className="bg-white/10 rounded-2xl p-3 text-xs flex justify-between">
                  <span>Satış Faturaları:</span>
                  <span className="font-bold">{stats.toplamSatisFaturalari.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <i className="ri-arrow-right-up-line absolute -bottom-6 -right-6 text-9xl opacity-10"></i>
                <h3 className="text-sm font-semibold opacity-80 mb-1">Toplam Borç</h3>
                <p className="text-3xl font-black mb-4">{stats.toplamBorc.toLocaleString('tr-TR')} ₺</p>
                <div className="bg-white/10 rounded-2xl p-3 text-xs flex justify-between">
                  <span>Alış Faturaları:</span>
                  <span className="font-bold">{stats.toplamAlisFaturalari.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Son İşlemler</h2>
                <button onClick={() => navigate('/tum-islemler')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">TÜMÜNÜ GÖR</button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px]">İşlem</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px]">Saat</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px]">Cari</th>
                      <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase text-[10px]">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.sonIslemler.map((islem, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${islem.bg} ${islem.renk} rounded-lg flex items-center justify-center`}><i className={islem.simge}></i></div>
                            <span className="font-semibold text-gray-700">{islem.tur}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {(() => {
                            const d = new Date(islem.tarih);
                            if (d.getHours() === 3 && d.getMinutes() === 0 && d.getSeconds() === 0) return "--:--";
                            return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </td>
                        <td className="px-6 py-4 text-gray-500 uppercase text-xs">{islem.cari_ad}</td>
                        <td className={`px-6 py-4 text-right font-bold ${islem.renk}`}>{islem.toplam.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-6">Karlılık Analizi</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Alacak', value: stats.toplamAlacak, color: '#0d9488' },
                        { name: 'Borç', value: stats.toplamBorc, color: '#e11d48' }
                      ]}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      <Cell fill="#0d9488" />
                      <Cell fill="#e11d48" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 text-[10px] font-bold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"></div> ALACAK</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> BORÇ</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Excel Tarih Seçim Modalı */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{exportType === 'excel' ? 'Excel' : 'PDF'} Raporu Oluştur</h3>
              <button onClick={() => setShowExcelModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">BAŞLANGIÇ TARİHİ</label>
                <input
                  type="date"
                  value={excelDates.startDate}
                  onChange={(e) => setExcelDates({ ...excelDates, startDate: e.target.value })}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-bold text-gray-900 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">BİTİŞ TARİHİ</label>
                <input
                  type="date"
                  value={excelDates.endDate}
                  onChange={(e) => setExcelDates({ ...excelDates, endDate: e.target.value })}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-bold text-gray-900 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`w-full h-16 ${exportType === 'excel' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'} text-white rounded-2xl font-black uppercase tracking-widest mt-4 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
              >
                {exporting ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
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
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, sub, currency = '', isText = false }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-b-4 border-b-transparent hover:border-b-indigo-500 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center`}><i className={`${icon} text-xl`}></i></div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 bg-${color}-50 text-${color}-600 rounded-lg`}>{sub}</span>
      </div>
      <div className="text-xs text-gray-400 font-bold uppercase mb-1">{label}</div>
      <div className="text-2xl font-black text-gray-900 truncate">
        {isText ? value : `${Number(value).toLocaleString('tr-TR')} ${currency}`}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur shadow-2xl border border-gray-100 rounded-xl p-4">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">{payload[0].payload.name}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-xs font-bold text-gray-700">{entry.name}:</span>
            <span className="text-xs font-black text-gray-900">{entry.value.toLocaleString('tr-TR')} ₺</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
