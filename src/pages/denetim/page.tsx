import { useState, useEffect } from 'react';
import { denetim as denetimApi } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import {
    Activity,
    RotateCcw,
    Trash2,
    Edit3,
    PlusCircle,
    User,
    Clock,
    FileText,
    Search,
    Filter
} from 'lucide-react';

export default function DenetimKayitlar() {
    const { selectedProfile } = useProfile();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedProfile) {
            loadLogs();
        }
    }, [selectedProfile]);

    const loadLogs = async () => {
        if (!selectedProfile) return;
        setLoading(true);
        try {
            const { data } = await denetimApi.getAll(selectedProfile.id);
            if (data) setLogs(data);
        } catch (error) {
            console.error('Logs load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.islem_tipi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.kullanici_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'EKLEME': return <PlusCircle size={14} className="text-emerald-500" />;
            case 'GÜNCELLEME': return <Edit3 size={14} className="text-amber-500" />;
            case 'SİLME': return <Trash2 size={14} className="text-rose-500" />;
            default: return <Activity size={14} className="text-indigo-500" />;
        }
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Header />
                    <main className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
                        {/* Summary Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                    <Activity size={12} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Canlı Sistem Günlüğü</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                                    Denetim <span className="text-indigo-500 italic">Merkezi.</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-sm max-w-md">
                                    İşletmenizin dijital ayak izi. Yapılan her değişiklik, her silme ve her yeni kayıt burada mühürlenir.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="İşlem veya kullanıcı ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={loadLogs}
                                    className="group flex items-center gap-2 px-6 h-12 bg-white text-slate-950 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                                >
                                    <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                    YENİLE
                                </button>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative bg-[#0a0f1d]/80 backdrop-blur-3xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Clock size={12} />
                                                        ZAMAN DAMGASI
                                                    </div>
                                                </th>
                                                <th className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Activity size={12} />
                                                        EYLEM TİPİ
                                                    </div>
                                                </th>
                                                <th className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <FileText size={12} />
                                                        İÇERİK DETAYI
                                                    </div>
                                                </th>
                                                <th className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <User size={12} />
                                                        SORUMLU
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-32">
                                                        <div className="flex flex-col items-center justify-center gap-4">
                                                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Veriler Çekiliyor</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-32 text-center">
                                                        <div className="max-w-xs mx-auto space-y-4">
                                                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-slate-700">
                                                                <Search size={32} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">SONUÇ BULUNAMADI</p>
                                                                <p className="text-xs text-slate-600 font-medium">Arama kriterlerinize uygun hiçbir kayıt bulunmuyor.</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredLogs.map((log) => (
                                                    <tr key={log.id} className="group/row hover:bg-white/[0.02] transition-colors relative">
                                                        <td className="px-8 py-6 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-200 letter-spacing-tight">
                                                                    {new Date(log.olusturma_tarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-500 italic">
                                                                    {new Date(log.olusturma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] tracking-widest transition-all ${log.islem_tipi === 'SİLME' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-lg shadow-rose-500/5' :
                                                                    log.islem_tipi === 'GÜNCELLEME' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-lg shadow-amber-500/5' :
                                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                                                }`}>
                                                                {getActionIcon(log.islem_tipi)}
                                                                {log.islem_tipi}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 min-w-[300px]">
                                                            <p className="text-sm font-bold text-slate-300 leading-relaxed group-hover/row:text-white transition-colors">
                                                                {log.aciklama}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TABLO:</span>
                                                                <span className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest">{log.tablo_adi}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                                                    <User size={12} className="text-indigo-400" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-wider">{log.kullanici_email.split('@')[0]}</span>
                                                                    <span className="text-[9px] font-bold text-slate-600">{log.kullanici_email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-white/[0.01] border-t border-white/5 p-6 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                        TOPLAM {filteredLogs.length} KAYIT GÖSTERİLİYOR
                                    </span>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">SİSTEM ÇEVRİMİÇİ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
