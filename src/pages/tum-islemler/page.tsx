import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

export default function TumIslemler() {
  const { selectedProfile } = useProfile();
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (selectedProfile) {
      loadData();
    }
  }, [selectedProfile]);

  const loadData = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      const tumIslemler: any[] = [];

      // Tüm verileri paralel çek
      const [
        { data: satisFaturalari },
        { data: alisFaturalari },
        { data: odemeler }
      ] = await Promise.all([
        import('../../lib/api').then(m => m.satisFaturalari.getAll(selectedProfile.id)),
        import('../../lib/api').then(m => m.alisFaturalari.getAll(selectedProfile.id)),
        import('../../lib/api').then(m => m.odemeler.getAll(selectedProfile.id))
      ]);

      if (satisFaturalari && Array.isArray(satisFaturalari)) {
        satisFaturalari.forEach((fatura: any) => {
          tumIslemler.push({
            id: fatura.id,
            tip: 'Satış Faturası',
            cari_ad: fatura.cari_ad,
            tarih: fatura.tarih,
            tutar: parseFloat(fatura.toplam),
            aciklama: `Fatura No: ${fatura.fatura_no}`,
            durum: fatura.durum
          });
        });
      }

      if (alisFaturalari && Array.isArray(alisFaturalari)) {
        alisFaturalari.forEach((fatura: any) => {
          tumIslemler.push({
            id: fatura.id,
            tip: 'Alış Faturası',
            cari_ad: fatura.cari_ad,
            tarih: fatura.tarih,
            tutar: parseFloat(fatura.toplam),
            aciklama: `Fatura No: ${fatura.fatura_no}`,
            durum: fatura.durum
          });
        });
      }

      if (odemeler && Array.isArray(odemeler)) {
        odemeler.forEach((odeme: any) => {
          tumIslemler.push({
            id: odeme.id,
            tip: odeme.tip,
            cari_ad: odeme.cari_ad,
            tarih: odeme.tarih,
            tutar: parseFloat(odeme.tutar),
            aciklama: `${odeme.odeme_yontemi}${odeme.aciklama ? ' - ' + odeme.aciklama : ''}`,
            durum: 'Tamamlandı'
          });
        });
      }

      // Tarihe göre sırala
      tumIslemler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
      setIslemler(tumIslemler);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIslemler = islemler.filter(islem => {
    const matchesSearch = islem.cari_ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      islem.aciklama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || islem.tip === filterType;
    return matchesSearch && matchesType;
  });

  const toplamTutar = filteredIslemler.reduce((sum, i) => sum + i.tutar, 0);

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
              <h1 className="text-xl font-bold text-slate-800">Tüm İşlemler</h1>
            </div>
            <div className="flex items-center gap-3">
              <ProfileSelector />
              <Link to="/" className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-arrow-left-line mr-2"></i>
                Dashboard'a Dön
              </Link>
            </div>
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
            <Link to="/raporlar" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
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

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Tüm İşlemler</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Toplam {filteredIslemler.length} işlem - ₺{toplamTutar.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Cari adı veya açıklama ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="all">Tüm İşlemler</option>
                <option value="Satış Faturası">Satış Faturaları</option>
                <option value="Alış Faturası">Alış Faturaları</option>
                <option value="Ödeme Alındı">Alınan Ödemeler</option>
                <option value="Ödeme Yapıldı">Yapılan Ödemeler</option>
              </select>
            </div>

            {filteredIslemler.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-file-list-line text-6xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 text-lg mb-2">Henüz işlem kaydı yok</p>
                <p className="text-slate-400 text-sm">Fatura veya ödeme ekleyerek başlayın</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">İşlem Tipi</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Cari</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Açıklama</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tutar</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredIslemler.map((islem, index) => (
                      <tr key={`${islem.tip}-${islem.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{new Date(islem.tarih).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${islem.tip === 'Satış Faturası' ? 'bg-green-100 text-green-700' :
                            islem.tip === 'Alış Faturası' ? 'bg-orange-100 text-orange-700' :
                              islem.tip === 'Ödeme Alındı' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                            }`}>
                            {islem.tip}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">{islem.cari_ad}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{islem.aciklama}</td>
                        <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap ${islem.tip === 'Satış Faturası' || islem.tip === 'Ödeme Alındı' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {islem.tip === 'Satış Faturası' || islem.tip === 'Ödeme Alındı' ? '+' : '-'}₺{islem.tutar.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${islem.durum === 'Onaylandı' || islem.durum === 'Tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {islem.durum}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
