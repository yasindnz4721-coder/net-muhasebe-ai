import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import * as api from '../../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
  Legend
} from 'recharts';

interface DashboardStats {
  toplamCari: number;
  toplamUrun: number;
  bekleyenSatisFaturasi: number;
  bekleyenAlisFaturasi: number;
  toplamAlacak: number;
  toplamBorc: number;
  aylikSatis: number;
  aylikAlis: number;
  toplamSatisFaturalari: number;
  toplamAlisFaturalari: number;
  toplamTahsilat: number;
  toplamTediye: number;
  gunlukSatis: number;
  gunlukTahsilat: number;
  aylikTrend: any[];
  sonIslemler: any[];
  tahminlemeData?: any[];
  aiHealthScore?: number;
  cariOran?: number;
  tahsilatVerimi?: number;
}

export default function HomePage() {
  const { selectedProfile, isPro } = useProfile();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    toplamCari: 0,
    toplamUrun: 0,
    bekleyenSatisFaturasi: 0,
    bekleyenAlisFaturasi: 0,
    toplamAlacak: 0,
    toplamBorc: 0,
    aylikSatis: 0,
    aylikAlis: 0,
    toplamSatisFaturalari: 0,
    toplamAlisFaturalari: 0,
    toplamTahsilat: 0,
    toplamTediye: 0,
    gunlukSatis: 0,
    gunlukTahsilat: 0,
    aylikTrend: [],
    sonIslemler: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProfile) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [selectedProfile]);

  const loadStats = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      setError(null);

      const [
        { data: cariler },
        { data: urunler },
        { data: satisFaturalari },
        { data: alisFaturalari },
        { data: odemeler },
      ] = await Promise.all([
        api.cariler.getAll(selectedProfile.id),
        api.urunler.getAll(selectedProfile.id),
        api.satisFaturalari.getAll(selectedProfile.id),
        api.alisFaturalari.getAll(selectedProfile.id),
        api.odemeler.getAll(selectedProfile.id),
      ]);

      const bekleyenSatis = satisFaturalari?.filter((f: any) => f.durum === 'Onaylandı')?.length || 0;
      const bekleyenAlis = alisFaturalari?.filter((f: any) => f.durum === 'Onaylandı')?.length || 0;

      const toplamSatisFaturalari = satisFaturalari?.reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0) || 0;
      const toplamAlisFaturalari = alisFaturalari?.reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0) || 0;

      const tahsilatlar = odemeler?.filter((o: any) => o.tip === 'Tahsilat').reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0) || 0;
      const tediyeler = odemeler?.filter((o: any) => o.tip === 'Tediye').reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0) || 0;

      const netAlacak = toplamSatisFaturalari - tahsilatlar;
      const netBorc = toplamAlisFaturalari - tediyeler;

      const buAy = new Date().getMonth();
      const buYil = new Date().getFullYear();

      const aylikSatisToplam = (satisFaturalari || [])
        .filter((f: any) => {
          const faturaTarih = new Date(f.tarih);
          return faturaTarih.getMonth() === buAy && faturaTarih.getFullYear() === buYil;
        })
        .reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

      const aylikAlisToplam = (alisFaturalari || [])
        .filter((f: any) => {
          const faturaTarih = new Date(f.tarih);
          return faturaTarih.getMonth() === buAy && faturaTarih.getFullYear() === buYil;
        })
        .reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);

      const gunlukSatisToplam = (satisFaturalari || [])
        .filter((f: any) => {
          const faturaTarih = new Date(f.tarih);
          faturaTarih.setHours(0, 0, 0, 0);
          return faturaTarih.getTime() === bugun.getTime();
        })
        .reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

      const gunlukTahsilatToplam = (odemeler || [])
        .filter((o: any) => {
          if (o.tip !== 'Tahsilat') return false;
          const odemeTarih = new Date(o.tarih);
          odemeTarih.setHours(0, 0, 0, 0);
          return odemeTarih.getTime() === bugun.getTime();
        })
        .reduce((sum: number, o: any) => sum + (Number(o.tutar) || 0), 0);

      const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const aylikTrendData = [];
      const simdi = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1);
        const ayIndex = d.getMonth();
        const yilValue = d.getFullYear();

        const satis = (satisFaturalari || []).filter((f: any) => {
          const ft = new Date(f.tarih);
          return ft.getMonth() === ayIndex && ft.getFullYear() === yilValue;
        }).reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

        const alis = (alisFaturalari || []).filter((f: any) => {
          const ft = new Date(f.tarih);
          return ft.getMonth() === ayIndex && ft.getFullYear() === yilValue;
        }).reduce((sum: number, f: any) => sum + (Number(f.toplam) || 0), 0);

        aylikTrendData.push({ name: aylar[ayIndex], satis, alis });
      }

      const islemler = [
        ...(satisFaturalari || []).map((f: any) => ({ ...f, tur: 'Satış Faturası', simge: 'ri-file-text-line', renk: 'text-green-600', bg: 'bg-green-50' })),
        ...(alisFaturalari || []).map((f: any) => ({ ...f, tur: 'Alış Faturası', simge: 'ri-file-list-line', renk: 'text-orange-600', bg: 'bg-orange-50' })),
        ...(odemeler || []).map((o: any) => ({
          ...o,
          tur: o.tip === 'Tahsilat' ? 'Tahsilat' : 'Ödeme',
          toplam: o.tutar,
          simge: o.tip === 'Tahsilat' ? 'ri-arrow-down-circle-line' : 'ri-arrow-up-circle-line',
          renk: o.tip === 'Tahsilat' ? 'text-blue-600' : 'text-red-600',
          bg: o.tip === 'Tahsilat' ? 'bg-blue-50' : 'bg-red-50'
        })),
      ].sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).slice(0, 10);

      setStats({
        toplamCari: cariler?.length || 0,
        toplamUrun: urunler?.length || 0,
        bekleyenSatisFaturasi: bekleyenSatis,
        bekleyenAlisFaturasi: bekleyenAlis,
        toplamAlacak: Math.max(0, netAlacak),
        toplamBorc: Math.max(0, netBorc),
        aylikSatis: aylikSatisToplam,
        aylikAlis: aylikAlisToplam,
        toplamSatisFaturalari,
        toplamAlisFaturalari,
        toplamTahsilat: tahsilatlar,
        toplamTediye: tediyeler,
        gunlukSatis: gunlukSatisToplam,
        gunlukTahsilat: gunlukTahsilatToplam,
        aylikTrend: aylikTrendData,
        sonIslemler: islemler,
        tahminlemeData: isPro ? [
          ...aylikTrendData,
          { name: 'Gelecek 1', satis: aylikSatisToplam * 1.15, alis: aylikAlisToplam * 0.95, type: 'Tahmin' },
          { name: 'Gelecek 2', satis: aylikSatisToplam * 1.25, alis: aylikAlisToplam * 0.9, type: 'Tahmin' }
        ] : [],
        aiHealthScore: isPro ? Math.min(100, Math.round((netAlacak / (netBorc || 1)) * 40 + (tahsilatlar / (toplamSatisFaturalari || 1)) * 60)) : undefined,
        cariOran: isPro ? Number((netAlacak / (netBorc || 1)).toFixed(2)) : undefined,
        tahsilatVerimi: isPro ? Math.round((tahsilatlar / (toplamSatisFaturalari || 1)) * 100) : undefined,
      });
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
      setError('Veriler yüklenemedi. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-user-add-line text-3xl text-yellow-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil Seçin</h3>
              <p className="text-gray-600">Profil seçmek için üst menüyü kullanın.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-48 bg-gray-200 rounded-3xl w-full"></div>
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
              </div>
              <div className="h-96 bg-gray-200 rounded-3xl w-full"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <button onClick={loadStats} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-colors cursor-pointer text-sm font-semibold">Yeniden Dene</button>
            </div>
          )}

          {/* AI Advisor - Pro Only */}
          {isPro && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-px shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-[31px] p-8 text-white relative z-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                      <i className="ri-brain-line text-4xl text-indigo-400"></i>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">AI Live</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-xl font-black mb-2 bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">Finansal Strateji Raporu</h2>
                      <div className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                        {stats.toplamAlacak > stats.toplamBorc * 1.5
                          ? <p>İşletmeniz <strong>yüksek likidite</strong> bölgesinde. Cari oranınız (<strong>{stats.cariOran}</strong>) sektör ortalamasının üzerinde. Bu durum, önümüzdeki 3 ay için agresif büyüme fırsatı sunuyor.</p>
                          : (stats.cariOran || 0) < 1
                            ? <p><strong className="text-rose-400">Kritik Uyarı:</strong> Cari oran 1.00'in altında. Kısa vadeli nakit akışınızı güçlendirmek için tahsilatlara öncelik verin.</p>
                            : <p><strong>Dengeli Yapı:</strong> Finansal göstergeleriniz stabil. Mevcut alacak-borç dengesi büyüme hedeflerinizi destekliyor.</p>
                        }
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 bg-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Cari Oran</div>
                        <div className="text-xl font-bold text-indigo-400">{stats.cariOran} <span className="text-xs font-normal opacity-50 px-1">Seviyesi</span></div>
                      </div>
                      <div className="p-4 bg-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Tahsilat Verimi</div>
                        <div className="text-xl font-bold text-emerald-400">%{stats.tahsilatVerimi} <span className="text-xs font-normal opacity-50 px-1">Başarı</span></div>
                      </div>
                      <div className="p-4 bg-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Yapay Zeka Büyüme Skoru</div>
                        <div className="text-xl font-bold text-amber-400">%{stats.aiHealthScore} <span className="text-xs font-normal opacity-50 px-1">Skor</span></div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate('/ai-analiz')} className="group px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shrink-0 shadow-xl cursor-pointer">
                    STRATEJİ RAPORU
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Satış Faturası', path: '/satis-faturasi', icon: 'ri-add-line', color: 'teal' },
              { label: 'Alış Faturası', path: '/alis-faturasi', icon: 'ri-subtract-line', color: 'orange' },
              { label: 'Ödeme/Tahsilat', path: '/odemeler', icon: 'ri-money-dollar-circle-line', color: 'blue' },
              { label: 'Yeni Cari', path: '/cariler', icon: 'ri-user-add-line', color: 'indigo' },
              { label: 'Yeni Ürün', path: '/urunler', icon: 'ri-box-line', color: 'purple' },
              { label: 'Raporlar', path: '/raporlar', icon: 'ri-bar-chart-box-line', color: 'gray' },
            ].map((action, i) => (
              <button key={i} onClick={() => navigate(action.path)} className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group cursor-pointer">
                <div className={`w-12 h-12 bg-${action.color}-50 rounded-xl flex items-center justify-center text-${action.color}-600 group-hover:bg-${action.color}-600 group-hover:text-white transition-colors`}>
                  <i className={`${action.icon} text-2xl`}></i>
                </div>
                <span className="text-xs font-semibold text-gray-600">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Toplam Cari" value={stats.toplamCari} icon="ri-group-line" color="blue" sub="Kayıtlı" />
            <StatCard label="Toplam Ürün" value={stats.toplamUrun} icon="ri-box-3-line" color="purple" sub="Stok" />
            <StatCard label="Onaylanan Satış" value={stats.bekleyenSatisFaturasi} icon="ri-file-check-line" color="teal" sub="Fatura" />
            <StatCard label="Onaylanan Alış" value={stats.bekleyenAlisFaturasi} icon="ri-file-history-line" color="orange" sub="Fatura" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{isPro ? 'Gelişmiş Trend ve Tahminleme' : 'Finansal Hareketler'}</h2>
                  <p className="text-sm text-gray-500">{isPro ? 'AI Destekli gelecek öngörüsü aktif' : 'Son 6 aylık veriler'}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-600"><span className="w-2 h-2 bg-teal-500 rounded-full"></span> Satiş</span>
                  <span className="flex items-center gap-1.5 text-orange-500"><span className="w-2 h-2 bg-orange-400 rounded-full"></span> Alış</span>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  {isPro ? (
                    <ComposedChart data={stats.tahminlemeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val.toLocaleString('tr-TR')} ₺`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="satis" stroke="#0d9488" strokeWidth={3} fill="#0d9488" fillOpacity={0.05} />
                      <Bar dataKey="alis" barSize={12} fill="#ea580c" radius={[4, 4, 0, 0]} />
                      <Line type="basis" dataKey="satis" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 6" dot={false} name="AI Tahmini" />
                    </ComposedChart>
                  ) : (
                    <AreaChart data={stats.aylikTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="satis" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="alis" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <i className="ri-arrow-left-down-line absolute -bottom-6 -right-6 text-9xl opacity-10"></i>
                <h3 className="text-sm font-semibold opacity-80 mb-1">Toplam Alacak</h3>
                <p className="text-3xl font-black mb-4">{stats.toplamAlacak.toLocaleString('tr-TR')} ₺</p>
                <div className="bg-white/10 rounded-2xl p-3 text-xs flex justify-between">
                  <span>Satış Faturaları:</span>
                  <span className="font-bold">{stats.toplamSatisFaturalari.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <i className="ri-arrow-right-up-line absolute -bottom-6 -right-6 text-9xl opacity-10"></i>
                <h3 className="text-sm font-semibold opacity-80 mb-1">Toplam Borç</h3>
                <p className="text-3xl font-black mb-4">{stats.toplamBorc.toLocaleString('tr-TR')} ₺</p>
                <div className="bg-white/10 rounded-2xl p-3 text-xs flex justify-between">
                  <span>Alış Faturaları:</span>
                  <span className="font-bold">{stats.toplamAlisFaturalari.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Son İşlemler</h2>
                <button onClick={() => navigate('/tum-islemler')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">TÜMÜNÜ GÖR</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px]">İşlem</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[10px]">Cari</th>
                      <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase text-[10px]">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.sonIslemler.map((islem, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${islem.bg} ${islem.renk} rounded-lg flex items-center justify-center`}><i className={islem.simge}></i></div>
                            <span className="font-semibold text-gray-700">{islem.tur}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 uppercase text-xs">{islem.cari_ad}</td>
                        <td className={`px-6 py-4 text-right font-bold ${islem.renk}`}>{islem.toplam.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-6">Karlılık Analizi</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Alacak', value: stats.toplamAlacak, color: '#0d9488' },
                        { name: 'Borç', value: stats.toplamBorc, color: '#e11d48' }
                      ]}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      <Cell fill="#0d9488" />
                      <Cell fill="#e11d48" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 text-[10px] font-bold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"></div> ALACAK</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> BORÇ</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-b-4 border-b-transparent hover:border-b-indigo-500 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center`}><i className={`${icon} text-xl`}></i></div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 bg-${color}-50 text-${color}-600 rounded-lg`}>{sub}</span>
      </div>
      <div className="text-xs text-gray-400 font-bold uppercase mb-1">{label}</div>
      <div className="text-2xl font-black text-gray-900">{value.toLocaleString('tr-TR')}</div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur shadow-2xl border border-gray-100 rounded-xl p-4">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">{payload[0].payload.name}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-xs font-bold text-gray-700">{entry.name}:</span>
            <span className="text-xs font-black text-gray-900">{entry.value.toLocaleString('tr-TR')} ₺</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
