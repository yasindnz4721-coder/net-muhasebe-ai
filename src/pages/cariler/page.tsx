import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { cariler as carilerApi, Cari } from '../../lib/api';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function CarilerPage() {
  const navigate = useNavigate();
  const { selectedProfile } = useProfile();
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Cari; direction: 'asc' | 'desc' } | null>(null);

  const [formData, setFormData] = useState({
    ad: '',
    telefon: '',
    email: '',
    adres: '',
    vergi_no: '',
    vergi_dairesi: '',
  });

  useEffect(() => {
    if (selectedProfile) {
      loadCariler();
    }
  }, [selectedProfile]);

  const loadCariler = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await carilerApi.getAll(selectedProfile.id);

      if (fetchError) throw new Error(fetchError);

      setCariler(data || []);
    } catch (err) {
      console.error('Cariler yüklenirken hata:', err);
      setError('Cariler yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    try {
      setError(null);

      const { error: insertError } = await carilerApi.create({
        ...formData,
        profile_id: selectedProfile.id,
      });

      if (insertError) throw new Error(insertError);

      setShowModal(false);
      setFormData({
        ad: '',
        telefon: '',
        email: '',
        adres: '',
        vergi_no: '',
        vergi_dairesi: '',
      });
      loadCariler();
    } catch (err) {
      console.error('Cari eklenirken hata:', err);
      setError('Cari eklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Satır tıklamasını engelle
    if (!confirm('Bu cariyi silmek istediğinizden emin misiniz?')) return;

    try {
      setError(null);

      const { error: deleteError } = await carilerApi.delete(id);

      if (deleteError) throw new Error(deleteError);

      loadCariler();
    } catch (err) {
      console.error('Cari silinirken hata:', err);
      setError('Cari silinemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleSort = (key: keyof Cari) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedCariler = useMemo(() => {
    let result = [...cariler];

    // Searching
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (cari) =>
          cari.ad.toLowerCase().includes(term) ||
          cari.telefon.includes(term) ||
          cari.email.toLowerCase().includes(term) ||
          cari.vergi_no.includes(term)
      );
    }

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [cariler, searchTerm, sortConfig]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: cariler.length,
      active: cariler.length, // Şimdilik hepsi aktif kabul ediliyor
      withEmail: cariler.filter(c => c.email).length,
    };
  }, [cariler]);

  if (!selectedProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-3xl text-orange-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil Seçin</h3>
              <p className="text-gray-600 mb-4">İşlem yapabilmek için lütfen bir profil seçin.</p>
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cari Hesaplar</h1>
                <p className="text-sm text-gray-500 mt-1">Müşteri ve tedarikçi hesaplarınızı yönetin</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-4 focus:ring-teal-100 transition-all font-medium shadow-sm gap-2 cursor-pointer"
              >
                <i className="ri-add-line text-xl"></i>
                <span>Yeni Cari Ekle</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Toplam Cari</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <i className="ri-user-star-line text-2xl"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Aktif Cariler</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                    <i className="ri-checkbox-circle-line text-2xl"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kayıtlı E-posta</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.withEmail}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                    <i className="ri-mail-check-line text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
                <p className="text-red-700 text-sm font-medium">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700">
                  <i className="ri-close-line"></i>
                </button>
              </div>
            )}

            {/* Filter & Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                <div className="relative flex-1 max-w-md">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Ad, telefon, email veya vergi no ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" title="Filtrele">
                    <i className="ri-filter-3-line text-lg"></i>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" title="Dışa Aktar">
                    <i className="ri-download-2-line text-lg"></i>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 text-sm">Veriler yükleniyor...</p>
                </div>
              ) : processedCariler.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-user-search-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">Cari Bulunamadı</h3>
                  <p className="text-gray-500 text-sm mb-6">Arama kriterlerinize uygun kayıt yok veya henüz hiç cari eklemediniz.</p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      İlk Cariyi Ekle
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        {[
                          { key: 'ad', label: 'Cari Adı & Bilgisi' },
                          { key: 'telefon', label: 'İletişim' },
                          { key: 'vergi_no', label: 'Vergi No' },
                          { key: 'adres', label: 'Adres' }
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key as keyof Cari)}
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors group select-none"
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {sortConfig?.key === col.key && (
                                <i className={`ri-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}-s-line text-teal-600`}></i>
                              )}
                              {sortConfig?.key !== col.key && (
                                <i className="ri-arrow-up-down-line text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {processedCariler.map((cari) => (
                        <tr
                          key={cari.id}
                          onClick={() => navigate(`/cari-detay/${cari.id}`)}
                          className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                                {cari.ad.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 group-hover:text-teal-700 transition-colors">{cari.ad}</div>
                                {cari.email && <div className="text-sm text-gray-500">{cari.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 font-medium">
                              {cari.telefon || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {cari.vergi_no ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {cari.vergi_no}
                                </span>
                              ) : '-'}
                            </div>
                            {cari.vergi_dairesi && <div className="text-xs text-gray-400 mt-0.5">{cari.vergi_dairesi}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate" title={cari.adres}>
                              {cari.adres || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/cari-detay/${cari.id}`); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                title="Detayları Görüntüle"
                              >
                                <i className="ri-eye-line text-lg"></i>
                              </button>
                              <button
                                onClick={(e) => handleDelete(cari.id, e)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Sil"
                              >
                                <i className="ri-delete-bin-line text-lg"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Yeni Cari Kartı</h3>
                <p className="text-sm text-gray-500 mt-1">Yeni bir müşteri veya tedarikçi ekleyin</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    ad: '',
                    telefon: '',
                    email: '',
                    adres: '',
                    vergi_no: '',
                    vergi_dairesi: '',
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="cariForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="bg-blue-50/50 p-4 rounded-lg flex gap-3 border border-blue-100">
                    <i className="ri-information-line text-blue-500 mt-0.5"></i>
                    <p className="text-sm text-blue-700">Zorunlu alanları (* işaretli) doldurduğunuzdan emin olun. Vergi bilgileri fatura işlemleri için gereklidir.</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cari Adı / Unvanı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ad}
                    onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                    placeholder="Örn: ABC Teknoloji Ltd. Şti."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i className="ri-phone-line"></i>
                    </span>
                    <input
                      type="tel"
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="0555 123 45 67"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <i className="ri-mail-line"></i>
                    </span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="info@sirket.com"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adres
                  </label>
                  <textarea
                    value={formData.adres}
                    onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Açık adres giriniz..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vergi No
                  </label>
                  <input
                    type="text"
                    value={formData.vergi_no}
                    onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                    placeholder="10 haneli vergi numarası"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={formData.vergi_dairesi}
                    onChange={(e) => setFormData({ ...formData, vergi_dairesi: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                    placeholder="Bağlı bulunulan vergi dairesi"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    ad: '',
                    telefon: '',
                    email: '',
                    adres: '',
                    vergi_no: '',
                    vergi_dairesi: '',
                  });
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="cariForm"
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm cursor-pointer"
              >
                Cari Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
