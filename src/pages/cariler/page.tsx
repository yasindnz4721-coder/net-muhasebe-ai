import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cariler as carilerApi,
  Cari
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Filter
} from 'lucide-react';

const CarilerPage = () => {
  const { selectedProfile } = useProfile();
  const navigate = useNavigate();
  const [cariList, setCariList] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Cari>>({
    ad: '',
    telefon: '',
    email: '',
    adres: '',
    vergi_no: '',
    vergi_dairesi: ''
  });

  useEffect(() => {
    if (selectedProfile) {
      loadCariler();
    }
  }, [selectedProfile]);

  const loadCariler = async () => {
    try {
      setLoading(true);
      const res = await carilerApi.getAll(selectedProfile!.id);
      if (res.data) setCariList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await carilerApi.update(formData.id, formData);
      } else {
        await carilerApi.create({ ...formData as any, profile_id: selectedProfile?.id });
      }
      setShowModal(false);
      loadCariler();
      setFormData({ ad: '', telefon: '', email: '', adres: '', vergi_no: '', vergi_dairesi: '' });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = cariList.filter(c =>
    c.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.vergi_no?.includes(searchTerm)
  );

  const toplamBorc = cariList.reduce((acc, curr) => acc + (curr.bakiye && curr.bakiye < 0 ? Math.abs(curr.bakiye) : 0), 0);
  const toplamAlacak = cariList.reduce((acc, curr) => acc + (curr.bakiye && curr.bakiye > 0 ? curr.bakiye : 0), 0);

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
                  <i className="ri-user-follow-line"></i>
                  <span>MÜŞTERİ & TEDARİKÇİ</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Cari <span className="text-gradient">Hesaplar.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Müşterilerinizi ve tedarikçilerinizi tek bir merkezden yönetin, bakiyelerini anlık takip edin.</p>
              </div>

              <button
                onClick={() => {
                  setFormData({ ad: '', telefon: '', email: '', adres: '', vergi_no: '', vergi_dairesi: '' });
                  setIsEditing(false);
                  setShowModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3"
              >
                <Plus size={20} /> YENİ CARİ EKLE
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="premium-card p-8 group hover:border-blue-500/40 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM KAYIT</span>
                  <div className="text-4xl font-black tracking-tighter text-white">{cariList.length}</div>
                </div>
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                  <Users size={24} />
                </div>
              </div>

              <div className="premium-card p-8 group hover:border-emerald-500/40 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM ALACAK</span>
                  <div className="text-4xl font-black tracking-tighter text-emerald-400">₺{toplamAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <ArrowUpRight size={24} />
                </div>
              </div>

              <div className="premium-card p-8 group hover:border-rose-500/40 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM BORÇ</span>
                  <div className="text-4xl font-black tracking-tighter text-rose-400">₺{toplamBorc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400">
                  <ArrowDownLeft size={24} />
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Müşteri adı veya vergi no ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-16 h-14"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar hidden md:block">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#0f172a] shadow-sm">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">MURAHAS / UNVAN</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İLETİŞİM</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">VERGİ BİLGİSİ</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">NET BAKİYE</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKSİYON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-skeleton h-20">
                          <td colSpan={5} className="px-8 py-6 opacity-10">
                            <div className="h-4 bg-white/20 rounded w-1/4"></div>
                          </td>
                        </tr>
                      ))
                    ) : filteredList.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">Kayıtlı cari bulunamadı.</td></tr>
                    ) : (
                      filteredList.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group/row cursor-pointer" onClick={() => navigate(`/cari-detay/${c.id}`)}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xl">
                                {c.ad.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-black text-slate-200 text-lg leading-none">{c.ad}</div>
                                <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest italic">{c.ad.includes('LTD') || c.ad.includes('A.Ş') ? 'KURUMSAL' : 'BİREYSEL'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-slate-300 font-bold">
                                <Phone size={14} className="text-slate-500" /> {c.telefon}
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Mail size={14} className="text-slate-600" /> {c.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-slate-300 font-bold">{c.vergi_no || '---'}</div>
                            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{c.vergi_dairesi || '---'}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className={`text-lg font-black tracking-tighter ${!c.bakiye || c.bakiye === 0 ? 'text-slate-500' : c.bakiye > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ₺{Number(Math.abs(c.bakiye || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              <span className="text-[10px] ml-1 opacity-60 font-black uppercase">{!c.bakiye || c.bakiye === 0 ? '' : c.bakiye > 0 ? 'ALACAK' : 'BORÇ'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                              <button onClick={(e) => { e.stopPropagation(); setFormData(c); setIsEditing(true); setShowModal(true); }} className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 border border-indigo-500/20 transition-all flex items-center justify-center">
                                <Edit2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden p-4 space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="mobile-card animate-skeleton">
                      <div className="h-4 bg-white/10 rounded w-1/3"></div>
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                  ))
                ) : filteredList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">Kayıtlı cari bulunamadı.</div>
                ) : (
                  filteredList.map((c) => (
                    <div key={c.id} className="mobile-card" onClick={() => navigate(`/cari-detay/${c.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg shrink-0">
                          {c.ad.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-slate-200 text-sm leading-none truncate">{c.ad}</div>
                          <div className="text-[9px] font-bold text-slate-500 mt-1">{c.telefon}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-base font-black tracking-tighter ${!c.bakiye || c.bakiye === 0 ? 'text-slate-500' : c.bakiye > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₺{Number(Math.abs(c.bakiye || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[8px] font-black uppercase text-slate-500">{!c.bakiye || c.bakiye === 0 ? '' : c.bakiye > 0 ? 'ALACAK' : 'BORÇ'}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="text-[9px] text-slate-500 font-bold">{c.email || 'E-posta yok'}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFormData(c); setIsEditing(true); setShowModal(true); }}
                          className="mobile-action-btn bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                        >
                          <Edit2 size={14} />
                        </button>
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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[999] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="bg-white rounded-t-[32px] md:rounded-[32px] p-6 md:p-12 w-full h-[95vh] md:h-auto md:max-w-xl shadow-2xl animate-scale shadow-indigo-500/10 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                  {isEditing ? 'CARİ GÜNCELLE' : 'YENİ CARİ EKLE'}
                </h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
                  Lütfen bilgileri eksiksiz doldurunuz.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 italic">MURAHAS / UNVAN</label>
                  <input
                    type="text"
                    required
                    value={formData.ad}
                    onChange={(e) => setFormData({ ...formData, ad: e.target.value.toUpperCase() })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all uppercase placeholder:italic"
                    placeholder="MÜŞTERİ VEYA ŞİRKET ADI..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 italic">TELEFON</label>
                    <input
                      type="text"
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 italic">E-POSTA</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="ornek@mail.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 italic">VERGİ NO</label>
                    <input
                      type="text"
                      value={formData.vergi_no}
                      onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="10 HANELİ NUMARA..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 italic">VERGİ DAİRESİ</label>
                    <input
                      type="text"
                      value={formData.vergi_dairesi}
                      onChange={(e) => setFormData({ ...formData, vergi_dairesi: e.target.value.toUpperCase() })}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="DAİRE ADI..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 italic">ADRES</label>
                  <textarea
                    value={formData.adres}
                    onChange={(e) => setFormData({ ...formData, adres: e.target.value.toUpperCase() })}
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none uppercase"
                    placeholder="TAM ADRES BİLGİSİ..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all shadow-xl shadow-indigo-600/20 mt-4 active:scale-95"
              >
                {isEditing ? 'GÜNCELLEMEYİ KAYDET' : 'CARİYİ SİSTEME EKLE'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarilerPage;
