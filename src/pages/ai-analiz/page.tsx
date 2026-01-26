import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import { useProfile } from '../../contexts/ProfileContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';

export default function AIAnalizPage() {
    const navigate = useNavigate();
    const { isPro } = useProfile();

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8 space-y-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-fixed">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
                                <span className="w-8 h-px bg-indigo-600"></span> AI Financial Intelligence
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 italic">Derin Veri Analizi</h1>
                            <p className="text-gray-500 font-medium">İşletmenizin geleceğini verilerle inşa edin.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><i className="ri-shield-flash-line text-xl"></i></div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Güvenlik Skoru</div>
                                    <div className="text-lg font-black text-gray-900">94/100</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
                        {/* Dynamic Insights Card */}
                        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                                <i className="ri-cpu-line text-9xl"></i>
                            </div>
                            <div className="relative z-10 flex flex-col h-full space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <i className="ri-magic-line text-2xl text-white"></i>
                                    </div>
                                    <h3 className="text-2xl font-black">AI Stratejik Yol Haritası</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <i className="ri-scales-3-line text-indigo-400 text-xl"></i>
                                            <h4 className="font-bold text-indigo-300 text-sm uppercase tracking-wider">Maliyet Optimizasyonu</h4>
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Genel işletme giderleriniz son çeyrekte %12 artış gösterdi. Kira ve lojistik dışındaki "Diğer" kalemlerdeki %15'lik düşüş, yıllık bazda <span className="text-white font-bold">54.000 ₺</span> ek kar marjı sağlayabilir.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <i className="ri-funds-box-line text-emerald-400 text-xl"></i>
                                            <h4 className="font-bold text-emerald-300 text-sm uppercase tracking-wider">Büyüme Projeksiyonu</h4>
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Mevcut satış trendiniz doğrusal devam ederse, gelecek yılbaşına kadar müşteri portföyünüzün %22 oranında büyüyeceği öngörülüyor. Kapasite artırımı için şimdiden planlama yapılmalı.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl flex flex-col items-center justify-center relative group">
                            <div className="absolute top-8 left-8">
                                <h3 className="text-lg font-bold text-gray-900 underline decoration-indigo-500 decoration-4 underline-offset-8">Sektörel Karşılaştırma</h3>
                            </div>
                            <div className="h-48 w-full mt-12">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sektorData}>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {sektorData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === 'Biz' ? '#4f46e5' : '#e2e8f0'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sektör Ortalaması Üzerindesiniz</p>
                                <p className="text-4xl font-black text-indigo-600 mt-1">+%14.2</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl overflow-hidden relative">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-xl font-black text-gray-900">Vergi Planlama ve Öngörü</h3>
                                <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black tracking-widest uppercase">Akıllı Simülasyon</div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={taxPredictionData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="kdv" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5' }} />
                                        <Line type="monotone" dataKey="stopaj" stroke="#fb923c" strokeWidth={4} dot={{ r: 6, fill: '#fb923c' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Tahmini KDV Yükü</p>
                                    <p className="text-xl font-black text-indigo-900">12.450 ₺</p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-orange-400 uppercase">Tahmini Stopaj</p>
                                    <p className="text-xl font-black text-orange-900">4.120 ₺</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-xl font-black text-gray-900">Risk Analiz Paneli</h3>
                                <i className="ri-radar-line text-2xl text-rose-500 animate-pulse"></i>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { name: 'Nakit Akış Riski', val: 'Çok Düşük', color: 'bg-emerald-50 text-emerald-600', icon: 'ri-water-flash-line' },
                                    { name: 'Müşteri Konsantrasyonu', val: 'Orta', color: 'bg-amber-50 text-amber-600', icon: 'ri-user-star-line' },
                                    { name: 'Stok Devir Hızı', val: 'İdeal', color: 'bg-indigo-50 text-indigo-600', icon: 'ri-refresh-line' },
                                    { name: 'Finansal Kaldıraç Oranı', val: 'Sürdürülebilir', color: 'bg-blue-50 text-blue-600', icon: 'ri-line-chart-line' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 rounded-3xl border border-gray-50 hover:bg-gray-50 hover:scale-[1.02] transition-all cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                                                <i className={`${item.icon} text-xl`}></i>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-60">{item.val}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
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
