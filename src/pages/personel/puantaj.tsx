import React, { useState, useEffect, useMemo } from 'react';
import {
    personel as personelApi,
    Personel,
    PuantajRecord,
    MaasOzeti
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    Info,
    DollarSign,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

const PuantajTakibiPage = () => {
    const { selectedProfile } = useProfile();
    const [personelList, setPersonelList] = useState<Personel[]>([]);
    const [loading, setLoading] = useState(true);
    const [yil, setYil] = useState(new Date().getFullYear());
    const [ay, setAy] = useState(new Date().getMonth() + 1);
    const [puantajRecords, setPuantajRecords] = useState<Record<string, Record<string, string>>>({}); // personelId -> tarih -> durum
    const [maasOzetleri, setMaasOzetleri] = useState<Record<string, MaasOzeti>>({});

    const gunSayisi = useMemo(() => new Date(yil, ay, 0).getDate(), [yil, ay]);
    const gunler = useMemo(() => Array.from({ length: gunSayisi }, (_, i) => i + 1), [gunSayisi]);

    useEffect(() => {
        if (selectedProfile) {
            loadData();
        }
    }, [selectedProfile, yil, ay]);

    const loadData = async () => {
        try {
            setLoading(true);
            const pRes = await personelApi.getAll(selectedProfile!.id);
            if (pRes.data) {
                setPersonelList(pRes.data);

                // Tüm personeller için puantaj ve maaş özeti çek
                const pRecords: Record<string, Record<string, string>> = {};
                const mOzetleri: Record<string, MaasOzeti> = {};

                await Promise.all(pRes.data.map(async (p) => {
                    const qRes = await personelApi.getPuantaj(p.id, yil, ay);
                    if (qRes.data) {
                        const dayMap: Record<string, string> = {};
                        qRes.data.forEach((r: PuantajRecord) => {
                            const day = new Date(r.tarih).getDate();
                            dayMap[day] = r.durum;
                        });
                        pRecords[p.id] = dayMap;
                    }

                    const mRes = await personelApi.getMaasOzeti(p.id, yil, ay);
                    if (mRes.data) {
                        mOzetleri[p.id] = mRes.data;
                    }
                }));

                setPuantajRecords(pRecords);
                setMaasOzetleri(mOzetleri);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const togglePuantaj = async (personelId: string, gun: number) => {
        const currentDurum = puantajRecords[personelId]?.[gun] || 'Geldi';
        const nextDurum = currentDurum === 'Geldi' ? 'Gelmedi' : (currentDurum === 'Gelmedi' ? 'İzinli' : 'Geldi');

        const tarih = `${yil}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;

        try {
            await personelApi.savePuantaj(personelId, {
                tarih,
                durum: nextDurum,
                profile_id: selectedProfile?.id
            });

            // Local state güncelle
            setPuantajRecords(prev => ({
                ...prev,
                [personelId]: {
                    ...(prev[personelId] || {}),
                    [gun]: nextDurum
                }
            }));

            // Maaş özetini tekrar çek
            const mRes = await personelApi.getMaasOzeti(personelId, yil, ay);
            if (mRes.data) {
                setMaasOzetleri(prev => ({
                    ...prev,
                    [personelId]: mRes.data!
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
            </div>

            <div className="flex relative z-10">
                <Sidebar />

                <div className="flex-1 flex flex-col min-h-screen max-w-full">
                    <Header />

                    <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                                    <Calendar size={12} />
                                    <span>DÖNEMSEL TAKİP</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                    Puantaj <span className="text-gradient">Takvimi.</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-xl">Günlük katılım girişlerini yapın, net hak edişleri anlık olarak görün.</p>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                <button onClick={() => { if (ay === 1) { setAy(12); setYil(yil - 1); } else { setAy(ay - 1); } }} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="text-center px-6">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SEÇİLİ DÖNEM</div>
                                    <div className="text-xl font-black">{ay}/{yil}</div>
                                </div>
                                <button onClick={() => { if (ay === 12) { setAy(1); setYil(yil + 1); } else { setAy(ay + 1); } }} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Hint Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-4 bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-xs">G</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GELDİ - TAM ÜCRET</div>
                            </div>
                            <div className="flex items-center gap-4 bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10">
                                <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 font-bold text-xs">M</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GELMEDİ - KESİNTİ</div>
                            </div>
                            <div className="flex items-center gap-4 bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xs">İ</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İZİNLİ - TAM ÜCRET</div>
                            </div>
                        </div>

                        {/* Grid Section */}
                        <div className="premium-card overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-[#0f172a]/80 sticky top-0 z-20">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 min-w-[250px]">PERSONEL / MAAŞ</th>
                                            {gunler.map(g => (
                                                <th key={g} className="px-3 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-center min-w-[50px]">{g}</th>
                                            ))}
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-right min-w-[150px]">NET ÖDEME</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            <tr><td colSpan={gunSayisi + 2} className="p-20 text-center animate-skeleton opacity-20"><div className="h-4 bg-white rounded w-1/4 mx-auto"></div></td></tr>
                                        ) : personelList.length === 0 ? (
                                            <tr><td colSpan={gunSayisi + 2} className="p-20 text-center text-slate-500 uppercase tracking-widest font-black text-xs italic">Kayıtlı personel yok.</td></tr>
                                        ) : (
                                            personelList.map(p => {
                                                const ozet = maasOzetleri[p.id];
                                                return (
                                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="font-black text-slate-200 text-sm leading-none mb-1">{p.ad_soyad}</div>
                                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{p.unvan || 'PERSONEL'} · ₺{Number(p.maas).toLocaleString()}</div>
                                                        </td>
                                                        {gunler.map(g => {
                                                            const durum = puantajRecords[p.id]?.[g] || 'Geldi';
                                                            return (
                                                                <td key={g} className="px-1 py-4 text-center">
                                                                    <button
                                                                        onClick={() => togglePuantaj(p.id, g)}
                                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all border ${durum === 'Geldi' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                                                durum === 'Gelmedi' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' :
                                                                                    'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                                            }`}
                                                                    >
                                                                        {durum === 'Geldi' ? 'G' : (durum === 'Gelmedi' ? 'M' : 'İ')}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-8 py-6 text-right">
                                                            {ozet ? (
                                                                <div className="space-y-1">
                                                                    <div className="text-lg font-black text-emerald-400 tracking-tighter leading-none">₺{Number(ozet.odenecek_maas).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{ozet.eksik_gun > 0 ? `${ozet.eksik_gun} GÜN EKSİK` : 'TAM PUANTAJ'}</div>
                                                                </div>
                                                            ) : '---'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PuantajTakibiPage;
