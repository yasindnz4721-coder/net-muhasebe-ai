import React, { useState, useEffect } from 'react';
import {
  odemeler as odemelerApi,
  Odeme,
  cariler as carilerApi,
  Cari,
  kasalar as kasalarApi,
  Kasa
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
  CreditCard,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown
} from 'lucide-react';

const OdemelerPage = () => {
  const { selectedProfile } = useProfile();
  const [odemeList, setOdemeList] = useState<Odeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTip, setFilterTip] = useState('all');
  const [anaKasa, setAnaKasa] = useState<Kasa | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [kasalar, setKasalar] = useState<Kasa[]>([]);
  const [formData, setFormData] = useState<Partial<Odeme>>({
    tip: 'Tahsilat',
    tutar: 0,
    tarih: new Date().toISOString().split('T')[0],
    odeme_yontemi: 'Nakit',
    aciklama: ''
  });

  useEffect(() => {
    if (selectedProfile) {
      loadOdemeler();
    }
  }, [selectedProfile]);

  const loadOdemeler = async () => {
    try {
      setLoading(true);
      const [odemelerRes, kasalarRes, carilerRes] = await Promise.all([
        odemelerApi.getAll(selectedProfile!.id),
        kasalarApi.getAll(selectedProfile!.id),
        carilerApi.getAll(selectedProfile!.id)
      ]);

      if (odemelerRes.data) setOdemeList(odemelerRes.data);
      if (kasalarRes.data) {
        setKasalar(kasalarRes.data);
        const defaultKasa = kasalarRes.data.find(k => k.is_default) || kasalarRes.data[0];
        setAnaKasa(defaultKasa);
        if (defaultKasa) {
          setFormData(prev => ({ ...prev, kasa_id: defaultKasa.id }));
        }
      }
      if (carilerRes.data) setCariler(carilerRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedProfile) return;
      const selectedCari = cariler.find(c => c.id === formData.cari_id);

      const res = await odemelerApi.create({
        ...formData,
        tarih: formData.tarih === new Date().toISOString().split('T')[0] ? new Date().toISOString() : new Date(formData.tarih!).toISOString(),
        cari_ad: selectedCari?.ad || 'Genel',
        profile_id: selectedProfile.id
      } as any);

      if (res.data) {
        setShowModal(false);
        loadOdemeler();
        setFormData({
          tip: 'Tahsilat',
          tutar: 0,
          tarih: new Date().toISOString().split('T')[0],
          odeme_yontemi: 'Nakit',
          aciklama: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = odemeList.filter(o => {
    const matchesSearch = o.cari_ad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTip = filterTip === 'all' || o.tip === filterTip;
    return matchesSearch && matchesTip;
  });

  const toplamTahsilat = odemeList.filter(o => ['Tahsilat', 'Alınan Ödeme', 'Gelir'].includes(o.tip)).reduce((acc, curr) => acc + Number(curr.tutar), 0);
  const toplamOdeme = odemeList.filter(o => ['Ödeme', 'Tediye', 'Gider', 'Verilen Ödeme'].includes(o.tip)).reduce((acc, curr) => acc + Number(curr.tutar), 0);

  if (!selectedProfile) return null;

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
                  <i className="ri-wallet-line"></i>
                  <span>KASA & NAKİT AKIŞI</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Ödemeler <span className="text-gradient">Defteri.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Tahsilat ve ödeme hareketlerinizi takip edin, borç ve alacak dengesini koruyun.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setFormData({ ...formData, tip: 'Tahsilat', kasa_id: anaKasa?.id || '' });
                    setShowModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3"
                >
                  <ArrowUpRight size={20} /> TAHSİLAT EKLE
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...formData, tip: 'Ödeme', kasa_id: anaKasa?.id || '' });
                    setShowModal(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-8 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3"
                >
                  <ArrowDownLeft size={20} /> ÖDEME EKLE
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="premium-card p-8 group transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KASA BAKİYESİ (ANA KASA)</span>
                  <div className="text-4xl font-black tracking-tighter text-white">₺{(toplamTahsilat - toplamOdeme).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Wallet size={24} />
                </div>
              </div>

              <div className="premium-card p-8 group transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM TAHSİLAT</span>
                  <div className="text-4xl font-black tracking-tighter text-emerald-400">₺{toplamTahsilat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="premium-card p-8 group transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM ÖDEME</span>
                  <div className="text-4xl font-black tracking-tighter text-rose-400">₺{toplamOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400">
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
                <div className="relative w-full md:max-w-md group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Cari adı veya açıklama ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-16 h-14"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={filterTip}
                    onChange={e => setFilterTip(e.target.value)}
                    className="premium-input h-14 px-10 min-w-[200px]"
                  >
                    <option value="all">TÜMÜ</option>
                    <option value="Tahsilat">SADECE TAHSİLAT</option>
                    <option value="Ödeme">SADECE ÖDEME</option>
                  </select>
                </div>
              </div>

              <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-[#0f172a]">
                    <tr className="bg-[#0f172a]/50">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İŞLEM TİPİ</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CARİ / MÜŞTERİ</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TARİH</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ÖDEME YÖNTEMİ</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">TUTAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-skeleton h-20">
                          <td colSpan={5} className="px-8 py-6 opacity-10"><div className="h-4 bg-white/20 rounded"></div></td>
                        </tr>
                      ))
                    ) : filteredList.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">İşlem bulunamadı.</td></tr>
                    ) : (
                      filteredList.map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${o.tip === 'Tahsilat' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                <i className={o.tip === 'Tahsilat' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
                              </div>
                              <span className="font-black text-white text-xs tracking-tight uppercase">{o.tip}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-black text-slate-200 text-sm uppercase">{o.cari_ad}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60 truncate max-w-[200px]">{o.aciklama || 'Açıklama yok'}</div>
                          </td>
                          <td className="px-8 py-6 text-slate-400 font-bold">
                            {new Date(o.tarih).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-400">
                              {o.odeme_yontemi.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`text-lg font-black tracking-tighter ${o.tip === 'Tahsilat' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ₺{Number(o.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden p-4 space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="mobile-card animate-skeleton">
                      <div className="h-4 bg-white/10 rounded w-1/3"></div>
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                  ))
                ) : filteredList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">İşlem bulunamadı.</div>
                ) : (
                  filteredList.map((o) => (
                    <div key={o.id} className="mobile-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${o.tip === 'Tahsilat' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            <i className={`text-sm ${o.tip === 'Tahsilat' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}`}></i>
                          </div>
                          <span className="font-black text-white text-[10px] tracking-widest uppercase">{o.tip}</span>
                        </div>
                        <span className={`text-lg font-black tracking-tighter ${o.tip === 'Tahsilat' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₺{Number(o.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-slate-200 text-sm uppercase">{o.cari_ad}</div>
                          <div className="text-[9px] text-slate-600 font-bold truncate max-w-[180px]">{o.aciklama || 'Açıklama yok'}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(o.tarih).toLocaleDateString('tr-TR')}</span>
                        <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-black tracking-widest uppercase text-slate-400">{o.odeme_yontemi.toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-end md:items-center justify-center z-[100] p-0 md:p-4 animate-fade-in">
          <div className="premium-card p-0 w-full h-[95vh] md:h-auto md:max-w-2xl animate-slide-up border-white/10 relative overflow-hidden rounded-t-[32px] md:rounded-[2.5rem]">
            <div className="px-6 md:px-10 py-8 md:py-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-none">
                  {formData.tip === 'Tahsilat' ? 'Yeni Tahsilat' : 'Yeni Ödeme'}
                </h3>
                <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest">Kasa hareketini sisteme kaydedin.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto max-h-[calc(95vh-130px)] md:max-h-none">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">İLGİLİ CARİ</label>
                <select
                  required
                  value={formData.cari_id || ''}
                  onChange={e => setFormData({ ...formData, cari_id: e.target.value })}
                  className="premium-input h-14"
                >
                  <option value="">Cari Seçin...</option>
                  {cariler.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TUTAR (₺)</label>
                  <input
                    type="number"
                    required
                    value={formData.tutar || ''}
                    onChange={e => setFormData({ ...formData, tutar: Number(e.target.value) })}
                    className="premium-input h-14"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TARİH</label>
                  <input
                    type="date"
                    required
                    value={formData.tarih}
                    onChange={e => setFormData({ ...formData, tarih: e.target.value })}
                    className="premium-input h-14"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ÖDEME YÖNTEMİ</label>
                  <select
                    value={formData.odeme_yontemi}
                    onChange={e => setFormData({ ...formData, odeme_yontemi: e.target.value })}
                    className="premium-input h-14"
                  >
                    <option value="Nakit">NAKİT</option>
                    <option value="Banka">BANKA TRANSFERİ</option>
                    <option value="Kredi Kartı">KREDİ KARTI</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">KASA</label>
                  <select
                    required
                    value={formData.kasa_id || ''}
                    onChange={e => setFormData({ ...formData, kasa_id: e.target.value })}
                    className="premium-input h-14"
                  >
                    <option value="">Kasa Seçin...</option>
                    {kasalar.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">AÇIKLAMA</label>
                <input
                  type="text"
                  value={formData.aciklama}
                  onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                  className="premium-input h-14"
                  placeholder="Ödeme açıklaması..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">İPTAL</button>
                <button
                  type="submit"
                  className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${formData.tip === 'Tahsilat' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'}`}
                >
                  {formData.tip === 'Tahsilat' ? 'TAHSİLAT KAYDET' : 'ÖDEME KAYDET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdemelerPage;
