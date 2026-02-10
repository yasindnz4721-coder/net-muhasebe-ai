import { useState, useEffect } from 'react';
import { denetim as denetimApi } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function DenetimKayitlar() {
    const { selectedProfile } = useProfile();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedProfile) {
            loadLogs();
        }
    }, [selectedProfile]);

    const loadLogs = async () => {
        if (!selectedProfile) return;
        setLoading(true);
        const { data } = await denetimApi.getAll(selectedProfile.id);
        if (data) setLogs(data);
        setLoading(false);
    };

    if (!selectedProfile) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Header />
                    <main className="p-10 space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter mb-2">Denetim <span className="text-indigo-400">Kayitları.</span></h1>
                                <p className="text-slate-500 font-medium">Sistem üzerindeki kritik işlemlerin tarihçesi.</p>
                            </div>
                            <button onClick={loadLogs} className="premium-button px-6 h-12 text-[10px] uppercase tracking-widest bg-white/5 border-white/10">YENİLE</button>
                        </div>

                        <div className="premium-card overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">TARİH</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">İŞLEM</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">AÇIKLAMA</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">KULLANICI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-600 font-black uppercase tracking-widest">Kayıtlar Yükleniyor...</td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-600 font-black uppercase tracking-widest">Henüz kayıt bulunamadı.</td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-6 text-[10px] font-bold text-slate-400">
                                                    {new Date(log.olusturma_tarihi).toLocaleString('tr-TR')}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.islem_tipi === 'SİLME' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                            log.islem_tipi === 'GÜNCELLEME' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                                'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                        }`}>
                                                        {log.islem_tipi}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-medium text-slate-300">{log.aciklama}</td>
                                                <td className="px-8 py-6 text-[10px] font-bold text-indigo-400">{log.kullanici_email}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
