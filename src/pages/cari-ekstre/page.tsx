import React, { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
    cariler as carilerApi,
    satisFaturalari as satisApi,
    alisFaturalari as alisApi,
    odemeler as odemelerApi,
    Cari
} from '../../lib/api';
import {
    Search,
    FileText,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EkstreHareketi {
    tarih: string;
    tip: 'Satış' | 'Alış' | 'Tahsilat' | 'Ödeme';
    belge_no: string;
    aciklama: string;
    borc: number;
    alacak: number;
    bakiye: number;
}

const CariEkstrePage = () => {
    const { selectedProfile } = useProfile();
    const [cariler, setCariler] = useState<Cari[]>([]);
    const [selectedCari, setSelectedCari] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [ekstre, setEkstre] = useState<EkstreHareketi[]>([]);

    useEffect(() => {
        if (selectedProfile) {
            loadCariler();
        }
    }, [selectedProfile]);

    const loadCariler = async () => {
        const res = await carilerApi.getAll(selectedProfile!.id);
        if (res.data) setCariler(res.data);
    };

    const generateEkstre = async () => {
        if (!selectedCari) return;
        setLoading(true);
        try {
            const [satisRes, alisRes, odemeRes] = await Promise.all([
                satisApi.getAll(selectedProfile!.id),
                alisApi.getAll(selectedProfile!.id),
                odemelerApi.getAll(selectedProfile!.id)
            ]);

            let hareketler: EkstreHareketi[] = [];

            // Satışlar (Cari Borçlanır)
            if (satisRes.data) {
                satisRes.data.filter(f => f.cari_id === selectedCari && f.tarih >= startDate && f.tarih <= endDate)
                    .forEach(f => {
                        hareketler.push({
                            tarih: f.tarih,
                            tip: 'Satış',
                            belge_no: f.fatura_no,
                            aciklama: f.aciklama || 'Satış Faturası',
                            borc: f.toplam,
                            alacak: 0,
                            bakiye: 0
                        });
                    });
            }

            // Alışlar (Cari Alacaklanır)
            if (alisRes.data) {
                alisRes.data.filter(f => f.cari_id === selectedCari && f.tarih >= startDate && f.tarih <= endDate)
                    .forEach(f => {
                        hareketler.push({
                            tarih: f.tarih,
                            tip: 'Alış',
                            belge_no: f.fatura_no,
                            aciklama: f.aciklama || 'Alış Faturası',
                            borc: 0,
                            alacak: f.toplam,
                            bakiye: 0
                        });
                    });
            }

            // Ödemeler
            if (odemeRes.data) {
                odemeRes.data.filter(o => o.cari_id === selectedCari && o.tarih >= startDate && o.tarih <= endDate)
                    .forEach(o => {
                        if (o.tip === 'Tahsilat') {
                            // Tahsilat (Cari Alacaklanır - Bize ödeme yaptı)
                            hareketler.push({
                                tarih: o.tarih,
                                tip: 'Tahsilat',
                                belge_no: '-',
                                aciklama: o.aciklama || 'Tahsilat',
                                borc: 0,
                                alacak: o.tutar,
                                bakiye: 0
                            });
                        } else {
                            // Ödeme (Cari Borçlanır - Biz ona ödeme yaptık)
                            hareketler.push({
                                tarih: o.tarih,
                                tip: 'Ödeme',
                                belge_no: '-',
                                aciklama: o.aciklama || 'Ödeme',
                                borc: o.tutar,
                                alacak: 0,
                                bakiye: 0
                            });
                        }
                    });
            }

            // Tarihe göre sırala
            hareketler.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());

            // Bakiye hesapla
            let currentBakiye = 0;
            hareketler = hareketler.map(h => {
                currentBakiye += (h.borc - h.alacak);
                return { ...h, bakiye: currentBakiye };
            });

            setEkstre(hareketler);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePdfExport = () => {
        const cari = cariler.find(c => c.id === selectedCari);
        if (!cari) return;

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('CARI EKSTRE RAPORU', 14, 22);

        doc.setFontSize(10);
        doc.text(`Cari: ${cari.ad}`, 14, 32);
        doc.text(`Tarih Aralığı: ${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`, 14, 38);
        doc.text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 44);

        const tableData = ekstre.map(h => [
            new Date(h.tarih).toLocaleDateString('tr-TR'),
            h.tip,
            h.belge_no,
            h.aciklama,
            h.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
            h.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
            h.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['Tarih', 'İşlem', 'Belge No', 'Açıklama', 'Borç', 'Alacak', 'Bakiye']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 8 },
            columnStyles: {
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });

        doc.save(`${cari.ad}_Ekstre_${startDate}_${endDate}.pdf`);
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden relative">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="flex relative z-10">
                <Sidebar />

                <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                    <Header />

                    <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                    <i className="ri-file-list-3-line"></i>
                                    <span>RAPORLAR</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                    Cari <span className="text-gradient">Ekstre.</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-xl">Müşterilerinizin ve tedarikçilerinizin işlem dökümünü inceleyin.</p>
                            </div>

                            {ekstre.length > 0 && (
                                <button
                                    onClick={handlePdfExport}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-8 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3"
                                >
                                    <Download size={20} /> PDF OLARAK İNDİR
                                </button>
                            )}
                        </div>

                        {/* Filters Card */}
                        <div className="premium-card p-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">CARİ SEÇİMİ</label>
                                    <select
                                        value={selectedCari}
                                        onChange={(e) => setSelectedCari(e.target.value)}
                                        className="premium-input h-14"
                                    >
                                        <option value="">Cari Seçin...</option>
                                        {cariler.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BAŞLANGIÇ</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="premium-input h-14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BİTİŞ</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="premium-input h-14"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={generateEkstre}
                                        disabled={!selectedCari || loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <i className="ri-loader-4-line animate-spin text-xl"></i> : <><Filter size={18} /> SORGULA</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ekstre Table */}
                        <div className="premium-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-[#0f172a]/50">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tarih</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">İşlem</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Belge No</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Açıklama</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Borç</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Alacak</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Bakiye</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {ekstre.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                                                    {selectedCari ? 'Bu tarih aralığında hareket bulunamadı.' : 'Lütfen bir cari seçip sorgulayın.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            ekstre.map((h, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6 text-sm text-slate-300 font-medium">
                                                        {new Date(h.tarih).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${h.tip === 'Satış' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                                h.tip === 'Alış' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                                    h.tip === 'Tahsilat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            }`}>
                                                            {h.tip}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-slate-400 font-bold">
                                                        {h.belge_no}
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-slate-300">
                                                        {h.aciklama}
                                                    </td>
                                                    <td className="px-8 py-6 text-right text-sm font-black text-rose-400">
                                                        {h.borc > 0 ? `₺${h.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right text-sm font-black text-emerald-400">
                                                        {h.alacak > 0 ? `₺${h.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right text-sm font-black text-white">
                                                        ₺{h.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
        </div>
    );
};

export default CariEkstrePage;
