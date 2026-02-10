import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { taksitler as taksitApi, cariler as cariApi, TaksitPlan, Cari } from '../../lib/api';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';

export default function TaksitlerPage() {
    const { selectedProfile } = useProfile();
    const navigate = useNavigate();
    const [taksitler, setTaksitler] = useState<TaksitPlan[]>([]);
    const [cariler, setCariler] = useState<Cari[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<Partial<TaksitPlan>>({
        toplam_tutar: 0,
        taksit_tutari: 0,
        taksit_sayisi: 12,
        odeme_gunu: 10,
        baslangic_tarihi: new Date().toISOString().split('T')[0],
        aciklama: ''
    });

    const fetchData = async () => {
        if (!selectedProfile) return;
        setLoading(true);
        try {
            const [tRes, cRes] = await Promise.all([
                taksitApi.getAll(selectedProfile.id),
                cariApi.getAll(selectedProfile.id)
            ]);
            if (tRes.data) setTaksitler(tRes.data);
            if (cRes.data) setCariler(cRes.data);
        } catch (error) {
            console.error('Veri çekme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedProfile]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        const selectedCari = cariler.find(c => c.id === formData.cari_id);

        await taksitApi.create({
            ...formData,
            cari_ad: selectedCari?.ad || '',
            profile_id: selectedProfile.id
        });

        setShowModal(false);
        fetchData();
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="p-10 space-y-8">
                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight">Taksit <span className="text-indigo-400 italic">Planları.</span></h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Ödeme Planlarınızı Yönetin</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="premium-button px-8 h-14"
                        >
                            <i className="ri-add-line"></i> YENİ PLAN OLUŞTUR
                        </button>
                    </header>

                    <div className="premium-card overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cari / Açıklama</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Toplam Tutar</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Taksit</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Gün</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {taksitler.map(plan => (
                                    <tr key={plan.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-sm uppercase">{plan.cari_ad}</div>
                                            <div className="text-[10px] text-slate-500 font-medium uppercase mt-1">{plan.aciklama}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-indigo-400">₺{Number(plan.toplam_tutar).toLocaleString()}</td>
                                        <td className="px-8 py-6 text-right font-bold text-sm">₺{Number(plan.taksit_tutari).toLocaleString()} x {plan.taksit_sayisi}</td>
                                        <td className="px-8 py-6 text-center font-bold text-slate-400">{plan.odeme_gunu}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20">{plan.durum}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="premium-card w-full max-w-2xl p-10 relative animate-slide-up">
                        <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                            <i className="ri-close-line text-3xl"></i>
                        </button>

                        <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Yeni Taksit <span className="text-indigo-400">Planı</span></h2>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">İLGİLİ CARİ</label>
                                    <select
                                        className="premium-input h-14"
                                        value={formData.cari_id}
                                        onChange={e => setFormData({ ...formData, cari_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Cari Seçin...</option>
                                        {cariler.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TOPLAM TUTAR</label>
                                    <input
                                        type="number"
                                        className="premium-input h-14"
                                        value={formData.toplam_tutar}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setFormData({
                                                ...formData,
                                                toplam_tutar: val,
                                                taksit_tutari: val / (formData.taksit_sayisi || 1)
                                            });
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TAKSİT SAYISI</label>
                                    <input
                                        type="number"
                                        className="premium-input h-14"
                                        value={formData.taksit_sayisi}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setFormData({
                                                ...formData,
                                                taksit_sayisi: val,
                                                taksit_tutari: Math.round(((formData.toplam_tutar || 0) / val) * 100) / 100
                                            });
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TAKSİT TUTARI</label>
                                    <input
                                        type="number"
                                        className="premium-input h-14 bg-indigo-500/5 border-indigo-500/20"
                                        value={formData.taksit_tutari}
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ÖDEME GÜNÜ (1-28)</label>
                                    <input
                                        type="number"
                                        min="1" max="28"
                                        className="premium-input h-14"
                                        value={formData.odeme_gunu}
                                        onChange={e => setFormData({ ...formData, odeme_gunu: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BAŞLANGIÇ TARİHİ</label>
                                    <input
                                        type="date"
                                        className="premium-input h-14"
                                        value={formData.baslangic_tarihi}
                                        onChange={e => setFormData({ ...formData, baslangic_tarihi: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">AÇIKLAMA</label>
                                    <input
                                        type="text"
                                        className="premium-input h-14"
                                        value={formData.aciklama}
                                        onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="premium-button w-full h-16 text-[10px] tracking-[0.2em]">KAYDET VE PLANI OLUŞTUR</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
