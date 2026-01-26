import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { satisFaturalari as satisApi, alisFaturalari as alisApi, odemeler as odemelerApi, SatisFaturasi, AlisFaturasi, Odeme } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function Raporlar() {
  const { selectedProfile } = useProfile();
  const [dateRange, setDateRange] = useState({
    baslangic: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    bitis: new Date().toISOString().split('T')[0]
  });

  const [satisFaturalari, setSatisFaturalari] = useState<SatisFaturasi[]>([]);
  const [alisFaturalari, setAlisFaturalari] = useState<AlisFaturasi[]>([]);
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ozet' | 'kdv' | 'gelir-gider' | 'mizan'>('ozet');

  useEffect(() => {
    if (selectedProfile) {
      loadData();
    }
  }, [selectedProfile]);

  const loadData = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);

      const { data: satisData } = await satisApi.getAll(selectedProfile.id);
      const { data: alisData } = await alisApi.getAll(selectedProfile.id);
      const { data: odemelerData } = await odemelerApi.getAll(selectedProfile.id);

      setSatisFaturalari(satisData || []);
      setAlisFaturalari(alisData || []);
      setOdemeler(odemelerData || []);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSatisFaturalari = satisFaturalari.filter(f => {
    const tarih = new Date(f.tarih);
    const baslangic = new Date(dateRange.baslangic);
    const bitis = new Date(dateRange.bitis);
    return tarih >= baslangic && tarih <= bitis;
  });

  const filteredAlisFaturalari = alisFaturalari.filter(f => {
    const tarih = new Date(f.tarih);
    const baslangic = new Date(dateRange.baslangic);
    const bitis = new Date(dateRange.bitis);
    return tarih >= baslangic && tarih <= bitis;
  });

  const filteredOdemeler = odemeler.filter(o => {
    const tarih = new Date(o.tarih);
    const baslangic = new Date(dateRange.baslangic);
    const bitis = new Date(dateRange.bitis);
    return tarih >= baslangic && tarih <= bitis;
  });

  // Mali hesaplamalar
  const toplamSatis = filteredSatisFaturalari.reduce((sum, f) => sum + f.toplam, 0);
  const toplamAlis = filteredAlisFaturalari.reduce((sum, f) => sum + f.toplam, 0);
  const toplamAlinanOdeme = filteredOdemeler.filter(o => o.tip === 'Alınan Ödeme').reduce((sum, o) => sum + o.tutar, 0);
  const toplamVerilenOdeme = filteredOdemeler.filter(o => o.tip === 'Verilen Ödeme').reduce((sum, o) => sum + o.tutar, 0);

  // KDV Hesaplamaları (Varsayılan %20)
  const kdvOrani = 0.20;
  const satisMatrah = toplamSatis / (1 + kdvOrani);
  const satisKDV = toplamSatis - satisMatrah;
  const alisMatrah = toplamAlis / (1 + kdvOrani);
  const alisKDV = toplamAlis - alisMatrah;
  const odenecekKDV = satisKDV - alisKDV;

  // Gelir-Gider Tablosu
  const brutKar = toplamSatis - toplamAlis;
  const netKar = brutKar - odenecekKDV;

  // Mizan (Cari Bazlı)
  const cariMizan: any[] = [];
  const cariMap = new Map();

  filteredSatisFaturalari.forEach(f => {
    if (!cariMap.has(f.cari_ad)) {
      cariMap.set(f.cari_ad, { borc: 0, alacak: 0 });
    }
    const cari = cariMap.get(f.cari_ad);
    cari.alacak += f.toplam;
  });

  filteredAlisFaturalari.forEach(f => {
    if (!cariMap.has(f.cari_ad)) {
      cariMap.set(f.cari_ad, { borc: 0, alacak: 0 });
    }
    const cari = cariMap.get(f.cari_ad);
    cari.borc += f.toplam;
  });

  filteredOdemeler.forEach(o => {
    if (!cariMap.has(o.cari_ad)) {
      cariMap.set(o.cari_ad, { borc: 0, alacak: 0 });
    }
    const cari = cariMap.get(o.cari_ad);
    if (o.tip === 'Alınan Ödeme') {
      cari.borc += o.tutar;
    } else {
      cari.alacak += o.tutar;
    }
  });

  cariMap.forEach((value, key) => {
    const bakiye = value.alacak - value.borc;
    cariMizan.push({
      cari: key,
      borc: value.borc,
      alacak: value.alacak,
      bakiye: bakiye,
      bakiyeTip: bakiye >= 0 ? 'Alacak' : 'Borç'
    });
  });

  // Tüm işlemleri birleştir
  const tumIslemler: any[] = [];

  filteredSatisFaturalari.forEach((f: any) => {
    tumIslemler.push({
      id: `sf-${f.id}`,
      cari: f.cari_ad,
      type: 'Satış Faturası',
      amount: parseFloat(f.toplam),
      date: f.tarih,
      status: f.durum,
      fatura_no: f.fatura_no
    });
  });

  filteredAlisFaturalari.forEach((f: any) => {
    tumIslemler.push({
      id: `af-${f.id}`,
      cari: f.cari_ad,
      type: 'Alış Faturası',
      amount: -parseFloat(f.toplam),
      date: f.tarih,
      status: f.durum,
      fatura_no: f.fatura_no
    });
  });

  filteredOdemeler.forEach((o: any) => {
    tumIslemler.push({
      id: `od-${o.id}`,
      cari: o.cari_ad,
      type: o.tip,
      amount: o.tip === 'Alınan Ödeme' ? o.tutar : -o.tutar,
      date: o.tarih,
      status: 'Tamamlandı'
    });
  });

  tumIslemler.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Excel Export
  const exportToExcel = () => {
    let csvContent = '';

    if (activeTab === 'ozet') {
      csvContent = 'Finansal Özet Raporu\n\n';
      csvContent += `Dönem,${dateRange.baslangic} - ${dateRange.bitis}\n\n`;
      csvContent += 'Toplam Satış,' + toplamSatis.toFixed(2) + '\n';
      csvContent += 'Toplam Alış,' + toplamAlis.toFixed(2) + '\n';
      csvContent += 'Brüt Kar,' + brutKar.toFixed(2) + '\n';
      csvContent += 'Ödenecek KDV,' + odenecekKDV.toFixed(2) + '\n';
      csvContent += 'Net Kar,' + netKar.toFixed(2) + '\n';
    } else if (activeTab === 'kdv') {
      csvContent = 'KDV Beyannamesi\n\n';
      csvContent += 'Satış Matrahı,' + satisMatrah.toFixed(2) + '\n';
      csvContent += 'Hesaplanan KDV,' + satisKDV.toFixed(2) + '\n';
      csvContent += 'Alış Matrahı,' + alisMatrah.toFixed(2) + '\n';
      csvContent += 'İndirilecek KDV,' + alisKDV.toFixed(2) + '\n';
      csvContent += 'Ödenecek KDV,' + odenecekKDV.toFixed(2) + '\n';
    } else if (activeTab === 'mizan') {
      csvContent = 'Cari Mizan\n\n';
      csvContent += 'Cari,Borç,Alacak,Bakiye,Durum\n';
      cariMizan.forEach(c => {
        csvContent += `${c.cari},${c.borc.toFixed(2)},${c.alacak.toFixed(2)},${Math.abs(c.bakiye).toFixed(2)},${c.bakiyeTip}\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mali-rapor-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-xs tracking-widest uppercase">Mali Raporlar Hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md animate-slide-up">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <i className="ri-bar-chart-box-line text-4xl text-indigo-500"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Seçimi Gerekli</h3>
          <p className="text-slate-400 font-medium mb-8">Raporları görüntülemek için bir profil seçmelisiniz.</p>
          <button onClick={() => window.location.reload()} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600 hover:bg-indigo-700 border-indigo-500/30">YENİDEN DENE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative text-xs">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[140px] animate-aurora-2"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[120px] animate-aurora-1"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar mbOpen={false} setMbOpen={() => { }} />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header onMenuClick={() => { }} />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <i className="ri-bar-chart-box-line"></i>
                  <span>İŞ ZEKSASI VE ANALİZ</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Mali <span className="text-gradient from-indigo-400 to-purple-500">Raporlar.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">İşletmenizin finansal performansını anlık olarak izleyin ve yasal uyum raporlarınızı hazırlayın.</p>
              </div>

              <button
                onClick={exportToExcel}
                className="premium-button px-8 h-16 text-[10px] uppercase tracking-widest group bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white"
              >
                <span>EXCEL ÜRETEREK İNDİR</span>
                <i className="ri-file-excel-line text-xl group-hover:translate-y-1 transition-transform"></i>
              </button>
            </div>

            {/* Date Filters */}
            <div className="premium-card p-8 group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
                <i className="ri-calendar-event-line text-9xl"></i>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">BAŞLANGIÇ DÖNEMİ</label>
                  <input
                    type="date"
                    value={dateRange.baslangic}
                    onChange={(e) => setDateRange({ ...dateRange, baslangic: e.target.value })}
                    className="premium-input h-14 font-black text-[10px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">BİTİŞ DÖNEMİ</label>
                  <input
                    type="date"
                    value={dateRange.bitis}
                    onChange={(e) => setDateRange({ ...dateRange, bitis: e.target.value })}
                    className="premium-input h-14 font-black text-[10px]"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={loadData}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <i className="ri-refresh-line text-lg text-indigo-400"></i>
                    <span>VERİLERİ YENİDEN HESAPLA</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-3xl max-w-4xl mx-auto">
              {[
                { id: 'ozet', label: 'FİNANSAL ÖZET', icon: 'ri-dashboard-line' },
                { id: 'kdv', label: 'KDV BEYANNAMESİ', icon: 'ri-percent-line' },
                { id: 'gelir-gider', label: 'GELİR-GİDER', icon: 'ri-line-chart-line' },
                { id: 'mizan', label: 'CARİ MİZAN', icon: 'ri-scales-line' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <i className={`${tab.icon} text-lg`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="animate-slide-up space-y-10 pb-20">
              {activeTab === 'ozet' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Stat Cards */}
                    <div className="premium-card p-10 relative overflow-hidden group border-emerald-500/10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <i className="ri-arrow-up-line text-2xl"></i>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">TOPLAM SATIŞ</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-4xl font-black tracking-tighter">₺{toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">SATIŞ GELİRLERİ TOPLAMI</p>
                      </div>
                    </div>

                    <div className="premium-card p-10 relative overflow-hidden group border-rose-500/10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                          <i className="ri-arrow-down-line text-2xl"></i>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">TOPLAM ALIŞ</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-4xl font-black tracking-tighter">₺{toplamAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">MALİYET VE GİDER TOPLAMI</p>
                      </div>
                    </div>

                    <div className="premium-card p-10 relative overflow-hidden group border-indigo-500/10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <i className="ri-wallet-3-line text-2xl"></i>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">BRÜT KAR</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-4xl font-black tracking-tighter">₺{brutKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TEVKİFAT ÖNCESİ KAZANÇ</p>
                      </div>
                    </div>

                    <div className="premium-card p-10 relative overflow-hidden group border-orange-500/10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <i className="ri-percent-line text-2xl"></i>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">ÖDENECEK KDV</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-4xl font-black tracking-tighter">₺{odenecekKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">VERGİ YÜKÜMLÜLÜĞÜ</p>
                      </div>
                    </div>

                    <div className={`premium-card p-10 relative overflow-hidden group ${netKar >= 0 ? 'border-indigo-500/30' : 'border-rose-500/30'}`}>
                      <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${netKar >= 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'
                          }`}>
                          <i className="ri-line-chart-line text-2xl"></i>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">NET KAR/ZARAR</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-4xl font-black tracking-tighter ${netKar >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                          ₺{netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DÖNEM SONU PERFORMANSI</p>
                      </div>
                    </div>

                    <div className="premium-card p-10 relative overflow-hidden group border-white/10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-slate-400 group-hover:bg-white group-hover:text-black transition-all">
                          <i className="ri-file-list-3-line text-2xl"></i>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">İŞLEM HACMİ</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-4xl font-black tracking-tighter">{tumIslemler.length}</div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOPLAM BELGE SAYISI</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-8 flex items-start gap-6 relative overflow-hidden group">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0">
                      <i className="ri-information-line text-3xl"></i>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">YASAL BİLGİLENDİRME</p>
                      <p className="text-slate-400 font-medium leading-relaxed">
                        Bu mali özet raporu, sistemdeki fatura ve ödeme kayıtlarına dayanarak oluşturulmuştur.
                        Beyannameler ve vergi hesaplamaları için resmi evraklarınızı mali müşavirinizle birlikte kontrol etmeniz gerekmektedir.
                        Veriler %20 KDV oranı baz alınarak hesaplanmıştır.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'kdv' && (
                <div className="premium-card overflow-hidden">
                  <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black uppercase tracking-tight">KDV Beyannamesi</h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">KDV FORM 2A - ÖDEME YÜKÜMLÜLÜĞÜ TABLOSU</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">%20 STANDART ORAN</div>
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İŞLEM AÇIKLAMASI</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">MATRAH (TL)</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KDV (TL)</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM (TL)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.02]">
                        <td className="px-10 py-8 font-black text-slate-300">MAL VE HİZMET SATIŞLARI (HESAPLANAN)</td>
                        <td className="px-10 py-8 text-right font-bold text-slate-400">₺{satisMatrah.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-8 text-right font-black text-emerald-400">₺{satisKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-8 text-right font-black">₺{toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="px-10 py-8 font-black text-slate-300">MAL VE HİZMET ALIŞLARI (İNDİRİLECEK)</td>
                        <td className="px-10 py-8 text-right font-bold text-slate-400">₺{alisMatrah.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-8 text-right font-black text-rose-500">₺{alisKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-8 text-right font-black">₺{toplamAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="bg-indigo-600">
                        <td className="px-10 py-10 font-black text-white text-lg">ÖDENECEK KATMA DEĞER VERGİSİ (NET)</td>
                        <td className="px-10 py-10 text-right font-black text-white/50 text-xl">—</td>
                        <td className="px-10 py-10 text-right font-black text-white text-3xl tracking-tighter">₺{odenecekKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-10 text-right font-black text-white/50 text-xl">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'gelir-gider' && (
                <div className="premium-card overflow-hidden">
                  <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Gelir-Gider Tablosu</h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">KONSOLİDE MALİ DURUM RAPORU</p>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">HESAP KALEMLERİ</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">GELİR (TL)</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">GİDER (TL)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-10 py-6 font-black text-emerald-400/80 bg-emerald-500/[0.02]">DÖNEM GELİRLERİ</td>
                        <td colSpan={2}></td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="px-16 py-5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tiçari Satış Gelirleri</td>
                        <td className="px-10 py-5 text-right font-black text-emerald-400">₺{toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-5 text-right font-black text-slate-700">—</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="px-16 py-5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cari Tahsilat Kayıtları</td>
                        <td className="px-10 py-5 text-right font-black text-emerald-400">₺{toplamAlinanOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-5 text-right font-black text-slate-700">—</td>
                      </tr>
                      <tr className="bg-emerald-500/5">
                        <td className="px-10 py-8 font-black text-white">BRÜT GELİR TOPLAMI</td>
                        <td className="px-10 py-8 text-right font-black text-emerald-400 text-xl tracking-tighter">₺{(toplamSatis + toplamAlinanOdeme).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-10 py-8 text-right font-black text-slate-700">—</td>
                      </tr>

                      <tr>
                        <td className="px-10 py-6 font-black text-rose-400/80 bg-rose-500/[0.02]">DÖNEM GİDERLERİ</td>
                        <td colSpan={2}></td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="px-16 py-5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Satın Alma ve Alış Maliyetleri</td>
                        <td className="px-10 py-5 text-right font-black text-slate-700">—</td>
                        <td className="px-10 py-5 text-right font-black text-rose-500">₺{toplamAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="px-16 py-5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Yapılan Cari Ödemeler</td>
                        <td className="px-10 py-5 text-right font-black text-slate-700">—</td>
                        <td className="px-10 py-5 text-right font-black text-rose-500">₺{toplamVerilenOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="px-16 py-5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net KDV Ödeme Yükü</td>
                        <td className="px-10 py-5 text-right font-black text-slate-700">—</td>
                        <td className="px-10 py-5 text-right font-black text-rose-500">₺{odenecekKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="bg-rose-500/5">
                        <td className="px-10 py-8 font-black text-white">BRÜT GİDER TOPLAMI</td>
                        <td className="px-10 py-8 text-right font-black text-slate-700">—</td>
                        <td className="px-10 py-8 text-right font-black text-rose-500 text-xl tracking-tighter">₺{(toplamAlis + toplamVerilenOdeme + odenecekKDV).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>

                      <tr className={`border-t-4 ${netKar >= 0 ? 'border-indigo-500 bg-indigo-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
                        <td className="px-10 py-12 font-black text-2xl tracking-tighter uppercase whitespace-nowrap">NET DÖNEM {netKar >= 0 ? 'KARI' : 'ZARARI'}</td>
                        <td colSpan={2} className={`px-10 py-12 text-right font-black text-5xl tracking-tighter ${netKar >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                          ₺{netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'mizan' && (
                <div className="premium-card overflow-hidden">
                  <div className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-white/[0.01] gap-6">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Cari Mizan</h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">CARİ HESAPLARIN BORÇ/ALACAK/BAKİYE DENGESİ</p>
                    </div>
                  </div>

                  {cariMizan.length === 0 ? (
                    <div className="p-24 text-center space-y-6">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-slate-700">
                        <i className="ri-scales-line text-5xl"></i>
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Haraket Bulunamadı</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-sm mx-auto">SEÇİLEN DÖNEMDE HİÇBİR CARİ HAREKETİ KAYDEDİLMEMİŞTİR.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CARİ HESAP ÜNVANI</th>
                            <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">BORÇ (TL)</th>
                            <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ALACAK (TL)</th>
                            <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">BAKİYE (TL)</th>
                            <th className="px-10 py-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DURUM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {cariMizan.map((cari, index) => (
                            <tr key={index} className="hover:bg-white/[0.01] transition-colors group">
                              <td className="px-10 py-6 font-black text-slate-300 uppercase tracking-tight">{cari.cari}</td>
                              <td className="px-10 py-6 text-right font-bold text-rose-500/80 group-hover:text-rose-500">₺{cari.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                              <td className="px-10 py-6 text-right font-bold text-emerald-400/80 group-hover:text-emerald-400">₺{cari.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                              <td className={`px-10 py-6 text-right font-black text-lg tracking-tighter ${cari.bakiye >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                                ₺{Math.abs(cari.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-10 py-6 text-center">
                                <span className={`inline-block px-4 py-2 rounded-lg text-[8px] font-black tracking-[0.2em] uppercase border ${cari.bakiyeTip === 'Alacak' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                  }`}>
                                  {cari.bakiyeTip}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-white/[0.03] border-t border-white/10 font-black">
                            <td className="px-10 py-10 text-lg uppercase tracking-widest">GENEL TOPLAM</td>
                            <td className="px-10 py-10 text-right text-rose-500 text-xl tracking-tighter">₺{cariMizan.reduce((sum, c) => sum + c.borc, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-10 py-10 text-right text-emerald-400 text-xl tracking-tighter">₺{cariMizan.reduce((sum, c) => sum + c.alacak, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-10 py-10 text-right text-indigo-400 text-2xl tracking-tighter underline underline-offset-8">₺{Math.abs(cariMizan.reduce((sum, c) => sum + c.bakiye, 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-10 py-10 text-center">—</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
