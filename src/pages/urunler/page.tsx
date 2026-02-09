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
    stok_miktari: 0,
    urun_tipi: 'Ürün',
    urun_cinsi: '',
    urun_kodu: '',
    urun_barkodu: '',
    kategori_id: '',
    alis_fiyati: 0,
    satis_fiyati: 0,
    alis_kdv_dahil: false,
    satis_kdv_dahil: false,
    kdv_orani: 20,
    otv_orani: 0,
    oiv_orani: 0,
    stok_takibi: true,
    stok_uyari_limiti: 10
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

      const payload = {
        ...formData,
        profile_id: selectedProfile.id,
        stok_miktari: Number(formData.stok_miktari),
        alis_fiyati: Number(formData.alis_fiyati),
        satis_fiyati: Number(formData.satis_fiyati),
        stok_uyari_limiti: Number(formData.stok_uyari_limiti),
        kdv_orani: Number(formData.kdv_orani),
        otv_orani: Number(formData.otv_orani),
        oiv_orani: Number(formData.oiv_orani)
      };

      const { error: insertError } = await urunlerApi.create(payload);

      if (insertError) throw new Error(insertError);

      setShowModal(false);
      setFormData({
        ad: '',
        birim: 'Adet',
        stok_miktari: 0,
        urun_tipi: 'Ürün',
        urun_cinsi: '',
        urun_kodu: '',
        urun_barkodu: '',
        kategori_id: '',
        alis_fiyati: 0,
        satis_fiyati: 0,
        alis_kdv_dahil: false,
        satis_kdv_dahil: false,
        kdv_orani: 20,
        otv_orani: 0,
        oiv_orani: 0,
        stok_takibi: true,
        stok_uyari_limiti: 10
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
    const fiyat = parseFloat((u.satis_fiyati || 0).toString()) || 0;
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                <i className="ri-box-3-line"></i>
                <span>STOK VE ENVANTER</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
                Ürün <span className="text-indigo-600">Portföyü.</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-xl">Ürünlerinizi, stok seviyelerinizi ve ticari değerlerinizi akıllıca takip edin.</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-16 rounded-[24px] font-black text-xs tracking-[0.1em] uppercase hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-900/40 flex items-center gap-3"
            >
              <span>YENİ ÜRÜN EKLE</span>
              <i className="ri-add-line text-xl"></i>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <i className="ri-product-hunt-line text-2xl"></i>
                </div>
                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">TOPLAM ÜRÜN</span>
              </div>
              <div className="text-4xl font-black tracking-tighter text-slate-900">{toplamUrunSayisi}</div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <i className="ri-money-dollar-circle-line text-2xl"></i>
                </div>
                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">ENVANTER DEĞERİ</span>
              </div>
              <div className="text-4xl font-black tracking-tighter text-emerald-600">₺{toplamStokDegeri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                  <i className="ri-alert-line text-2xl"></i>
                </div>
                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">KRİTİK STOK</span>
              </div>
              <div className="text-4xl font-black tracking-tighter text-rose-500">{dusukStokUrunler.length}</div>
            </div>
          </div>

          {/* Inventory Table Section */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30">
              <div className="relative w-full md:max-w-md group">
                <i className="ri-search-line absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                <input
                  type="text"
                  placeholder="Ürün adı veya kodu ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="h-14 px-6 bg-white border border-slate-200 rounded-2xl font-black text-[10px] tracking-widest uppercase focus:border-indigo-500 transition-all outline-none md:w-64"
                >
                  <option value="all">TÜM KATEGORİLER</option>
                  {kategoriler.map(kat => (
                    <option key={kat.id} value={kat.ad}>{kat.ad.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredUrunler.length === 0 ? (
              <div className="p-24 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-200">
                  <i className="ri-box-3-line text-5xl"></i>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Ürün Bulunamadı</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ÜRÜN DETAYI</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">KATEGORİ</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">STOK</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">FİYAT (KDV DAHİL)</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AKSİYON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredUrunler.map((urun) => (
                      <tr key={urun.id} className="hover:bg-indigo-50/30 transition-all group/row">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                              <i className="ri-box-3-fill text-xl text-indigo-500/50"></i>
                            </div>
                            <div>
                              <div className="font-black text-slate-800 tracking-tight text-lg leading-none">{urun.ad}</div>
                              <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest italic">KOD: {urun.urun_kodu || `#${urun.id.substring(0, 6)}`}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 tracking-widest uppercase">
                            {urun.kategori || 'Genel'}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-bold">
                          <div className="text-lg font-black text-slate-800">
                            {urun.stok_miktari?.toLocaleString() || 0} <span className="text-xs font-bold text-slate-400">{urun.birim}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-lg font-black text-emerald-600">
                            ₺{Number(urun.satis_fiyati || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                            <button className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(urun.id)}
                              className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
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

      {/* Expanded Modal UI */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl flex flex-col my-auto border border-white animate-slide-up relative overflow-hidden">
            <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">Ürün Kaydet</h3>
                <p className="text-slate-500 font-bold text-sm">Envanterinize yeni bir değer ekleyin.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Sol Kolon - Genel Bilgiler */}
                <div className="space-y-10">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-3 flex items-center gap-2">
                      <i className="ri-information-line"></i> Genel Bilgiler
                    </h4>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">BAŞLIK / ÜRÜN ADI *</label>
                      <input
                        type="text" required
                        value={formData.ad}
                        onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                        className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg focus:bg-white focus:border-indigo-500 transition-all outline-none"
                        placeholder="Örn: Akıllı Telefon / Danışmanlık Hizmeti"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ürün Tipi</label>
                        <select
                          value={formData.urun_tipi}
                          onChange={(e) => setFormData({ ...formData, urun_tipi: e.target.value })}
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none"
                        >
                          <option value="Ürün">Ürün</option>
                          <option value="Hizmet">Hizmet</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori</label>
                        <select
                          value={formData.kategori_id}
                          onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none"
                        >
                          <option value="">Seçiniz...</option>
                          {kategoriler.map(kat => (
                            <option key={kat.id} value={kat.id}>{kat.ad}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ürün Kodu</label>
                        <input
                          type="text"
                          value={formData.urun_kodu}
                          onChange={(e) => setFormData({ ...formData, urun_kodu: e.target.value })}
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none"
                          placeholder="UR-12345"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Barkod</label>
                        <input
                          type="text"
                          value={formData.urun_barkodu}
                          onChange={(e) => setFormData({ ...formData, urun_barkodu: e.target.value })}
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none"
                          placeholder="86900000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ÜRETİM REÇETESİ</label>
                      <div className="h-16 px-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center justify-between text-slate-400 font-bold text-sm cursor-not-allowed italic">
                        <span>Üst Model / Reçete Bağla</span>
                        <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Çok Yakında</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ Kolon - Stok ve Fiyat */}
                <div className="space-y-10">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-3 flex items-center gap-2">
                      <i className="ri-database-2-line"></i> Stok & Fiyat
                    </h4>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Birim</label>
                        <select
                          value={formData.birim}
                          onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                        >
                          <option value="Adet">Adet</option>
                          <option value="Kg">Kg</option>
                          <option value="Lt">Litre</option>
                          <option value="M">Metre</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Başlangıç Stoğu</label>
                        <input
                          type="number"
                          value={formData.stok_miktari}
                          onChange={(e) => setFormData({ ...formData, stok_miktari: Number(e.target.value) })}
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Stok Takibi Yapılsın</span>
                        <span className="text-[10px] text-slate-400 font-bold italic">Sıfıra inince uyarı verir.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, stok_takibi: !formData.stok_takibi })}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.stok_takibi ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.stok_takibi ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Alış Fiyatı (KDV Hariç)</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">₺</span>
                          <input
                            type="number" step="0.01"
                            value={formData.alis_fiyati}
                            onChange={(e) => setFormData({ ...formData, alis_fiyati: Number(e.target.value) })}
                            className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Satış Fiyatı (KDV Hariç)</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">₺</span>
                          <input
                            type="number" step="0.01"
                            value={formData.satis_fiyati}
                            onChange={(e) => setFormData({ ...formData, satis_fiyati: Number(e.target.value) })}
                            className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">KDV %</label>
                        <input
                          type="number"
                          value={formData.kdv_orani}
                          onChange={(e) => setFormData({ ...formData, kdv_orani: Number(e.target.value) })}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ÖTV %</label>
                        <input
                          type="number"
                          value={formData.otv_orani}
                          onChange={(e) => setFormData({ ...formData, otv_orani: Number(e.target.value) })}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ÖİV %</label>
                        <input
                          type="number"
                          value={formData.oiv_orani}
                          onChange={(e) => setFormData({ ...formData, oiv_orani: Number(e.target.value) })}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-10 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors border border-slate-200 rounded-2xl"
                >
                  İPTAL
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 text-white flex-1 h-16 rounded-[24px] font-black text-xs tracking-[0.1em] uppercase hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/40"
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
