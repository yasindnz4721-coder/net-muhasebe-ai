import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { urunler as urunlerApi, kategoriler as kategorilerApi, Urun, Kategori } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function Urunler() {
  const { selectedProfile, loading: profileLoading, error: profileError } = useProfile();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [formData, setFormData] = useState({
    ad: '',
    birim: 'Adet',
    stok_miktari: 0
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
      setError(null);

      const { data: urunlerData, error: urunlerError } = await urunlerApi.getAll(selectedProfile.id);
      const { data: kategorilerData, error: kategorilerError } = await kategorilerApi.getAll(selectedProfile.id);

      if (urunlerError || kategorilerError) {
        throw new Error('Veriler yüklenirken hata oluştu');
      }

      setUrunler(urunlerData || []);
      setKategoriler(kategorilerData || []);
    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
      setError('Veriler yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    try {
      setError(null);

      const { error: insertError } = await urunlerApi.create({
        ad: formData.ad,
        birim: formData.birim,
        stok_miktari: formData.stok_miktari,
        kategori_id: '',
        profile_id: selectedProfile.id
      });

      if (insertError) throw new Error(insertError);

      setShowModal(false);
      setFormData({
        ad: '',
        birim: 'Adet',
        stok_miktari: 0
      });
      loadData();
    } catch (err) {
      console.error('Ürün eklenirken hata:', err);
      setError('Ürün eklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      setError(null);

      const { error: deleteError } = await urunlerApi.delete(id);

      if (deleteError) throw new Error(deleteError);

      loadData();
    } catch (err) {
      console.error('Ürün silinirken hata:', err);
      setError('Ürün silinemedi. Lütfen tekrar deneyin.');
    }
  };

  const filteredUrunler = urunler.filter(urun => {
    const matchesSearch = urun.ad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = filterKategori === 'all' || urun.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  });

  const toplamUrunSayisi = urunler.length;
  const toplamStokDegeri = urunler.reduce((sum, u) => {
    const stok = u.stok_miktari || 0;
    const fiyat = parseFloat(u.satis_fiyati) || 0;
    return sum + (stok * fiyat);
  }, 0);
  const dusukStokUrunler = urunler.filter(u => {
    const stok = u.stok_miktari || 0;
    return stok < 10;
  });

  if (profileLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (profileError || !selectedProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-3xl text-red-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil Hatası</h3>
              <p className="text-gray-600 mb-4">{profileError || 'Lütfen bir profil seçin'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors whitespace-nowrap"
              >
                Yeniden Dene
              </button>
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
        <main className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Toplam Ürün</p>
                  <h3 className="text-2xl font-bold text-gray-800">{toplamUrunSayisi}</h3>
                </div>
                <div className="bg-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-product-hunt-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Toplam Stok Değeri</p>
                  <h3 className="text-2xl font-bold text-green-600">₺{toplamStokDegeri.toLocaleString()}</h3>
                </div>
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Düşük Stok Uyarısı</p>
                  <h3 className="text-2xl font-bold text-amber-600">{dusukStokUrunler.length}</h3>
                </div>
                <div className="bg-amber-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="ri-alert-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Ürünler</h2>
                <p className="text-sm text-gray-600 mt-1">Toplam {urunler.length} ürün</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-add-line mr-2"></i>
                Yeni Ürün Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Ürün adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="all">Tüm Kategoriler</option>
                {kategoriler.map(kat => (
                  <option key={kat.id} value={kat.ad}>{kat.ad}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Ürünler yükleniyor...</p>
              </div>
            ) : filteredUrunler.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-product-hunt-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg mb-2">
                  {searchTerm || filterKategori !== 'all' ? 'Ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm || filterKategori !== 'all' ? 'Arama kriterlerinizi değiştirin' : 'Yeni ürün ekleyerek başlayın'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Ürün Adı</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Satış Fiyatı</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Alış Fiyatı</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUrunler.map((urun) => (
                      <tr key={urun.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">{urun.ad}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {urun.kategori && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {urun.kategori}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span className={`font-semibold ${(urun.stok_miktari || 0) < 10 ? 'text-red-600' : 'text-gray-800'
                            }`}>
                            {(urun.stok_miktari || 0).toLocaleString()} {urun.birim}
                          </span>
                          {(urun.stok_miktari || 0) < 10 && (
                            <i className="ri-alert-line text-red-600 ml-2"></i>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">
                          ₺{parseFloat(urun.satis_fiyati || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">
                          ₺{parseFloat(urun.alis_fiyati || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(urun.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Yeni Ürün Ekle</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birim *</label>
                <select
                  required
                  value={formData.birim}
                  onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="Adet">Adet</option>
                  <option value="Kg">Kg</option>
                  <option value="Lt">Lt</option>
                  <option value="M">M</option>
                  <option value="M2">M2</option>
                  <option value="M3">M3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Stok Miktarı</label>
                <input
                  type="number"
                  value={formData.stok_miktari}
                  onChange={(e) => setFormData({ ...formData, stok_miktari: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all whitespace-nowrap cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
