import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { satisFaturalari as satisApi, alisFaturalari as alisApi, odemeler as odemelerApi, SatisFaturasi, AlisFaturasi, Odeme } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

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
  const toplamSatis = filteredSatisFaturalari.reduce((sum, f) => sum + parseFloat(f.toplam), 0);
  const toplamAlis = filteredAlisFaturalari.reduce((sum, f) => sum + parseFloat(f.toplam), 0);
  const toplamAlinanOdeme = filteredOdemeler.filter(o => o.tip === 'Alınan Ödeme').reduce((sum, o) => sum + parseFloat(o.tutar), 0);
  const toplamVerilenOdeme = filteredOdemeler.filter(o => o.tip === 'Verilen Ödeme').reduce((sum, o) => sum + parseFloat(o.tutar), 0);

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
    cari.alacak += parseFloat(f.toplam);
  });

  filteredAlisFaturalari.forEach(f => {
    if (!cariMap.has(f.cari_ad)) {
      cariMap.set(f.cari_ad, { borc: 0, alacak: 0 });
    }
    const cari = cariMap.get(f.cari_ad);
    cari.borc += parseFloat(f.toplam);
  });

  filteredOdemeler.forEach(o => {
    if (!cariMap.has(o.cari_ad)) {
      cariMap.set(o.cari_ad, { borc: 0, alacak: 0 });
    }
    const cari = cariMap.get(o.cari_ad);
    if (o.tip === 'Alınan Ödeme') {
      cari.borc += parseFloat(o.tutar);
    } else {
      cari.alacak += parseFloat(o.tutar);
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
      amount: o.tip === 'Alınan Ödeme' ? parseFloat(o.tutar) : -parseFloat(o.tutar),
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

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <ProfileSelector />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl text-indigo-500 animate-spin mb-4"></i>
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img
                  src="https://public.readdy.ai/ai/img_res/599009ac-e967-4692-9000-451db39762de.png"
                  alt="Logo"
                  className="h-10 w-auto object-contain cursor-pointer"
                />
              </Link>
              <div className="h-8 w-px bg-slate-300"></div>
              <h1 className="text-xl font-bold text-slate-800">Mali Raporlar ve Yasal Uyum</h1>
            </div>
            <ProfileSelector />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-dashboard-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Dashboard</span>
            </Link>
            <Link to="/cariler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-user-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Cariler</span>
            </Link>
            <Link to="/satis-faturasi" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-file-text-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Satış Faturası</span>
            </Link>
            <Link to="/alis-faturasi" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-file-list-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Alış Faturası</span>
            </Link>
            <Link to="/odemeler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-money-dollar-circle-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ödemeler</span>
            </Link>
            <Link to="/raporlar" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer">
              <i className="ri-bar-chart-box-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Raporlar</span>
            </Link>
            <Link to="/stok" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-archive-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Stok Yönetimi</span>
            </Link>
            <Link to="/urunler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-product-hunt-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ürünler</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Mali Raporlar ve Yasal Uyum</h1>
                <p className="text-slate-600">Vergi beyannameleri ve mali tablolarınız</p>
              </div>
              <button
                onClick={exportToExcel}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
              >
                <i className="ri-file-excel-line text-xl"></i>
                Excel İndir
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={dateRange.baslangic}
                  onChange={(e) => setDateRange({ ...dateRange, baslangic: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={dateRange.bitis}
                  onChange={(e) => setDateRange({ ...dateRange, bitis: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                onClick={loadData}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-refresh-line mr-2"></i>
                Yenile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('ozet')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'ozet'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <i className="ri-dashboard-line mr-2"></i>
                  Finansal Özet
                </button>
                <button
                  onClick={() => setActiveTab('kdv')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'kdv'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <i className="ri-percent-line mr-2"></i>
                  KDV Beyannamesi
                </button>
                <button
                  onClick={() => setActiveTab('gelir-gider')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'gelir-gider'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <i className="ri-line-chart-line mr-2"></i>
                  Gelir-Gider Tablosu
                </button>
                <button
                  onClick={() => setActiveTab('mizan')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'mizan'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <i className="ri-scales-line mr-2"></i>
                  Cari Mizan
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'ozet' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Finansal Özet</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Toplam Satış</h3>
                        <i className="ri-arrow-up-line text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold">₺{toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Toplam Alış</h3>
                        <i className="ri-arrow-down-line text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold">₺{toplamAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Brüt Kar</h3>
                        <i className="ri-money-dollar-circle-line text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold">₺{brutKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Ödenecek KDV</h3>
                        <i className="ri-percent-line text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold">₺{odenecekKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className={`bg-gradient-to-br ${netKar >= 0 ? 'from-teal-500 to-teal-600' : 'from-red-500 to-red-600'} rounded-xl p-6 text-white`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Net Kar/Zarar</h3>
                        <i className="ri-line-chart-line text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold">₺{netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Toplam İşlem</h3>
                        <i className="ri-file-list-line text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold">{tumIslemler.length}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <i className="ri-information-line text-xl text-amber-600 mt-0.5"></i>
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Yasal Uyarı:</p>
                      <p>Bu rapor bilgilendirme amaçlıdır. Resmi beyannamelerinizi mali müşaviriniz ile kontrol ediniz.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'kdv' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">KDV Beyannamesi (Form 2A)</h2>

                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Açıklama</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Matrah (₺)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">KDV (₺)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-green-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">Mal ve Hizmet Satışları</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-700">
                            {satisMatrah.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-700">
                            {satisKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-red-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">Mal ve Hizmet Alışları</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-red-700">
                            {alisMatrah.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-red-700">
                            {alisKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-indigo-50">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">Ödenecek KDV</td>
                          <td className="px-6 py-4 text-sm text-right"></td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-indigo-700 text-lg">
                            {odenecekKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <i className="ri-information-line"></i>
                        KDV Oranı
                      </h3>
                      <p className="text-sm text-blue-800">Bu hesaplamada %20 KDV oranı kullanılmıştır.</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <i className="ri-calendar-line"></i>
                        Beyan Dönemi
                      </h3>
                      <p className="text-sm text-amber-800">{dateRange.baslangic} - {dateRange.bitis}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gelir-gider' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Gelir-Gider Tablosu</h2>

                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Hesap</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Tutar (₺)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-green-50">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">GELİRLER</td>
                          <td className="px-6 py-4"></td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-slate-700 pl-12">Satış Gelirleri</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-700">
                            {toplamSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-slate-700 pl-12">Alınan Ödemeler</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-700">
                            {toplamAlinanOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-green-100">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">TOPLAM GELİR</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-green-700 text-lg">
                            {(toplamSatis + toplamAlinanOdeme).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>

                        <tr className="bg-red-50">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">GİDERLER</td>
                          <td className="px-6 py-4"></td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-slate-700 pl-12">Alış Giderleri</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-red-700">
                            {toplamAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-slate-700 pl-12">Yapılan Ödemeler</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-red-700">
                            {toplamVerilenOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-slate-700 pl-12">KDV Gideri</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-red-700">
                            {odenecekKDV.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-red-100">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">TOPLAM GİDER</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-red-700 text-lg">
                            {(toplamAlis + toplamVerilenOdeme + odenecekKDV).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>

                        <tr className={`${netKar >= 0 ? 'bg-teal-100' : 'bg-red-100'}`}>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">NET KAR/ZARAR</td>
                          <td className={`px-6 py-4 text-sm text-right font-bold text-lg ${netKar >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                            {netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'mizan' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Cari Mizan</h2>

                  {cariMizan.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-scales-line text-6xl text-slate-300 mb-4"></i>
                      <p className="text-slate-500 text-lg">Seçilen tarih aralığında cari hareketi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Cari Adı</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Borç (₺)</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Alacak (₺)</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Bakiye (₺)</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {cariMizan.map((cari, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-slate-800">{cari.cari}</td>
                              <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                                {cari.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">
                                {cari.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`px-6 py-4 text-sm text-right font-bold ${cari.bakiye >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(cari.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${cari.bakiyeTip === 'Alacak' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                  {cari.bakiyeTip}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-bold">
                            <td className="px-6 py-4 text-sm text-slate-900">TOPLAM</td>
                            <td className="px-6 py-4 text-sm text-right text-red-700">
                              {cariMizan.reduce((sum, c) => sum + c.borc, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-green-700">
                              {cariMizan.reduce((sum, c) => sum + c.alacak, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-slate-900">
                              {Math.abs(cariMizan.reduce((sum, c) => sum + c.bakiye, 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
