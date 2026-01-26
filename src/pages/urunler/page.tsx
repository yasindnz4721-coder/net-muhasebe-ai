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

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-xs tracking-widest uppercase">Envanter Verileri İşleniyor...</p>
        </div>
      </div>
    );
  }

  if (profileError || !selectedProfile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md animate-slide-up">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <i className="ri-error-warning-line text-4xl text-red-500"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Erişimi Gerekli</h3>
          <p className="text-slate-400 font-medium mb-8">Ürünlerinizi yönetmek için lütfen üst menüden bir profil seçin.</p>
          <button onClick={() => window.location.reload()} className="premium-button px-10 h-14 text-xs tracking-widest uppercase">YENİDEN DENE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
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
                  <i className="ri-box-3-line"></i>
                  <span>STOK VE ENVANTER</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Ürün <span className="text-gradient">Portföyü.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Ürünlerinizi, stok seviyelerinizi ve ticari değerlerinizi akıllıca takip edin.</p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="premium-button px-8 h-16 text-sm uppercase tracking-widest group"
              >
                <span>YENİ ÜRÜN EKLE</span>
                <i className="ri-add-line text-xl group-hover:rotate-90 transition-transform"></i>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-8 group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-product-hunt-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">TOPLAM ÜRÜN</span>
                </div>
                <div className="text-4xl font-black tracking-tighter">{toplamUrunSayisi}</div>
              </div>

              <div className="premium-card p-8 group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">ENVANTER DEĞERİ</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-emerald-500">₺{toplamStokDegeri.toLocaleString()}</div>
              </div>

              <div className="premium-card p-8 group hover:border-rose-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-alert-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">KRİTİK STOK</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-rose-500">{dusukStokUrunler.length}</div>
              </div>
            </div>

            {error && (
              <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold flex items-center gap-4 animate-shake">
                <i className="ri-error-warning-fill text-xl"></i>
                <div className="flex-1">{error}</div>
                <button onClick={() => setError(null)}>
                  <i className="ri-close-line text-xl font-black"></i>
                </button>
              </div>
            )}

            {/* Inventory Table Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md group">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="text"
                    placeholder="Ürün adı veya kodu ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-12 h-14"
                  />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    className="premium-input h-14 px-6 md:w-64"
                  >
                    <option value="all">TÜM KATEGORİLER</option>
                    {kategoriler.map(kat => (
                      <option key={kat.id} value={kat.ad}>{kat.ad.toUpperCase()}</option>
                    ))}
                  </select>
                  <button className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <i className="ri-arrow-up-down-line text-xl"></i>
                  </button>
                </div>
              </div>

              {filteredUrunler.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <i className="ri-box-3-line text-5xl text-slate-700"></i>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-200 uppercase">Ürün Bulunamadı</h3>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-8 py-4 bg-white text-black rounded-2xl font-black tracking-widest uppercase hover:bg-slate-200 transition-all"
                    >
                      İLK ÜRÜNÜ EKLE
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ÜRÜN DETAYI</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KATEGORİ</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">STOK SEVİYESİ</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">BİRİM FİYAT (SATIŞ)</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKSİYON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredUrunler.map((urun) => (
                        <tr key={urun.id} className="hover:bg-indigo-500/[0.02] transition-all group/row">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-white/5 to-white/[0.01] border border-white/5 flex items-center justify-center text-slate-400 font-black text-xs shrink-0 group-hover/row:scale-110 transition-transform">
                                <i className="ri-box-3-fill text-xl text-indigo-500/50"></i>
                              </div>
                              <div>
                                <div className="font-black text-slate-200 tracking-tight text-lg leading-none group-hover/row:text-white transition-colors">{urun.ad}</div>
                                <div className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-widest italic">Ürün Kodu: #{urun.id.substring(0, 6)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {urun.kategori && (
                              <span className="inline-flex px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 tracking-widest uppercase">
                                {urun.kategori}
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6 font-bold">
                            <div className="flex flex-col gap-1">
                              <div className={`text-lg font-black tracking-tighter ${(urun.stok_miktari || 0) < 10 ? 'text-rose-500' : 'text-slate-200'}`}>
                                {(urun.stok_miktari || 0).toLocaleString()} <span className="text-xs font-bold text-slate-500">{urun.birim}</span>
                              </div>
                              {(urun.stok_miktari || 0) < 10 && (
                                <div className="flex items-center gap-1 text-[9px] font-black text-rose-500/80 uppercase tracking-tighter">
                                  <i className="ri-error-warning-fill"></i>
                                  KRİTİK SEVİYE UYARISI
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-lg font-black tracking-tighter text-emerald-500">
                              ₺{parseFloat(urun.satis_fiyati || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">
                              Alış: ₺{parseFloat(urun.alis_fiyati || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                              <button className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-600/10">
                                <i className="ri-edit-line"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(urun.id)}
                                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"
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

      {/* Premium Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="premium-card p-0 w-full max-w-lg flex flex-col animate-slide-up border-white/10 relative overflow-hidden">
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Ürün Kaydet</h3>
                <p className="text-slate-500 font-bold text-sm">Envanterinize yeni bir değer ekleyin.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ÜRÜN ADI / TANIMI *</label>
                <input
                  type="text"
                  required
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="premium-input text-lg font-black"
                  placeholder="Örn: Profesyonel Yazılım Paketi"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ÖLÇÜ BİRİMİ *</label>
                  <select
                    required
                    value={formData.birim}
                    onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                    className="premium-input h-14"
                  >
                    <option value="Adet">ADET</option>
                    <option value="Kg">KİLOGRAM (KG)</option>
                    <option value="Lt">LİTRE (LT)</option>
                    <option value="M">METRE (M)</option>
                    <option value="M2">METREKARE (M2)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">BAŞLANGIÇ STOĞU</label>
                  <input
                    type="number"
                    value={formData.stok_miktari}
                    onChange={(e) => setFormData({ ...formData, stok_miktari: parseInt(e.target.value) || 0 })}
                    className="premium-input h-14 font-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-16 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-2xl"
                >
                  İPTAL
                </button>
                <button
                  type="submit"
                  className="premium-button flex-1 h-16 text-xs uppercase tracking-widest font-black"
                >
                  ÜRÜNÜ SİSTEME İŞLE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
