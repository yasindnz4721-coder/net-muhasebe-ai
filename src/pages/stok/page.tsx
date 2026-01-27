import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stokHareketleri as stokApi, urunler as urunlerApi, cariler as carilerApi, StokHareketi, Urun, Cari } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function Stok() {
  const navigate = useNavigate();
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
  const [saving, setSaving] = useState(false);

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
    if (!selectedProfile || !isPro || saving) return;

    if (!uretimData.urun_id) {
      alert('Lütfen bir ürün seçin.');
      return;
    }

    const urun = urunler.find(u => u.id === uretimData.urun_id);
    if (!urun) return;

    try {
      setSaving(true);
      const { error } = await stokApi.create({
        urun_id: uretimData.urun_id,
        urun_ad: urun.ad,
        hareket_tipi: 'Üretim',
        miktar: Number(uretimData.miktar),
        tarih: uretimData.tarih,
        aciklama: uretimData.aciklama,
        profile_id: selectedProfile.id
      });

      if (error) {
        alert('Hata: ' + error);
        return;
      }

      setShowUretimModal(false);
      setUretimData({
        urun_id: '',
        miktar: 1,
        aciklama: 'Günlük üretimden stok girişi',
        tarih: new Date().toISOString().split('T')[0]
      });
      alert('Üretim kaydı başarıyla oluşturuldu.');
      await loadData();
    } catch (error) {
      console.error('Üretim girişi hatası:', error);
      alert('Sorgu sırasında bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setSaving(false);
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
  const dusukStokUrunler = urunler.filter(u => (u.stok_miktari || 0) < 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-xs tracking-widest uppercase">Lojistik Verileri İşleniyor...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md animate-slide-up">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <i className="ri-profile-line text-4xl text-indigo-500"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Seçimi Gerekli</h3>
          <p className="text-slate-400 font-medium mb-8">Stok hareketlerini görüntülemek için bir profil seçmelisiniz.</p>
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
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <i className="ri-archive-line"></i>
                  <span>DEPO YÖNETİMİ</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Stok <span className="text-gradient">Hareketleri.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Envanter giriş ve çıkışlarını saniye saniye takip ederek stok kontrolünü elinizde tutun.</p>
              </div>

              {isPro && (
                <button
                  onClick={() => setShowUretimModal(true)}
                  className="premium-button px-8 h-16 text-sm uppercase tracking-widest group bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white"
                >
                  <span>YENİ ÜRETİM GİRİŞİ</span>
                  <i className="ri-hammer-line text-xl group-hover:scale-110 transition-transform"></i>
                </button>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="premium-card p-8 group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-arrow-down-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">TOPLAM GİRİŞ</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-emerald-500">{toplamGiris.toLocaleString()}</div>
              </div>

              <div className="premium-card p-8 group hover:border-rose-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-arrow-up-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">TOPLAM ÇIKIŞ</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-rose-500">{toplamCikis.toLocaleString()}</div>
              </div>

              <div className="premium-card p-8 group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-archive-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">MEVCUT STOK</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-indigo-400">{mevcutStok.toLocaleString()}</div>
              </div>

              <div className="premium-card p-8 group hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:scale-110 transition-transform">
                    <i className="ri-alert-line text-2xl text-white"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">KRİTİK ÜRÜN</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-amber-500">{dusukStokUrunler.length}</div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md group">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="text"
                    placeholder="Ürün, Kaynak veya Açıklama ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-12 h-14"
                  />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="premium-input h-14 px-6 md:w-64"
                  >
                    <option value="all">TÜM HAREKETLER</option>
                    <option value="Giriş">ALIM (GİRİŞ)</option>
                    <option value="Çıkış">SATIŞ (ÇIKIŞ)</option>
                    <option value="Üretim">ÜRETİM GİRİŞİ</option>
                  </select>
                </div>
              </div>

              {filteredHareketler.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <i className="ri-history-line text-5xl text-slate-700"></i>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-200 uppercase">Hareket Kaydı Bulunamadı</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto uppercase tracking-widest text-[10px]">Deponuz henüz bir işlem görmemiş veya kriterlerinize uygun kayıt yok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TARİH</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ÜRÜN TANIMI</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KAYNAK / HEDEF</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">MİKTAR</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TÜR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredHareketler.map((hareket) => (
                        <tr key={hareket.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6 font-bold text-slate-400">
                            {new Date(hareket.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-black text-slate-200 tracking-tight text-lg leading-none">{hareket.urun_ad}</div>
                            <div className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-widest italic truncate max-w-[200px]">{hareket.aciklama || 'SİSTEM KAYDI'}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-bold text-slate-300">
                              {hareket.cari_ad || <span className="text-slate-600 italic">Dahili İşlem</span>}
                            </span>
                          </td>
                          <td className={`px-8 py-6 font-black text-xl tracking-tighter ${hareket.hareket_tipi === 'Çıkış' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {hareket.hareket_tipi === 'Çıkış' ? '-' : '+'}{hareket.miktar.toLocaleString()}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${hareket.hareket_tipi === 'Giriş' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              hareket.hareket_tipi === 'Üretim' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                              {hareket.hareket_tipi}
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

      {/* Production Entry Modal */}
      {showUretimModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="premium-card p-0 w-full max-w-lg flex flex-col animate-slide-up border-white/10 relative overflow-hidden">
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Üretim Kaydı</h3>
                <p className="text-slate-500 font-bold text-sm">Üretilen ürünleri stoğa dahil edin.</p>
              </div>
              <button
                onClick={() => setShowUretimModal(false)}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleUretimSubmit} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">HEDEF ÜRÜN *</label>
                <select
                  required
                  value={uretimData.urun_id}
                  onChange={(e) => setUretimData({ ...uretimData, urun_id: e.target.value })}
                  className="premium-input h-14"
                >
                  <option value="">ÜRÜN SEÇİN...</option>
                  {urunler.map(u => (
                    <option key={u.id} value={u.id}>{u.ad.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ÜRETİM MİKTARI *</label>
                  <input
                    type="number"
                    required
                    value={uretimData.miktar}
                    onChange={(e) => setUretimData({ ...uretimData, miktar: parseFloat(e.target.value) || 0 })}
                    className="premium-input h-14 font-black"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ÜRETİM TARİHİ</label>
                  <input
                    type="date"
                    value={uretimData.tarih}
                    onChange={(e) => setUretimData({ ...uretimData, tarih: e.target.value })}
                    className="premium-input h-14 font-black"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">NOT / AÇIKLAMA</label>
                <textarea
                  value={uretimData.aciklama}
                  onChange={(e) => setUretimData({ ...uretimData, aciklama: e.target.value })}
                  className="premium-input p-4 h-24 resize-none"
                  placeholder="Dahili üretim kaydı notu..."
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowUretimModal(false)}
                  className="flex-1 h-16 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-2xl"
                >
                  İPTAL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`premium-button flex-1 h-16 text-xs uppercase tracking-widest font-black ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>KAYDEDİLİYOR...</span>
                    </div>
                  ) : 'ÜRETİMİ KAYDET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
