import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { odemeler as odemelerApi, cariler as carilerApi, Odeme, Cari } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import SearchableSelect from '../../components/ui/SearchableSelect';

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
      // Silent return preserved
      return;

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
      console.error('Ödeme eklenirken bir hata oluştu!');

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
      console.error('Ödeme silinirken bir hata oluştu!');

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
    .reduce((sum, o) => sum + parseFloat((o.tutar || 0).toString()), 0);

  const toplamVerilen = odemeler
    .filter(o => o.tip === 'Tediye')
    .reduce((sum, o) => sum + parseFloat((o.tutar || 0).toString()), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-xs tracking-widest uppercase">Finansal Veriler İşleniyor...</p>
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
          <p className="text-slate-400 font-medium mb-8">Ödemeleri yönetmek için bir profil seçmelisiniz.</p>
          <button onClick={() => window.location.reload()} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600 hover:bg-indigo-700 border-indigo-500/30">YENİDEN DENE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[140px] animate-aurora-2"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[120px] animate-aurora-1"></div>
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
                  <i className="ri-money-dollar-circle-line"></i>
                  <span>FİNANS VE KASA YÖNETİMİ</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Nakit <span className="text-gradient from-indigo-400 to-purple-500">Akışı.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Tahsilat ve tediye işlemlerinizi kaydedin, kasanızın anlık durumunu izleyin.</p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="premium-button px-8 h-16 text-sm uppercase tracking-widest group bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white"
              >
                <span>YENİ İŞLEM EKLE</span>
                <i className="ri-add-line text-xl group-hover:rotate-90 transition-transform"></i>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-8 border-emerald-500/10 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
                  <i className="ri-arrow-left-down-line text-9xl -rotate-12 translate-x-8 -translate-y-8"></i>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 transition-colors group-hover:text-white text-emerald-500">
                    <i className="ri-arrow-left-down-line text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOPLAM TAHSİLAT</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black tracking-tighter text-white">₺{toplamAlınan.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">GELEN NAKİT AKIŞI</div>
                </div>
              </div>

              <div className="premium-card p-8 border-rose-500/10 hover:border-rose-500/30 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
                  <i className="ri-arrow-right-up-line text-9xl -rotate-12 translate-x-8 -translate-y-8"></i>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500 transition-colors group-hover:text-white text-rose-500">
                    <i className="ri-arrow-right-up-line text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOPLAM TEDİYE</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black tracking-tighter text-white">₺{toplamVerilen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">ÇIKAN NAKİT AKIŞI</div>
                </div>
              </div>

              <div className="premium-card p-8 border-indigo-500/10 hover:border-indigo-500/30 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
                  <i className="ri-wallet-3-line text-9xl -rotate-12 translate-x-8 -translate-y-8"></i>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500 transition-colors group-hover:text-white text-indigo-500">
                    <i className="ri-wallet-3-line text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NET DURUM</span>
                </div>
                <div className="space-y-1">
                  <div className={`text-3xl font-black tracking-tighter ${toplamAlınan - toplamVerilen >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    ₺{(toplamAlınan - toplamVerilen).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KASA BAKİYESİ</div>
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md group">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="text"
                    placeholder="Cari adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-12 h-14"
                  />
                </div>
                <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl">
                  {['all', 'Tahsilat', 'Tediye'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-500 hover:text-white'
                        }`}
                    >
                      {type === 'all' ? 'TÜMÜ' : type === 'Tahsilat' ? 'TAHSİLAT' : 'TEDİYE'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOdemeler.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <i className="ri-money-dollar-circle-line text-5xl text-slate-700"></i>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-200 uppercase">İşlem Bulunamadı</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto uppercase tracking-widest text-[10px]">Herhangi bir ödeme veya tahsilat işlemi kaydı bulunamadı.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CARİ HESAP</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İŞLEM TİPİ</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ÖDEME YÖNTEMİ</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TARİH</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TUTAR</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKSİYON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredOdemeler.map((odeme) => (
                        <tr key={odeme.id} className="hover:bg-white/[0.02] transition-colors group/row">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-300">{odeme.cari_ad.toUpperCase()}</div>
                            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{odeme.aciklama || 'Açıklama yok'}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${odeme.tip === 'Tahsilat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                              {odeme.tip === 'Tahsilat' ? 'TAHSİLAT (GİRİŞ)' : 'TEDİYE (ÇIKIŞ)'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="inline-flex items-center gap-2 text-slate-400 font-bold">
                              <i className={`text-lg ${odeme.odeme_yontemi === 'Nakit' ? 'ri-money-cny-box-line' :
                                odeme.odeme_yontemi === 'Kredi Kartı' ? 'ri-bank-card-line' :
                                  'ri-bank-line'
                                }`}></i>
                              <span className="uppercase tracking-widest text-[10px]">{odeme.odeme_yontemi}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-slate-500 font-bold">
                            {new Date(odeme.tarih).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-8 py-6">
                            <div className={`text-lg font-black tracking-tighter ${odeme.tip === 'Tahsilat' ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {odeme.tip === 'Tahsilat' ? '+ ₺' : '- ₺'}{(parseFloat((odeme.tutar || 0).toString()) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                              onClick={() => { setSelectedOdeme(odeme); setShowDeleteModal(true); }}
                              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-white transition-all opacity-0 group-hover/row:opacity-100"
                            >
                              <i className="ri-delete-bin-line"></i>
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
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="premium-card p-0 w-full max-w-2xl animate-slide-up border-white/10 relative overflow-hidden">
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Finansal İşlem Girişi</h3>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest text-indigo-400/80">Kasa hareketini veya cari ödemeyi kaydedin.</p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <SearchableSelect
                    label="CARİ HESAP SEÇİMİ *"
                    options={cariler.map(c => ({ id: c.id, name: c.ad, subText: c.vergi_no }))}
                    value={formData.cari_id}
                    onChange={(value) => handleCariChange(value)}
                    placeholder="CARİ SEÇİN..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">İŞLEM TİPİ *</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl h-14">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tip: 'Tahsilat' })}
                      className={`rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.tip === 'Tahsilat' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                      TAHSİLAT
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tip: 'Tediye' })}
                      className={`rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.tip === 'Tediye' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                      TEDİYE
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">İŞLEM TUTARI ₺ *</label>
                  <input
                    type="number"
                    value={formData.tutar}
                    onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                    className="premium-input h-14 font-black text-lg"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">İŞLEM TARİHİ *</label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className="premium-input h-14 font-black"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ÖDEME YÖNTEMİ *</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {['Nakit', 'Banka Kartı', 'Kredi Kartı', 'Banka Transferi'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, odeme_yontemi: method })}
                        className={`h-14 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border ${formData.odeme_yontemi === method
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">BORÇ/ALACAK NOTU</label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  className="premium-input p-6 h-32 resize-none"
                  placeholder="İşlem detayı hakkında kısa bir not..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 h-14 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-2xl"
                >
                  VAZGEÇ
                </button>
                <button
                  type="submit"
                  className="premium-button flex-[2] h-14 text-[10px] tracking-widest uppercase font-black bg-indigo-600 hover:bg-indigo-700 border-indigo-500/30 text-white"
                >
                  İŞLEMİ KAYDET VE BİTİR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="premium-card p-10 w-full max-w-md animate-slide-up border-red-500/20 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <i className="ri-delete-bin-line text-4xl text-red-500"></i>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4">İşlemi Sil</h3>
            <p className="text-slate-400 font-medium mb-10">
              Bu finansal hareketi sildiğinizde cari bakiye ve kasa durumu anında güncellenecektir. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedOdeme(null); }}
                className="flex-1 h-14 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-2xl"
              >
                VAZGEÇ
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                ONAYLA VE SİL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
