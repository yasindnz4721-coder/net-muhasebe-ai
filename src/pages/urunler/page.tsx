import React, { useState, useEffect, useMemo } from 'react';
import {
  urunler as urunlerApi,
  kategoriler as kategorilerApi,
  Urun,
  Kategori
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';

const UrunlerPage = () => {
  const { selectedProfile, loading: profileLoading, error: profileError } = useProfile();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState<Partial<Urun>>({
    ad: '',
    urun_tipi: 'Ürün',
    birim: 'Adet',
    stok_miktari: 0,
    alis_fiyati: 0,
    satis_fiyati: 0,
    kdv_orani: 20,
    otv_orani: 0,
    oiv_orani: 0,
    stok_takibi: true,
    kategori_id: '',
    urun_kodu: '',
    urun_barkodu: ''
  });

  useEffect(() => {
    if (selectedProfile) {
      loadData();
    }
  }, [selectedProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [urunRes, katRes] = await Promise.all([
        urunlerApi.getAll(selectedProfile!.id),
        kategorilerApi.getAll(selectedProfile!.id)
      ]);
      if (urunRes.data) setUrunler(urunRes.data);
      if (katRes.data) setKategoriler(katRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedProfile) return;

      const createData = {
        ...formData,
        profile_id: selectedProfile.id,
        ad: formData.ad || '',
        kategori_id: formData.kategori_id || '',
        birim: formData.birim || 'Adet',
        stok_miktari: formData.stok_miktari || 0,
      };

      await urunlerApi.create(createData as any);
      setShowModal(false);
      loadData();
      setFormData({
        ad: '', urun_tipi: 'Ürün', birim: 'Adet', stok_miktari: 0,
        alis_fiyati: 0, satis_fiyati: 0, kdv_orani: 20, otv_orani: 0,
        oiv_orani: 0, stok_takibi: true, kategori_id: '', urun_kodu: '', urun_barkodu: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      await urunlerApi.delete(id);
      loadData();
    }
  };

  const filteredUrunler = useMemo(() => {
    return urunler.filter(u => {
      const matchesSearch = u.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.urun_kodu && u.urun_kodu.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesKategori = filterKategori === 'all' || u.kategori === filterKategori;
      return matchesSearch && matchesKategori;
    });
  }, [urunler, searchTerm, filterKategori]);

  const toplamUrunSayisi = urunler.length;
  const toplamStokDegeri = urunler.reduce((acc, curr) => acc + (Number(curr.stok_miktari) * Number(curr.satis_fiyati)), 0);
  const dusukStokUrunler = urunler.filter(u => u.stok_miktari && u.stok_miktari < 10);

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-xs tracking-widest uppercase">Veriler İşleniyor...</p>
        </div>
      </div>
    );
  }

  if (profileError || !selectedProfile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Erişimi Gerekli</h3>
          <p className="text-slate-400 font-medium mb-8">Lütfen bir profil seçin.</p>
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
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <i className="ri-box-3-line"></i>
                  <span>STOK VE ENVANTER</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Ürün <span className="text-gradient">Portföyü.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Envanterinizi modern bir arayüzle takip edin.</p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-indigo-600/20 flex items-center gap-3"
              >
                <span>YENİ ÜRÜN EKLE</span>
                <i className="ri-add-line text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="premium-card p-8 group transition-all">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TOPLAM ÜRÜN</h4>
                <div className="text-4xl font-black tracking-tighter">{toplamUrunSayisi}</div>
              </div>

              <div className="premium-card p-8 group transition-all">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ENVANTER DEĞERİ</h4>
                <div className="text-4xl font-black tracking-tighter text-emerald-400">₺{toplamStokDegeri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="premium-card p-8 group transition-all">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">KRİTİK STOK</h4>
                <div className="text-4xl font-black tracking-tighter text-rose-500">{dusukStokUrunler.length}</div>
              </div>
            </div>

            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
                <div className="relative w-full md:max-w-md group">
                  <i className="ri-search-line absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="text"
                    placeholder="Ürün adı veya kodu ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-16 h-14"
                  />
                </div>
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="premium-input h-14 px-10 min-w-[200px]"
                >
                  <option value="all">TÜM KATEGORİLER</option>
                  {kategoriler.map(kat => (
                    <option key={kat.id} value={kat.ad}>{kat.ad.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#0f172a] shadow-sm">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ÜRÜN DETAYI</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KATEGORİ</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">STOK</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">FİYAT</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKSİYON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredUrunler.map((urun) => (
                      <tr key={urun.id} className="hover:bg-white/[0.02] transition-all group/row">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <i className="ri-box-3-line text-xl opacity-50"></i>
                            </div>
                            <div>
                              <div className="font-black text-slate-200 text-lg leading-none">{urun.ad}</div>
                              <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest italic">KOD: {urun.urun_kodu || '---'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 tracking-widest uppercase">
                            {urun.kategori || 'Genel'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-lg font-black text-slate-200">
                            {urun.stok_miktari?.toLocaleString() || 0} <span className="text-xs font-bold text-slate-500">{urun.birim}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-lg font-black text-emerald-400">
                            ₺{Number(urun.satis_fiyati || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                            <button onClick={() => handleDelete(urun.id)} className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="premium-card p-0 w-full max-w-4xl animate-slide-up border-white/10 relative overflow-hidden">
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Ürün Kaydet</h3>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ÜRÜN ADI *</label>
                  <input type="text" required value={formData.ad} onChange={e => setFormData({ ...formData, ad: e.target.value })} className="premium-input h-14" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">KATEGORİ</label>
                  <select value={formData.kategori_id} onChange={e => setFormData({ ...formData, kategori_id: e.target.value })} className="premium-input h-14">
                    <option value="">Seçiniz</option>
                    {kategoriler.map(kat => <option key={kat.id} value={kat.id}>{kat.ad}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ALIŞ FİYATI</label>
                  <input type="number" value={formData.alis_fiyati} onChange={e => setFormData({ ...formData, alis_fiyati: Number(e.target.value) })} className="premium-input h-14" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">SATIŞ FİYATI</label>
                  <input type="number" value={formData.satis_fiyati} onChange={e => setFormData({ ...formData, satis_fiyati: Number(e.target.value) })} className="premium-input h-14" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">STOK MİKTARI</label>
                  <input type="number" value={formData.stok_miktari} onChange={e => setFormData({ ...formData, stok_miktari: Number(e.target.value) })} className="premium-input h-14" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BİRİM</label>
                  <select 
                    value={formData.birim} 
                    onChange={e => setFormData({ ...formData, birim: e.target.value })} 
                    className="premium-input h-14 font-black"
                  >
                    <option value="Adet">ADET</option>
                    <option value="Kg">KİLOGRAM (KG)</option>
                    <option value="Litre">LİTRE (L)</option>
                    <option value="Metre">METRE (M)</option>
                    <option value="Paket">PAKET</option>
                    <option value="Koli">KOLİ</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase hover:text-white">İPTAL</button>
                <button type="submit" className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl">KAYDET</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrunlerPage;
