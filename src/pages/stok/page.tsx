import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stokHareketleri as stokApi, urunler as urunlerApi, cariler as carilerApi, StokHareketi, Urun, Cari } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

export default function Stok() {
  const { selectedProfile, isPro } = useProfile();
  const [hareketler, setHareketler] = useState<StokHareketi[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Üretim Modalı States
  const [showUretimModal, setShowUretimModal] = useState(false);
  const [uretimData, setUretimData] = useState({
    urun_id: '',
    miktar: 1,
    aciklama: 'Günlük üretimden stok girişi',
    tarih: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (selectedProfile) {
      loadData();
    }
  }, [selectedProfile]);

  const loadData = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      const { data: hareketlerData } = await stokApi.getAll(selectedProfile.id);
      const { data: urunlerData } = await urunlerApi.getAll(selectedProfile.id);
      const { data: carilerData } = await carilerApi.getAll(selectedProfile.id);

      setHareketler(hareketlerData || []);
      setUrunler(urunlerData || []);
      setCariler(carilerData || []);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUretimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !isPro) return;

    const urun = urunler.find(u => u.id === uretimData.urun_id);
    if (!urun) return;

    try {
      const { error } = await stokApi.create({
        urun_id: uretimData.urun_id,
        urun_ad: urun.ad,
        hareket_tipi: 'Üretim',
        miktar: Number(uretimData.miktar),
        tarih: uretimData.tarih,
        aciklama: uretimData.aciklama,
        profile_id: selectedProfile.id
      });

      if (!error) {
        setShowUretimModal(false);
        setUretimData({
          urun_id: '',
          miktar: 1,
          aciklama: 'Günlük üretimden stok girişi',
          tarih: new Date().toISOString().split('T')[0]
        });
        loadData();
      }
    } catch (error) {
      console.error('Üretim girişi hatası:', error);
    }
  };

  const filteredHareketler = hareketler.filter(hareket => {
    const urunAd = hareket.urun_ad || '';
    const cariAd = hareket.cari_ad || '';
    const matchesSearch = urunAd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cariAd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hareket.aciklama?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || hareket.hareket_tipi === filterType;
    return matchesSearch && matchesType;
  });

  const toplamGiris = hareketler
    .filter(h => h.hareket_tipi === 'Giriş' || h.hareket_tipi === 'Üretim')
    .reduce((sum, h) => sum + parseFloat(h.miktar.toString()), 0);

  const toplamCikis = hareketler
    .filter(h => h.hareket_tipi === 'Çıkış')
    .reduce((sum, h) => sum + parseFloat(h.miktar.toString()), 0);

  const mevcutStok = toplamGiris - toplamCikis;

  const dusukStokUrunler = urunler.filter(u => parseFloat(u.stok_miktari.toString()) < 10); // Örnek eşik

  const toplamStokDegeri = urunler.reduce((sum, u) => sum + (parseFloat(u.stok_miktari.toString()) * 100), 0); // Örnek değerleme

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
              <h1 className="text-xl font-bold text-slate-800">Depodaki Stok</h1>
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
            <Link to="/urunler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-product-hunt-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ürünler</span>
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
            <Link to="/stok" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer">
              <i className="ri-archive-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Depodaki Stok</span>
            </Link>
            <Link to="/tum-islemler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-list-check-2 text-xl"></i>
              <span className="font-medium whitespace-nowrap">Tüm İşlemler</span>
            </Link>
            <Link to="/raporlar" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-bar-chart-box-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Raporlar</span>
            </Link>
            <Link to="/ai-analiz" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-sparkling-2-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">AI Finansal Analiz ⭐</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Toplam Giriş</p>
                  <h3 className="text-2xl font-bold text-green-600">{toplamGiris.toLocaleString()}</h3>
                </div>
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-arrow-down-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Toplam Çıkış</p>
                  <h3 className="text-2xl font-bold text-red-600">{toplamCikis.toLocaleString()}</h3>
                </div>
                <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-arrow-up-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Mevcut Stok</p>
                  <h3 className="text-2xl font-bold text-indigo-600">{mevcutStok.toLocaleString()}</h3>
                </div>
                <div className="bg-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-archive-line text-2xl text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Düşük Stok Uyarısı</p>
                  <h3 className="text-2xl font-bold text-amber-600">{dusukStokUrunler.length}</h3>
                </div>
                <div className="bg-amber-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-alert-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Stok Hareketleri</h2>
                <p className="text-sm text-slate-600 mt-1">Toplam {hareketler.length} hareket</p>
              </div>
              {isPro && (
                <button
                  onClick={() => setShowUretimModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-hammer-line mr-2"></i>
                  Yeni Üretim Girişi
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Ürün, Cari veya açıklama ile ara..."
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
                <option value="all">Tüm Hareketler</option>
                <option value="Giriş">Giriş (Alış)</option>
                <option value="Çıkış">Çıkış (Satış)</option>
                <option value="Üretim">Üretim Girişi</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Ürün</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Kaynak/Hedef (Cari)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Hareket Tipi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Miktar</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredHareketler.map((hareket) => (
                    <tr key={hareket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(hareket.tarih).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                        {hareket.urun_ad}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {hareket.cari_ad || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${hareket.hareket_tipi === 'Giriş' ? 'bg-green-100 text-green-700' :
                          hareket.hareket_tipi === 'Üretim' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {hareket.hareket_tipi}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap ${hareket.hareket_tipi === 'Çıkış' ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {hareket.hareket_tipi === 'Çıkış' ? '-' : '+'}{hareket.miktar}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{hareket.aciklama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Üretim Modalı */}
      {showUretimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Yeni Üretim Girişi</h3>
              <button onClick={() => setShowUretimModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleUretimSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ürün Seçin *</label>
                <select
                  value={uretimData.urun_id}
                  onChange={(e) => setUretimData({ ...uretimData, urun_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                >
                  <option value="">Seçin...</option>
                  {urunler.map(u => (
                    <option key={u.id} value={u.id}>{u.ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Miktar *</label>
                <input
                  type="number"
                  value={uretimData.miktar}
                  onChange={(e) => setUretimData({ ...uretimData, miktar: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tarih</label>
                <input
                  type="date"
                  value={uretimData.tarih}
                  onChange={(e) => setUretimData({ ...uretimData, tarih: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama</label>
                <textarea
                  value={uretimData.aciklama}
                  onChange={(e) => setUretimData({ ...uretimData, aciklama: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUretimModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-bold cursor-pointer"
                >
                  Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
