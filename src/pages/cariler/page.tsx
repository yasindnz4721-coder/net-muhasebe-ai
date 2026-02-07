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
      <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[120px] animate-aurora-1"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-aurora-2"></div>
        </div>

        <Sidebar />
        <div className="flex-1 flex flex-col relative z-10">
          <Header />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="premium-card p-12 text-center max-w-md animate-slide-up">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/20">
                <i className="ri-profile-line text-4xl text-white"></i>
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Profil Seçimi Gerekli</h3>
              <p className="text-slate-400 font-medium mb-8">İşlem yapabilmek için lütfen üst menüden bir profil seçin veya yeni bir profil oluşturun.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <i className="ri-group-line"></i>
                  <span>YÖNETİM PANELİ</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Cari <span className="text-gradient">Hesaplar.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Müşteri ve tedarikçi ağınızı yapay zeka destekli akıllı verilerle yönetin.</p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="premium-button px-8 h-16 text-sm uppercase tracking-widest group"
              >
                <span>YENİ CARİ EKLE</span>
                <i className="ri-add-line text-xl group-hover:rotate-90 transition-transform"></i>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'TOPLAM CARİ', val: stats.total, icon: 'ri-team-line', color: 'from-blue-600 to-indigo-600' },
                { label: 'AKTİF İLİŞKİLER', val: stats.active, icon: 'ri-pulse-line', color: 'from-emerald-600 to-teal-600' },
                { label: 'DİJİTAL İLETİŞİM', val: stats.withEmail, icon: 'ri-mail-check-line', color: 'from-purple-600 to-pink-600' }
              ].map((s, idx) => (
                <div key={idx} className="premium-card p-8 group hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-tr ${s.color} rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform`}>
                      <i className={`${s.icon} text-2xl text-white`}></i>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{s.label}</span>
                  </div>
                  <div className="text-4xl font-black tracking-tighter">{s.val}</div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold flex items-center gap-4 animate-shake">
                <i className="ri-error-warning-fill text-xl"></i>
                <div className="flex-1">{error}</div>
                <button onClick={() => setError(null)} className="hover:text-white transition-colors">
                  <i className="ri-close-line text-xl font-black"></i>
                </button>
              </div>
            )}

            {/* Table Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md group">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="text"
                    placeholder="Ad, telefon, email veya vergi no ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-12 h-14"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white">
                    <i className="ri-filter-3-line text-xl"></i>
                  </button>
                  <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white">
                    <i className="ri-download-2-line text-xl"></i>
                  </button>
                </div>
              </div>

              {loading && processedCariler.length === 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-white/5">
                      {[...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-skeleton h-20">
                          <td colSpan={5} className="px-8 py-6 opacity-10">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white/20"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-white/20 rounded"></div>
                                <div className="h-3 w-24 bg-white/20 rounded"></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : processedCariler.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <i className="ri-user-search-line text-5xl text-slate-700"></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-slate-200 uppercase">Cari Bulunamadı</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">Henüz hiç cari kaydı oluşturmamışsınız veya arama kriterlerinize uygun kayıt bulunamadı.</p>
                  </div>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-8 py-4 bg-white text-black rounded-2xl font-black tracking-widest uppercase hover:bg-slate-200 transition-all"
                    >
                      İLK CARİYİ EKLE
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        {[
                          { key: 'ad', label: 'CARİ BİLGİSİ' },
                          { key: 'telefon', label: 'İLETİŞİM' },
                          { key: 'vergi_no', label: 'VERGİ KİMLİK' },
                          { key: 'adres', label: 'LOKASYON' }
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key as keyof Cari)}
                            className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer hover:text-indigo-400 transition-colors group select-none"
                          >
                            <div className="flex items-center gap-2">
                              {col.label}
                              {sortConfig?.key === col.key && (
                                <i className={`ri-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}-s-line text-indigo-500 text-sm`}></i>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKSİYON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {processedCariler.map((cari) => (
                        <tr
                          key={cari.id}
                          onClick={() => navigate(`/cari-detay/${cari.id}`)}
                          className="hover:bg-indigo-500/[0.03] transition-all cursor-pointer group/row"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-blue-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0 group-hover/row:scale-110 transition-transform shadow-lg shadow-indigo-600/5">
                                {cari.ad.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-black text-slate-200 tracking-tight group-hover/row:text-white transition-colors">{cari.ad}</div>
                                {cari.email && <div className="text-xs font-bold text-slate-600 group-hover/row:text-slate-400 transition-colors mt-0.5">{cari.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-400 group-hover/row:text-slate-200">
                            {cari.telefon || 'Telefon belirtilmemiş'}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm font-black text-slate-300">
                              {cari.vergi_no ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] tracking-widest uppercase">
                                  {cari.vergi_no}
                                </span>
                              ) : <span className="text-slate-700 italic text-xs">Belirtilmemiş</span>}
                            </div>
                            {cari.vergi_dairesi && <div className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">{cari.vergi_dairesi}</div>}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-medium text-slate-500 max-w-[200px] truncate group-hover/row:text-slate-400 transition-colors" title={cari.adres}>
                              {cari.adres || 'Adres bilgisi girilmemiş'}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/cari-detay/${cari.id}`); }}
                                className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-600/10"
                                title="Detayları Görüntüle"
                              >
                                <i className="ri-eye-line"></i>
                              </button>
                              <button
                                onClick={(e) => handleDelete(cari.id, e)}
                                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-600/10"
                                title="Sil"
                              >
                                <i className="ri-delete-bin-line"></i>
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
          </main>
        </div>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in overflow-y-auto">
          <div className="premium-card p-0 w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up border-white/10 relative">
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Cari Kartı Oluştur</h3>
                <p className="text-slate-500 font-bold text-sm">Sisteme yeni bir paydaş entegre edin.</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({ ad: '', telefon: '', email: '', adres: '', vergi_no: '', vergi_dairesi: '', });
                }}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar">
              <form id="cariForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <i className="ri-information-line text-white text-xl"></i>
                    </div>
                    <p className="text-xs font-black text-indigo-300 uppercase leading-tight tracking-wider">Lütfen fatura kesimi için vergi bilgilerini eksiksiz doldurunuz.</p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Cari Adı / Ticari Unvan *</label>
                  <input
                    type="text"
                    required
                    value={formData.ad}
                    onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                    className="premium-input text-lg font-black"
                    placeholder="Örn: Net Teknoloji Ltd. Şti."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">İletişim Numarası *</label>
                  <div className="relative group">
                    <i className="ri-phone-line absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors"></i>
                    <input
                      type="tel"
                      required
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      className="premium-input pl-14"
                      placeholder="05xx ..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Resmi E-Posta *</label>
                  <div className="relative group">
                    <i className="ri-mail-line absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors"></i>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="premium-input pl-14"
                      placeholder="muhasebe@sirket.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Ticaret Lokasyonu / Adres</label>
                  <textarea
                    value={formData.adres}
                    onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                    rows={3}
                    className="premium-input py-4 resize-none h-auto"
                    placeholder="Mahalle, cadde, kapı no..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Vergi Numarası / TCKN</label>
                  <input
                    type="text"
                    value={formData.vergi_no}
                    onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                    className="premium-input"
                    placeholder="10/11 Hane"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={formData.vergi_dairesi}
                    onChange={(e) => setFormData({ ...formData, vergi_dairesi: e.target.value })}
                    className="premium-input"
                    placeholder="Örn: Beşiktaş V.D."
                  />
                </div>
              </form>
            </div>

            <div className="px-10 py-8 border-t border-white/5 flex items-center justify-end gap-6 shrink-0 bg-white/[0.01]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                İPTAL ET
              </button>
              <button
                type="submit"
                form="cariForm"
                className="premium-button px-10 h-16 text-xs uppercase tracking-widest"
              >
                KAYDI TAMAMLA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
