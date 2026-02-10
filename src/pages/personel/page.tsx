import React, { useState, useEffect } from 'react';
import {
    personel as personelApi,
    Personel,
    PuantajRecord
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
    Users,
    UserPlus,
    Calendar,
    Search,
    Plus,
    Edit2,
    Trash2,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PersonelPage = () => {
    const { selectedProfile } = useProfile();
    const navigate = useNavigate();
    const [personelList, setPersonelList] = useState<Personel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Personel & { absentDate?: string; advanceAmount?: number; advanceDate?: string }>>({
        ad_soyad: '',
        unvan: '',
        tckn: '',
        telefon: '',
        email: '',
        maas: 0,
        durum: 'Aktif',
        absentDate: '',
        advanceAmount: 0,
        advanceDate: new Date().toISOString().split('T')[0]
    });
    const [maasOzetleri, setMaasOzetleri] = useState<Record<string, any>>({});

    useEffect(() => {
        if (selectedProfile) {
            loadPersonel();
        }
    }, [selectedProfile]);

    const loadPersonel = async () => {
        try {
            setLoading(true);
            const res = await personelApi.getAll(selectedProfile!.id);
            if (res.data) {
                setPersonelList(res.data);

                // Maaş özetlerini yükle
                const now = new Date();
                const yil = now.getFullYear();
                const ay = now.getMonth() + 1;
                const ozetler: Record<string, any> = {};

                await Promise.all(res.data.map(async (p) => {
                    const mRes = await personelApi.getMaasOzeti(p.id, yil, ay);
                    if (mRes.data) ozetler[p.id] = mRes.data;
                }));
                setMaasOzetleri(ozetler);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let pid = formData.id;
            if (isEditing && pid) {
                await personelApi.update(pid, formData);
            } else {
                const res = await personelApi.create({ ...formData, profile_id: selectedProfile?.id });
                pid = res.data?.id;
            }

            // Eğer devamsızlık tarihi girildiyse kaydet
            if (pid && formData.absentDate) {
                await personelApi.savePuantaj(pid, {
                    tarih: formData.absentDate,
                    durum: 'Gelmedi',
                    profile_id: selectedProfile?.id
                });
            }

            // Eğer avans girildiyse kaydet
            if (pid && formData.advanceAmount && formData.advanceAmount > 0) {
                await personelApi.saveAvans(pid, {
                    tarih: formData.advanceDate || new Date().toISOString().split('T')[0],
                    tutar: formData.advanceAmount,
                    profile_id: selectedProfile?.id
                });
            }

            setShowModal(false);
            loadPersonel();
            setFormData({ ad_soyad: '', unvan: '', tckn: '', telefon: '', email: '', maas: 0, durum: 'Aktif', absentDate: '', advanceAmount: 0, advanceDate: new Date().toISOString().split('T')[0] });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (p: Personel) => {
        setFormData(p);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
            await personelApi.delete(id);
            loadPersonel();
        }
    };

    const filteredList = personelList.filter(p =>
        p.ad_soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.unvan?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                    <i className="ri-group-line"></i>
                                    <span>İNSAN KAYNAKLARI</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                    Personel <span className="text-gradient">Yönetimi.</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-xl">Ekibinizi yönetin, maaş hesaplamalarını takip edin ve puantaj kayıtlarını tutun.</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setFormData({ ad_soyad: '', unvan: '', tckn: '', telefon: '', email: '', maas: 0, durum: 'Aktif', absentDate: '', advanceAmount: 0, advanceDate: new Date().toISOString().split('T')[0] });
                                        setIsEditing(false);
                                        setShowModal(true);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3"
                                >
                                    <Plus size={20} /> YENİ PERSONEL
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="premium-card p-8 group hover:border-indigo-500/40 transition-all flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM PERSONEL</span>
                                    <div className="text-4xl font-black tracking-tighter text-white">{personelList.length}</div>
                                </div>
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                    <Users size={24} />
                                </div>
                            </div>

                            <div className="premium-card p-8 group hover:border-emerald-500/40 transition-all flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKTİF ÇALIŞAN</span>
                                    <div className="text-4xl font-black tracking-tighter text-emerald-400">{personelList.filter(p => p.durum === 'Aktif').length}</div>
                                </div>
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                    <Users size={24} />
                                </div>
                            </div>

                            <div className="premium-card p-8 group hover:border-orange-500/40 transition-all flex items-center justify-between cursor-pointer" onClick={() => navigate('/puantaj-takibi')}>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">PUANTAJ TAKİBİ</span>
                                    <div className="text-4xl font-black tracking-tighter text-orange-400">GİT</div>
                                </div>
                                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400">
                                    <Calendar size={24} />
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
                                        placeholder="Personel adı veya unvan ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="premium-input pl-16 h-14"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-[#0f172a]/50">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">PERSONEL</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İLETİŞİM</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">MAAŞ</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DURUM</th>
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
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                                                    Personel bulunamadı.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredList.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    onClick={() => handleEdit(p)}
                                                    className="hover:bg-white/[0.02] transition-colors group/row cursor-pointer"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xl">
                                                                {p.ad_soyad.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-200 text-lg leading-none">{p.ad_soyad}</div>
                                                                <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest italic">{p.unvan || 'PERSONEL'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-slate-300 font-bold">{p.telefon || 'Telefon Yok'}</div>
                                                        <div className="text-slate-500 text-xs">{p.email || 'Email Yok'}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <div className="text-lg font-black text-emerald-400 tracking-tighter leading-none">
                                                                ₺{Number(maasOzetleri[p.id]?.odenecek_maas || p.maas).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                            </div>
                                                            {maasOzetleri[p.id]?.toplam_kesinti > 0 ? (
                                                                <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider flex flex-col gap-0.5">
                                                                    <span>₺{Number(p.maas).toLocaleString()} MAAŞ</span>
                                                                    {maasOzetleri[p.id].kesinti > 0 && (
                                                                        <span className="text-rose-400">- ₺{Number(maasOzetleri[p.id].kesinti).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} DEVAMSIZLIK</span>
                                                                    )}
                                                                    {maasOzetleri[p.id].toplam_avans > 0 && (
                                                                        <span className="text-orange-400">- ₺{Number(maasOzetleri[p.id].toplam_avans).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} AVANS</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider italic opacity-50">TAM MAAŞ</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${p.durum === 'Aktif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                                {p.durum}
                                                            </span>
                                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${maasOzetleri[p.id]?.eksik_gun > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                                                <i className={maasOzetleri[p.id]?.eksik_gun > 0 ? "ri-error-warning-line" : "ri-checkbox-circle-line"}></i>
                                                                {maasOzetleri[p.id]?.eksik_gun || 0} GÜN GELMEDİ
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                                                                className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 transition-all flex items-center justify-center"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                                className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all flex items-center justify-center"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Modal UI */}
            {showModal && (
                <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="premium-card p-0 w-full max-w-2xl animate-slide-up border-white/10 relative overflow-hidden">
                        <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">
                                    {isEditing ? 'Personel Güncelle' : 'Yeni Personel'}
                                </h3>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Çalışan bilgilerini sisteme kaydedin.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">AD SOYAD *</label>
                                    <input type="text" required value={formData.ad_soyad} onChange={e => setFormData({ ...formData, ad_soyad: e.target.value })} className="premium-input h-14" placeholder="AHMET YILMAZ" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">UNVAN / GÖREV</label>
                                    <input type="text" value={formData.unvan} onChange={e => setFormData({ ...formData, unvan: e.target.value })} className="premium-input h-14" placeholder="MUHASEBE MÜDÜRÜ" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TELEFON</label>
                                    <input type="text" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} className="premium-input h-14" placeholder="05XX XXX XX XX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TC KİMLİK NO</label>
                                    <input type="text" value={formData.tckn} onChange={e => setFormData({ ...formData, tckn: e.target.value })} className="premium-input h-14" maxLength={11} placeholder="12345678901" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">MAAŞ (AYLIK)</label>
                                    <input type="number" value={formData.maas} onChange={e => setFormData({ ...formData, maas: Number(e.target.value) })} className="premium-input h-14" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">DURUM</label>
                                    <select value={formData.durum} onChange={e => setFormData({ ...formData, durum: e.target.value })} className="premium-input h-14">
                                        <option value="Aktif">AKTİF</option>
                                        <option value="Ayrıldı">AYRILDI</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-2 ml-2">
                                        <i className="ri-error-warning-line"></i>
                                        YENİ DEVAMSIZLIK (HIZLI)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.absentDate}
                                        onChange={e => setFormData({ ...formData, absentDate: e.target.value })}
                                        className="premium-input h-14 border-rose-500/20 focus:border-rose-500/50 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic flex items-center gap-2 ml-2">
                                        <i className="ri-money-dollar-circle-line"></i>
                                        YENİ AVANS EKLE
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            value={formData.advanceAmount || ''}
                                            onChange={e => setFormData({ ...formData, advanceAmount: Number(e.target.value) })}
                                            className="premium-input h-14 border-orange-500/20 focus:border-orange-500/50 flex-[1.5] text-white"
                                            placeholder="Tutar"
                                        />
                                        <input
                                            type="date"
                                            value={formData.advanceDate}
                                            onChange={e => setFormData({ ...formData, advanceDate: e.target.value })}
                                            className="premium-input h-14 border-orange-500/20 focus:border-orange-500/50 flex-1 text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">İPTAL</button>
                                <button type="submit" className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all">
                                    {isEditing ? 'GÜNCELLE' : 'PERSONEL EKLE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonelPage;
