import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import { useProfile } from '../../contexts/ProfileContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line } from 'recharts';

export default function AIAnalizPage() {
    const navigate = useNavigate();
    const { selectedProfile, isPro } = useProfile();

    if (!selectedProfile) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
                <div className="premium-card p-12 max-w-md animate-slide-up">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                        <i className="ri-cpu-line text-4xl text-indigo-500"></i>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Seçimi Gerekli</h3>
                    <p className="text-slate-400 font-medium mb-8">AI Analizlerini görüntülemek için bir profil seçmelisiniz.</p>
                    <button onClick={() => window.location.reload()} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600 hover:bg-indigo-700 border-indigo-500/30">YENİDEN DENE</button>
                </div>
            </div>
        );
    }

    if (!isPro) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
                <div className="premium-card p-12 max-w-md animate-slide-up">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                        <i className="ri-award-line text-4xl text-amber-500"></i>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Hizmetinizi Yükseltin</h3>
                    <p className="text-slate-400 font-medium mb-8">AI Stratejik Analiz özellikleri "Tam Yönetim AI" ve "VIP" paketlerine özeldir. Hizmetinizi yükseltmek için yönetici ile iletişime geçin.</p>
                    <button onClick={() => navigate('/dashboard')} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600 hover:bg-indigo-700 border-indigo-500/30">DASHBOARD'A DÖN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative text-xs">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[140px] animate-aurora-2"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[120px] animate-aurora-1"></div>
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
                                    <i className="ri-cpu-line"></i>
                                    <span>FINANCIAL INTELLIGENCE ENGINE v4.0</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                    Derin Veri <span className="text-gradient from-indigo-400 to-purple-500 italic">Analizi.</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-xl">İşletmenizin finansal geleceğini yapay zeka öngörüleri ve stratejik verilerle proaktif olarak inşa edin.</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="premium-card px-8 py-5 border-emerald-500/20 bg-emerald-500/5 flex items-center gap-6">
                                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                        <i className="ri-shield-flash-line text-2xl"></i>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">DATA GÜVENLİK</div>
                                        <div className="text-2xl font-black text-emerald-400 tracking-tighter leading-none">94/100</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Dynamic Insights Card */}
                            <div className="lg:col-span-2 premium-card p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                    <i className="ri-brain-line text-[15rem]"></i>
                                </div>

                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                            <i className="ri-magic-line text-2xl text-white"></i>
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight">AI Stratejik Yol Haritası</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all hover:-translate-y-1 group/item">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all">
                                                    <i className="ri-scales-3-line text-xl"></i>
                                                </div>
                                                <h4 className="font-black text-slate-300 text-[10px] uppercase tracking-[0.2em]">Maliyet Optimizasyonu</h4>
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                                Genel işletme giderleriniz son çeyrekte %12 artış gösterdi. Kira ve lojistik dışındaki "Diğer" kalemlerdeki %15'lik düşüş, yıllık bazda <span className="text-white font-black underline decoration-indigo-500/50 underline-offset-4">54.000 ₺</span> ek kar marjı sağlayabilir.
                                            </p>
                                        </div>
                                        <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all hover:-translate-y-1 group/item">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                                                    <i className="ri-funds-box-line text-xl"></i>
                                                </div>
                                                <h4 className="font-black text-slate-300 text-[10px] uppercase tracking-[0.2em]">Büyüme Projeksiyonu</h4>
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                                Mevcut satış trendiniz doğrusal devam ederse, gelecek yılbaşına kadar müşteri portföyünüzün %22 oranında <span className="text-white font-black underline decoration-emerald-500/50 underline-offset-4">büyüyeceği</span> öngörülüyor. Kapasite artırımı için şimdiden planlama yapılmalı.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="premium-card p-10 flex flex-col justify-between relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-50"></div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-black uppercase tracking-tight">Sektörel Benchmark</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SİZİN PERFORMANSINIZ VS SEKTÖR</p>
                                </div>

                                <div className="h-56 w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sektorData}>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            />
                                            <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={32}>
                                                {sektorData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.name === 'Biz' ? 'url(#barGradient)' : 'rgba(255,255,255,0.05)'}
                                                        stroke={entry.name === 'Biz' ? '#6366f1' : 'transparent'}
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Bar>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#818cf8" />
                                                    <stop offset="100%" stopColor="#4f46e5" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-4 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GELİŞİM İNDEKSİ</p>
                                    <p className="text-4xl font-black text-indigo-400 mt-2">+%14.2</p>
                                    <p className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mt-1">SEKTÖR ORTALAMASI ÜZERİNDE</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                            <div className="premium-card p-10 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight">Vergi Tahminleme</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GELECEK DÖNEM YÜKÜMLÜLÜK ÖNGÖRÜSÜ</p>
                                    </div>
                                    <div className="px-5 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                        LIVE SIMULATION
                                    </div>
                                </div>

                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={taxPredictionData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Line type="monotone" dataKey="kdv" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} />
                                            <Line type="monotone" dataKey="stopaj" stroke="#fb923c" strokeWidth={4} dot={{ r: 6, fill: '#fb923c', strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl group hover:bg-indigo-500/10 transition-all">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">TAHMİNİ KDV YÜKÜ</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black">12.450 ₺</span>
                                            <span className="text-[10px] font-black text-emerald-400">+%2.4</span>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl group hover:bg-orange-500/10 transition-all">
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">TAHMİNİ STOPAJ</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black">4.120 ₺</span>
                                            <span className="text-[10px] font-black text-rose-500">-%1.2</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="premium-card p-10 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight">Finansal Sağlık Radarı</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KRİTİK RİSK VE FIRSAT ANALİZLERİ</p>
                                    </div>
                                    <i className="ri-radar-line text-3xl text-rose-500 animate-pulse"></i>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { name: 'Nakit Akış Riski', val: 'Çok Düşük', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'ri-water-flash-line' },
                                        { name: 'Müşteri Konsantrasyonu', val: 'Orta', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'ri-user-star-line' },
                                        { name: 'Stok Devir Hızı', val: 'İdeal', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: 'ri-refresh-line' },
                                        { name: 'Finansal Kaldıraç Oranı', val: 'Sürdürülebilir', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: 'ri-line-chart-line' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] border border-white/5 hover:bg-white/[0.03] hover:scale-[1.02] transition-all cursor-default group/item">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center border shadow-lg shadow-black/20 group-hover/item:scale-110 transition-transform`}>
                                                    <i className={`${item.icon} text-2xl`}></i>
                                                </div>
                                                <span className="text-sm font-black text-slate-300 uppercase tracking-tight">{item.name}</span>
                                            </div>
                                            <div className="px-6 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/item:bg-white/10 group-hover/item:text-white transition-all">
                                                {item.val}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

const sektorData = [
    { name: 'Rakip A', value: 65 },
    { name: 'Rakip B', value: 45 },
    { name: 'Biz', value: 85 },
    { name: 'Rakip C', value: 70 },
    { name: 'Rakip D', value: 55 },
];

const taxPredictionData = [
    { month: 'Eyl', kdv: 8000, stopaj: 3000 },
    { month: 'Eki', kdv: 9500, stopaj: 3200 },
    { month: 'Kas', kdv: 11000, stopaj: 3800 },
    { month: 'Ara', kdv: 12450, stopaj: 4120 },
];
