import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { odemeler as odemelerApi, cariler as carilerApi, Odeme, Cari } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

export default function Odemeler() {
  const { selectedProfile } = useProfile();
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOdeme, setSelectedOdeme] = useState<Odeme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    cari_id: '',
    cari_ad: '',
    tip: 'Tahsilat',
    tutar: '',
    tarih: new Date().toISOString().split('T')[0],
    odeme_yontemi: 'Nakit',
    aciklama: ''
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
      const { data: odemelerData } = await odemelerApi.getAll(selectedProfile.id);
      const { data: carilerData } = await carilerApi.getAll(selectedProfile.id);

      setOdemeler(odemelerData || []);
      setCariler(carilerData || []);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCariChange = (cariId: string) => {
    const cari = cariler.find(c => c.id === cariId);
    setFormData({
      ...formData,
      cari_id: cariId,
      cari_ad: cari ? cari.ad : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (!formData.cari_id || !formData.tutar) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }

    try {
      const { error } = await odemelerApi.create({
        cari_id: formData.cari_id,
        cari_ad: formData.cari_ad,
        tip: formData.tip,
        tutar: parseFloat(formData.tutar),
        tarih: formData.tarih,
        odeme_yontemi: formData.odeme_yontemi,
        aciklama: formData.aciklama,
        profile_id: selectedProfile.id
      });

      if (error) throw new Error(error);

      await loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Ödeme eklenirken hata:', error);
      alert('Ödeme eklenirken bir hata oluştu!');
    }
  };

  const handleDelete = async () => {
    if (!selectedOdeme || !selectedProfile) return;

    try {
      const { error } = await odemelerApi.delete(selectedOdeme.id);

      if (error) throw new Error(error);

      await loadData();
      setShowDeleteModal(false);
      setSelectedOdeme(null);
    } catch (error) {
      console.error('Ödeme silinirken hata:', error);
      alert('Ödeme silinirken bir hata oluştu!');
    }
  };

  const resetForm = () => {
    setFormData({
      cari_id: '',
      cari_ad: '',
      tip: 'Tahsilat',
      tutar: '',
      tarih: new Date().toISOString().split('T')[0],
      odeme_yontemi: 'Nakit',
      aciklama: ''
    });
  };

  const filteredOdemeler = odemeler.filter(odeme => {
    const matchesSearch = odeme.cari_ad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || odeme.tip === filterType;
    return matchesSearch && matchesType;
  });

  const toplamAlınan = odemeler
    .filter(o => o.tip === 'Tahsilat')
    .reduce((sum, o) => sum + parseFloat(o.tutar), 0);

  const toplamVerilen = odemeler
    .filter(o => o.tip === 'Tediye')
    .reduce((sum, o) => sum + parseFloat(o.tutar), 0);

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

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <ProfileSelector />
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
              <h1 className="text-xl font-bold text-slate-800">Ödeme Yönetimi</h1>
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
            <Link to="/odemeler" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer">
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
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Toplam Alınan</p>
                  <h3 className="text-2xl font-bold text-green-600">₺{toplamAlınan.toLocaleString()}</h3>
                </div>
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-arrow-down-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Toplam Verilen</p>
                  <h3 className="text-2xl font-bold text-red-600">₺{toplamVerilen.toLocaleString()}</h3>
                </div>
                <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-arrow-up-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Net Bakiye</p>
                  <h3 className={`text-2xl font-bold ${toplamAlınan - toplamVerilen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{(toplamAlınan - toplamVerilen).toLocaleString()}
                  </h3>
                </div>
                <div className="bg-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-wallet-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Ödemeler</h2>
                <p className="text-sm text-slate-600 mt-1">Toplam {odemeler.length} ödeme</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap cursor-pointer"
              >
                <i className="ri-add-line mr-2"></i>
                Yeni Ödeme Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Cari adı ile ara..."
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
                <option value="all">Tüm Ödemeler</option>
                <option value="Tahsilat">Alınan Ödemeler</option>
                <option value="Tediye">Yapılan Ödemeler</option>
              </select>
            </div>

            {filteredOdemeler.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-money-dollar-circle-line text-6xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 text-lg mb-2">Henüz ödeme kaydı yok</p>
                <p className="text-slate-400 text-sm">Yeni ödeme ekleyerek başlayın</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Cari</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tip</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tutar</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Yöntem</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOdemeler.map((odeme) => (
                      <tr key={odeme.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">{odeme.cari_ad}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${odeme.tip === 'Tahsilat' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {odeme.tip === 'Tahsilat' ? 'Ödeme Alındı' : 'Ödeme Yapıldı'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap ${odeme.tip === 'Tahsilat' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {odeme.tip === 'Tahsilat' ? '+' : '-'}₺{parseFloat(odeme.tutar).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{odeme.tarih}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{odeme.odeme_yontemi}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedOdeme(odeme);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
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

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Yeni Ödeme Ekle</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cari Seçin *</label>
                  <select
                    value={formData.cari_id}
                    onChange={(e) => handleCariChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Cari seçin...</option>
                    {cariler.map(cari => (
                      <option key={cari.id} value={cari.id}>{cari.ad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ödeme Tipi *</label>
                  <select
                    value={formData.tip}
                    onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="Tahsilat">Ödeme Alındı</option>
                    <option value="Tediye">Ödeme Yapıldı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tutar (₺) *</label>
                  <input
                    type="number"
                    value={formData.tutar}
                    onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tarih *</label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ödeme Yöntemi *</label>
                  <select
                    value={formData.odeme_yontemi}
                    onChange={(e) => setFormData({ ...formData, odeme_yontemi: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="Nakit">Nakit</option>
                    <option value="Banka Transferi">Banka Transferi</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Çek">Çek</option>
                    <option value="Senet">Senet</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama</label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Ödeme ile ilgili notlar..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  Ödeme Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Ödemeyi Sil</h3>
              <p className="text-slate-600 text-center mb-6">
                Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedOdeme(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
