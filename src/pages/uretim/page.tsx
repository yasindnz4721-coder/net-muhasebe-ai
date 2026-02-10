import { useState, useEffect } from 'react';
import { stokHareketleri as stokApi, urunler as urunlerApi, StokHareketi, Urun } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { Hammer, History, Package, Plus, TrendingUp } from 'lucide-react';

export default function UretimPage() {
    const { selectedProfile } = useProfile();
    const [hareketler, setHareketler] = useState<StokHareketi[]>([]);
    const [urunler, setUrunler] = useState<Urun[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        urun_id: '',
        miktar: 1,
        aciklama: 'Üretimden stok girişi',
        tarih: new Date().toISOString().split('T')[0]
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
            const [hareketRes, urunRes] = await Promise.all([
                stokApi.getAll(selectedProfile.id),
                urunlerApi.getAll(selectedProfile.id)
            ]);
            // Sadece üretim hareketlerini filtrele
            const uretimHareketleri = (hareketRes.data || []).filter(h => h.hareket_tipi === 'Üretim');
            setHareketler(uretimHareketleri);
            setUrunler(urunRes.data || []);
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile || saving || !formData.urun_id) return;

        const urun = urunler.find(u => u.id === formData.urun_id);
        if (!urun) return;

        try {
            setSaving(true);
            await stokApi.create({
                urun_id: formData.urun_id,
                urun_ad: urun.ad,
                hareket_tipi: 'Üretim',
                miktar: Number(formData.miktar),
                tarih: formData.tarih,
                aciklama: formData.aciklama,
                profile_id: selectedProfile.id
            });

            setShowModal(false);
            setFormData({
                urun_id: '',
                miktar: 1,
                aciklama: 'Üretimden stok girişi',
                tarih: new Date().toISOString().split('T')[0]
            });
            await loadData();
        } catch (error) {
            console.error('Üretim kaydı hatası:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Header />
                    <main className="p-8 space-y-8 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                    <Hammer size={12} />
                                    <span>ÜRETİM YÖNETİMİ</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter">
                                    Üretim <span className="text-gradient">Planlama.</span>
                                </h1>
                                <p className="text-slate-500 font-medium max-w-xl">Üretim süreçlerini yönetin ve stok girişlerini otomatikleştirin.</p>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="premium-button px-8 h-16 text-xs uppercase tracking-widest flex items-center gap-3"
                            >
                                <Plus size={20} /> YENİ ÜRETİM KAYDI
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="premium-card p-8 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOPLAM ÜRETİM</div>
                                    <div className="text-3xl font-black text-white">{hareketler.length} İşlem</div>
                                </div>
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                    <History size={24} />
                                </div>
                            </div>
                            <div className="premium-card p-8 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ÜRETİLEN MİKTAR</div>
                                    <div className="text-3xl font-black text-emerald-400">
                                        {hareketler.reduce((sum, h) => sum + Number(h.miktar), 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div className="premium-card p-8 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">AKTİF ÜRÜN GAMINI</div>
                                    <div className="text-3xl font-black text-indigo-400">{urunler.length} Çeşit</div>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                                    <Package size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="premium-card overflow-hidden">
                            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SON ÜRETİM HAREKETLERİ</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#0f172a]">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">TARİH</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ÜRÜN</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">MİKTAR</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">AÇIKLAMA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            <tr className="animate-pulse"><td colSpan={4} className="p-20 text-center text-slate-600">Veriler yükleniyor...</td></tr>
                                        ) : hareketler.length === 0 ? (
                                            <tr><td colSpan={4} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">Henüz üretim kaydı bulunamadı.</td></tr>
                                        ) : (
                                            hareketler.map(h => (
                                                <tr key={h.id} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-400">{new Date(h.tarih).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-8 py-5 text-sm font-black text-white uppercase">{h.urun_ad}</td>
                                                    <td className="px-8 py-5 text-xl font-black text-indigo-400">+{h.miktar.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-xs font-bold text-slate-500 italic">{h.aciklama}</td>
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

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="premium-card max-w-lg w-full p-0 overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight uppercase">YENİ ÜRETİM GİRİŞİ</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <SearchableSelect
                                label="ÜRÜN SEÇİMİ *"
                                options={urunler.map(u => ({ id: u.id, name: u.ad, subText: `Mevcut Stok: ${u.stok_miktari}` }))}
                                value={formData.urun_id}
                                onChange={(v) => setFormData({ ...formData, urun_id: v })}
                                placeholder="ÜRETİLEN ÜRÜNÜ SEÇN..."
                                required
                            />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">MİKTAR *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.miktar}
                                        onChange={(e) => setFormData({ ...formData, miktar: Number(e.target.value) || 0 })}
                                        className="premium-input h-14"
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ÜRETİM TARİHİ</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.tarih}
                                        onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                                        className="premium-input h-14"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">NOT / AÇIKLAMA</label>
                                <textarea
                                    value={formData.aciklama}
                                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                                    className="premium-input p-4 h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 font-black text-[10px] text-slate-500 uppercase tracking-widest border border-white/5 rounded-xl">İPTAL</button>
                                <button type="submit" disabled={saving} className="premium-button flex-1 h-14 text-[10px] font-black tracking-widest uppercase">
                                    {saving ? 'KAYDEDİLİYOR...' : 'STOKLARA EKLE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
