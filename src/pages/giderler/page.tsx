import { useState, useEffect } from 'react';
import { giderler as giderApi, kasalar as kasaApi } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import * as XLSX from 'xlsx';

export default function GiderlerPage() {
    const { selectedProfile } = useProfile();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [kasalar, setKasalar] = useState<any[]>([]);
    const [anaKasa, setAnaKasa] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [newExpense, setNewExpense] = useState({
        kategori_id: '',
        tutar: '',
        tarih: new Date().toISOString().split('T')[0],
        kasa_id: '',
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
        setLoading(true);
        try {
            const [expRes, catRes, kasaRes] = await Promise.all([
                giderApi.getAll(selectedProfile.id),
                giderApi.getKategoriler(selectedProfile.id),
                kasaApi.getAll(selectedProfile.id)
            ]);

            if (expRes.data) setExpenses(expRes.data);
            if (catRes.data) setCategories(catRes.data);
            if (kasaRes.data) {
                setKasalar(kasaRes.data);
                const defaultKasa = kasaRes.data.find((k: any) => k.is_default) || kasaRes.data[0];
                if (defaultKasa) {
                    setAnaKasa(defaultKasa);
                    setNewExpense(prev => ({ ...prev, kasa_id: defaultKasa.id }));
                }
            }
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        }
        setLoading(false);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        try {
            const { data, error } = await giderApi.add({
                ...newExpense,
                tarih: newExpense.tarih === new Date().toISOString().split('T')[0] ? new Date().toISOString() : new Date(newExpense.tarih).toISOString(),
                profile_id: selectedProfile.id,
                tutar: parseFloat(newExpense.tutar)
            });

            if (data) {
                setShowAddModal(false);
                setNewExpense({
                    kategori_id: '',
                    tutar: '',
                    tarih: new Date().toISOString().split('T')[0],
                    kasa_id: newExpense.kasa_id, // Kasa seçimini koruyalım
                    odeme_yontemi: 'Nakit',
                    aciklama: ''
                });
                loadData();
            }
        } catch (error) {
            console.error('Ekleme hatası:', error);
        }
    };

    const handleExcelExport = () => {
        const data = expenses.map(e => ({
            'Tarih': new Date(e.tarih).toLocaleDateString('tr-TR'),
            'Kategori': e.kategori_ad || 'Genel',
            'Açıklama': e.aciklama,
            'Kasa': e.kasa_ad || 'Nakit Kasa',
            'Tutar': Number(e.tutar)
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Giderler");
        XLSX.writeFile(workbook, `Giderler_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu gider kaydını silmek istediğinize emin misiniz? Kasa bakiyesi iade edilecektir.')) return;

        try {
            await giderApi.delete(id);
            loadData();
        } catch (error) {
            console.error('Silme hatası:', error);
        }
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                    <Header />
                    <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in relative">

                        {/* Arkaplan Efektleri */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] -z-10 animate-aurora-2"></div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                                    <i className="ri-wallet-3-line"></i>
                                    <span>FİNANSMAN & GİDER YÖNETİMİ</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                    İşletme <span className="text-gradient from-rose-400 to-orange-500">Giderleri.</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-xl">Kira, maaş ve faturalarınızı tek noktadan yönetin, nakit akışınızı kontrol altında tutun.</p>
                            </div>

                                <span>YENİ GİDER KAYDET</span>
                                <i className="ri-add-line text-2xl"></i>
                            </button>
                            <button
                                onClick={handleExcelExport}
                                className="premium-button px-8 h-16 text-[10px] uppercase tracking-widest bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-600/10"
                            >
                                <span>EXCEL'E AKTAR</span>
                                <i className="ri-file-excel-2-line text-xl"></i>
                            </button>
                        </div>

                        {/* Gider Kartları Özeti */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {[
                                { label: 'ANA KASA BAKİYESİ', value: Number(anaKasa?.bakiye || 0), icon: 'ri-wallet-3-line', color: 'indigo' },
                                { label: 'TOPLAM GİDER', value: expenses.reduce((sum, e) => sum + Number(e.tutar), 0), icon: 'ri-money-dollar-circle-line', color: 'rose' },
                                { label: 'AYLIK ORTALAMA', value: expenses.reduce((sum, e) => sum + Number(e.tutar), 0) / Math.max(1, new Set(expenses.map(e => e.tarih.substring(0, 7))).size), icon: 'ri-calendar-line', color: 'indigo' },
                                { label: 'EN YÜKSEK KALEM', value: Math.max(0, ...expenses.map(e => Number(e.tutar))), icon: 'ri-arrow-up-circle-line', color: 'orange' },
                                { label: 'İŞLEM SAYISI', value: expenses.length, icon: 'ri-history-line', color: 'emerald', isCurrency: false }
                            ].map((stat, i) => (
                                <div key={i} className="premium-card p-6 border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center border border-${stat.color}-500/20`}>
                                            <i className={`${stat.icon} text-xl text-${stat.color}-500`}></i>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                        <div className="text-2xl font-black">
                                            {stat.isCurrency === false ? stat.value : `₺${stat.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Gider Listesi */}
                        <div className="premium-card overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tighter">Son Gider Hareketleri</h3>
                            </div>

                            <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#0f172a] shadow-sm">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">TARİH</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">KATEGORİ</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">AÇIKLAMA</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">KASA</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">TUTAR</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">İŞLEM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            <tr><td colSpan={6} className="px-8 py-20 text-center font-black text-slate-600 uppercase tracking-[0.2em]">Kayıtlar Hazırlanıyor...</td></tr>
                                        ) : expenses.length === 0 ? (
                                            <tr><td colSpan={6} className="px-8 py-20 text-center font-black text-slate-600 uppercase tracking-[0.2em]">Henüz gider kaydı bulunmuyor.</td></tr>
                                        ) : (
                                            expenses.map((exp) => (
                                                <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400">{new Date(exp.tarih).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10" style={{ backgroundColor: `${exp.kategori_renk}15`, color: exp.kategori_renk }}>
                                                                <i className={exp.kategori_ikon || 'ri-money-dollar-circle-line'}></i>
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-tight text-slate-200">{exp.kategori_ad || 'Genel'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-xs font-medium text-slate-400">{exp.aciklama}</td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 py-1 px-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                                                            {exp.kasa_ad || 'Nakit Kasa'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-black text-rose-500 text-lg">₺{Number(exp.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button
                                                            onClick={() => handleDelete(exp.id)}
                                                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center"
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
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

            {/* Ekleme Modalı */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-[#020617]/60 animate-fade-in">
                    <div className="premium-card w-full max-w-xl p-10 space-y-8 animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <i className="ri-refund-2-line text-9xl"></i>
                        </div>

                        <div className="flex justify-between items-center relative z-10">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Gider <span className="text-rose-500">Kaydet.</span></h2>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">KATEGORİ</label>
                                <select
                                    required
                                    value={newExpense.kategori_id}
                                    onChange={e => setNewExpense({ ...newExpense, kategori_id: e.target.value })}
                                    className="premium-input h-14 font-black"
                                >
                                    <option value="">Seçiniz...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.ad}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TUTAR (TL)</label>
                                <input
                                    type="number" step="0.01" required
                                    value={newExpense.tutar}
                                    onChange={e => setNewExpense({ ...newExpense, tutar: e.target.value })}
                                    className="premium-input h-14 font-black text-lg text-rose-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ÖDEME TARİHİ</label>
                                <input
                                    type="date" required
                                    value={newExpense.tarih}
                                    onChange={e => setNewExpense({ ...newExpense, tarih: e.target.value })}
                                    className="premium-input h-14 font-black"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ÖDEME KASASI</label>
                                <select
                                    required
                                    value={newExpense.kasa_id}
                                    onChange={e => setNewExpense({ ...newExpense, kasa_id: e.target.value })}
                                    className="premium-input h-14 font-black"
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.map(k => (
                                        <option key={k.id} value={k.id}>
                                            {k.tip === 'Banka' ? `[BANKA] ${k.banka_adi} - ${k.ad}` : `[KASA] ${k.ad}`} (₺{Number(k.bakiye).toLocaleString('tr-TR')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">AÇIKLAMA</label>
                                <textarea
                                    rows={3}
                                    value={newExpense.aciklama}
                                    onChange={e => setNewExpense({ ...newExpense, aciklama: e.target.value })}
                                    className="premium-input p-4 font-bold h-24 resize-none"
                                    placeholder="Gider detayı..."
                                />
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button type="submit" className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                    GİDERİ KAYDET VE KASADAN DÜŞ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
