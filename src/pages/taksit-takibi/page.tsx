import React, { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { taksitler as taksitApi, TaksitOdeme } from '../../lib/api';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';

export default function TaksitTakibiPage() {
    const { selectedProfile } = useProfile();
    const [takipVerisi, setTakipVerisi] = useState<TaksitOdeme[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        yil: new Date().getFullYear(),
        ay: new Date().getMonth() + 1
    });

    const fetchData = async () => {
        if (!selectedProfile) return;
        setLoading(true);
        try {
            const res = await taksitApi.getTakip(selectedProfile.id, filter.yil, filter.ay);
            if (res.data) setTakipVerisi(res.data);
        } catch (error) {
            console.error('Takip verisi hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedProfile, filter]);

    const isNear = (vade: string) => {
        const diff = new Date(vade).getTime() - new Date().getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 2;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="p-10 space-y-8">
                    <header className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight">Taksit <span className="text-indigo-400 italic">Takibi.</span></h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Aylık Ödeme Takvimi</p>
                        </div>
                        <div className="flex gap-4">
                            <select
                                className="premium-input h-14 w-40"
                                value={filter.ay}
                                onChange={e => setFilter({ ...filter, ay: Number(e.target.value) })}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('tr', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                className="premium-input h-14 w-32"
                                value={filter.yil}
                                onChange={e => setFilter({ ...filter, yil: Number(e.target.value) })}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </header>

                    <div className="premium-card overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vade Tarihi</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Açıklama / Cari</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tutar</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {takipVerisi.map(odeme => {
                                    const near = isNear(odeme.vade_tarihi) && odeme.durum === 'Bekliyor';
                                    return (
                                        <tr key={odeme.id} className={`hover:bg-white/[0.01] transition-colors ${near ? 'bg-orange-500/[0.03]' : ''}`}>
                                            <td className="px-8 py-6 font-bold text-sm">
                                                {new Date(odeme.vade_tarihi).toLocaleDateString('tr')}
                                                {near && <div className="text-[9px] text-orange-400 font-black uppercase mt-1 animate-pulse">Yaklaşıyor!</div>}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-xs uppercase">{odeme.cari_ad}</div>
                                                <div className="text-[10px] text-slate-500 font-medium uppercase mt-1">{odeme.plan_aciklama}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right font-black text-white">₺{Number(odeme.tutar).toLocaleString()}</td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-full border ${odeme.durum === 'Ödendi'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>
                                                    {odeme.durum}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {takipVerisi.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs opacity-50">
                                            Bu ay için planlanmış bir ödeme bulunmamaktadır.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
