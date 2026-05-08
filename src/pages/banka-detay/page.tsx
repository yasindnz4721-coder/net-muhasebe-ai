// Banka Detay ve Ekstre Sayfası
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
    kasalar as kasalarApi,
    odemeler as odemelerApi,
    Kasa,
    Odeme
} from '../../lib/api';
import {
    Building2,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    Download,
    ChevronLeft,
    CreditCard,
    Wallet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface BankaHareketi {
    tarih: string;
    tip: string;
    aciklama: string;
    gelir: number;
    gider: number;
    bakiye: number;
}

const BankaDetayPage = () => {
    const { id } = useParams<{ id: string }>();
    const { selectedProfile } = useProfile();
    const [banka, setBanka] = useState<Kasa | null>(null);
    const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [ekstre, setEkstre] = useState<BankaHareketi[]>([]);

    useEffect(() => {
        if (selectedProfile && id) {
            loadBankaAndTransactions();
        }
    }, [selectedProfile, id]);

    const loadBankaAndTransactions = async () => {
        if (!selectedProfile || !id) return;
        setLoading(true);
        try {
            // 1. Banka bilgilerini al
            const kasalarRes = await kasalarApi.getAll(selectedProfile.id);
            if (kasalarRes.data) {
                const found = kasalarRes.data.find(k => k.id === id);
                if (found) setBanka(found);
            }

            // 2. Tüm ödemeleri al ve bu kasa için filtrele
            const odemeRes = await odemelerApi.getAll(selectedProfile.id);
            if (odemeRes.data) {
                // Filtreleme ve Hareketler
                const allKasaTransactions = odemeRes.data.filter(o => o.kasa_id === id);
                
                // Seçilen tarih aralığından önceki bakiyeyi hesapla
                let openingBalance = 0;
                allKasaTransactions
                    .filter(o => o.tarih < startDate)
                    .forEach(o => {
                        const isIncome = ['Tahsilat', 'Alınan Ödeme', 'Gelir'].includes(o.tip);
                        openingBalance += isIncome ? Number(o.tutar) : -Number(o.tutar);
                    });

                let hareketler: BankaHareketi[] = [];
                allKasaTransactions
                    .filter(o => o.tarih >= startDate && o.tarih <= endDate)
                    .forEach(o => {
                        const isIncome = ['Tahsilat', 'Alınan Ödeme', 'Gelir'].includes(o.tip);
                        hareketler.push({
                            tarih: o.tarih,
                            tip: o.tip,
                            aciklama: o.aciklama || (isIncome ? 'Tahsilat' : 'Ödeme'),
                            gelir: isIncome ? Number(o.tutar) : 0,
                            gider: !isIncome ? Number(o.tutar) : 0,
                            bakiye: 0
                        });
                    });

                // Tarihe göre sırala
                hareketler.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());

                let currentRunningBakiye = openingBalance;
                hareketler = hareketler.map(h => {
                    currentRunningBakiye += (h.gelir - h.gider);
                    return { ...h, bakiye: currentRunningBakiye };
                });

                setEkstre(hareketler);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePdfExport = () => {
        if (!banka) return;

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('HESAP EKSTRE RAPORU', 14, 22);

        doc.setFontSize(10);
        doc.text(`Hesap: ${banka.ad} (${banka.banka_adi || 'Nakit'})`, 14, 32);
        doc.text(`IBAN: ${banka.iban || '-'}`, 14, 38);
        doc.text(`Tarih Aralığı: ${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`, 14, 44);
        doc.text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 50);

        const tableData = ekstre.map(h => [
            new Date(h.tarih).toLocaleDateString('tr-TR'),
            h.tip,
            h.aciklama,
            h.gelir > 0 ? h.gelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-',
            h.gider > 0 ? h.gider.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-',
            h.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Tarih', 'İşlem Tipi', 'Açıklama', 'Gelir', 'Gider', 'Bakiye']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8 },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        doc.save(`${banka.ad}_Ekstre_${startDate}_${endDate}.pdf`);
    };

    const handleExcelExport = () => {
        if (!banka) return;

        const data = ekstre.map(h => ({
            'Tarih': new Date(h.tarih).toLocaleDateString('tr-TR'),
            'İşlem Tipi': h.tip,
            'Açıklama': h.aciklama,
            'Gelir (+)': h.gelir,
            'Gider (-)': h.gider,
            'Bakiye': h.bakiye
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ekstre");
        
        const wscols = [
            { wch: 12 },
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 }
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `${banka.ad}_Ekstre_${startDate}_${endDate}.xlsx`);
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden relative">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="flex relative z-10">
                <Sidebar />

                <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                    <Header />

                    <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
                        {/* Header & Actions */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <Link to="/bankalar" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-2">
                                    <ChevronLeft size={14} />
                                    <span>BANKA HESAPLARINA DÖN</span>
                                </Link>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase">
                                            {banka?.ad} <span className="text-gradient from-blue-400 to-indigo-500">EKSTRESİ.</span>
                                        </h1>
                                        <p className="text-slate-500 text-lg font-medium mt-1">{banka?.banka_adi} - {banka?.iban || 'Nakit Kasa'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleExcelExport}
                                    disabled={ekstre.length === 0}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3"
                                >
                                    <i className="ri-file-excel-2-line text-xl"></i> EXCEL EKSTRE
                                </button>
                                <button
                                    onClick={handlePdfExport}
                                    disabled={ekstre.length === 0}
                                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-8 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3"
                                >
                                    <Download size={20} /> PDF EKSTRE
                                </button>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="premium-card p-8 bg-gradient-to-br from-blue-600/10 to-transparent">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">GÜNCEL BAKİYE</span>
                                    <div className="text-4xl font-black tracking-tighter text-white">
                                        ₺{Number(banka?.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                             </div>
                             <div className="premium-card p-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DÖNEM İÇİ GELİR</span>
                                    <div className="text-4xl font-black tracking-tighter text-emerald-400">
                                        ₺{ekstre.reduce((acc, curr) => acc + curr.gelir, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                             </div>
                             <div className="premium-card p-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DÖNEM İÇİ GİDER</span>
                                    <div className="text-4xl font-black tracking-tighter text-rose-400">
                                        ₺{ekstre.reduce((acc, curr) => acc + curr.gider, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="premium-card p-6 flex flex-wrap items-end gap-6">
                            <div className="space-y-2 flex-1 min-w-[200px]">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BAŞLANGIÇ TARİHİ</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="premium-input h-14"
                                />
                            </div>
                            <div className="space-y-2 flex-1 min-w-[200px]">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BİTİŞ TARİHİ</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="premium-input h-14"
                                />
                            </div>
                            <button
                                onClick={loadBankaAndTransactions}
                                className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
                            >
                                <Filter size={18} /> FİLTRELE
                            </button>
                        </div>

                        {/* Transactions Table */}
                        <div className="premium-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-[#0f172a]/50">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tarih</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">İşlem</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Açıklama</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Gelir (+)</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Gider (-)</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hareket Bakiyesi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={6} className="px-8 py-6"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                                                </tr>
                                            ))
                                        ) : ekstre.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                                                    Bu tarih aralığında hesap hareketi bulunamadı.
                                                </td>
                                            </tr>
                                        ) : (
                                            ekstre.map((h, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6 text-sm text-slate-300 font-medium whitespace-nowrap">
                                                        {new Date(h.tarih).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${
                                                            h.gelir > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                        }`}>
                                                            {h.tip}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-slate-400 font-bold max-w-xs truncate">
                                                        {h.aciklama}
                                                    </td>
                                                    <td className="px-8 py-6 text-right text-sm font-black text-emerald-400">
                                                        {h.gelir > 0 ? `₺${h.gelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right text-sm font-black text-rose-400">
                                                        {h.gider > 0 ? `₺${h.gider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
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

export default BankaDetayPage;
