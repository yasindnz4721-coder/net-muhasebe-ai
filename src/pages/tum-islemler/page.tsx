import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function TumIslemler() {
  const { selectedProfile } = useProfile();
  const navigate = useNavigate();
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (selectedProfile) {
      loadData();
    }
  }, [selectedProfile]);

  const loadData = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      const tumIslemler: any[] = [];

      const [
        { data: satisFaturalari },
        { data: alisFaturalari },
        { data: odemeler }
      ] = await Promise.all([
        import('../../lib/api').then(m => m.satisFaturalari.getAll(selectedProfile.id)),
        import('../../lib/api').then(m => m.alisFaturalari.getAll(selectedProfile.id)),
        import('../../lib/api').then(m => m.odemeler.getAll(selectedProfile.id))
      ]);

      if (satisFaturalari && Array.isArray(satisFaturalari)) {
        satisFaturalari.forEach((fatura: any) => {
          tumIslemler.push({
            id: fatura.id,
            tip: 'Satış Faturası',
            cari_ad: fatura.cari_ad,
            tarih: fatura.tarih,
            tutar: fatura.toplam,
            aciklama: `Fatura No: ${fatura.fatura_no}`,
            durum: fatura.durum
          });
        });
      }

      if (alisFaturalari && Array.isArray(alisFaturalari)) {
        alisFaturalari.forEach((fatura: any) => {
          tumIslemler.push({
            id: fatura.id,
            tip: 'Alış Faturası',
            cari_ad: fatura.cari_ad,
            tarih: fatura.tarih,
            tutar: fatura.toplam,
            aciklama: `Fatura No: ${fatura.fatura_no}`,
            durum: fatura.durum
          });
        });
      }

      if (odemeler && Array.isArray(odemeler)) {
        odemeler.forEach((odeme: any) => {
          tumIslemler.push({
            id: odeme.id,
            tip: odeme.tip,
            cari_ad: odeme.cari_ad,
            tarih: odeme.tarih,
            tutar: odeme.tutar,
            aciklama: `${odeme.odeme_yontemi}${odeme.aciklama ? ' - ' + odeme.aciklama : ''}`,
            durum: 'Tamamlandı'
          });
        });
      }

      tumIslemler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
      setIslemler(tumIslemler);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIslemler = islemler.filter(islem => {
    const matchesSearch = islem.cari_ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      islem.aciklama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || islem.tip === filterType;
    return matchesSearch && matchesType;
  });

  const toplamTutar = filteredIslemler.reduce((sum, i) => sum + i.tutar, 0);

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md animate-slide-up">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <i className="ri-folder-history-line text-4xl text-indigo-500"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Seçimi Gerekli</h3>
          <p className="text-slate-400 font-medium mb-8">İşlem geçmişini görüntülemek için bir aktif profil seçmelisiniz.</p>
          <button onClick={() => navigate('/')} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600">DASHBOARD'A GİT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative text-xs">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[140px] animate-aurora-2"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[120px] animate-aurora-1"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar mbOpen={false} setMbOpen={() => { }} />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header onMenuClick={() => { }} />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <i className="ri-history-line"></i>
                  <span>TÜM FİNANSAL HAREKETLER</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  İşlem <span className="text-gradient from-indigo-400 to-purple-500 italic">Defteri.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Şirketinizin tüm fatura, ödeme ve tahsilat hareketlerini tek bir merkezden izleyin ve yönetin.</p>
              </div>

              <div className="flex gap-4">
                <div className="premium-card px-8 py-5 border-indigo-500/20 bg-indigo-500/5 flex items-center gap-6">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <i className="ri-exchange-funds-line text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">TOPLAM HACİM</div>
                    <div className="text-2xl font-black text-slate-200 tracking-tighter leading-none">₺{toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="premium-card p-4 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <i className="ri-search-line absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors text-lg"></i>
                <input
                  type="text"
                  placeholder="CARİ ADI VEYA AÇIKLAMA İLE ARA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-6 text-[10px] font-black uppercase tracking-widest focus:bg-white/[0.07] focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-64 h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest focus:border-indigo-500/50 outline-none appearance-none cursor-pointer"
              >
                <option value="all">TÜM İŞLEMLER</option>
                <option value="Satış Faturası">SATIŞ FATURALARI</option>
                <option value="Alış Faturası">ALIŞ FATURALARI</option>
                <option value="Alınan Ödeme">TAHSİLATLAR</option>
                <option value="Verilen Ödeme">ÖDEMELER</option>
              </select>
              <button onClick={loadData} className="w-full md:w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20">
                <i className="ri-refresh-line text-xl"></i>
              </button>
            </div>

            {/* Transactions Table */}
            <div className="premium-card overflow-hidden">
              {loading ? (
                <div className="p-24 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 font-black text-[10px] tracking-widest uppercase">İŞLEMLER YÜKLENİYOR...</p>
                </div>
              ) : filteredIslemler.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-slate-700">
                    <i className="ri-file-list-3-line text-5xl"></i>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">İşlem Bulunamadı</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-sm mx-auto">KRİTERLERİNİZE UYGUN HERHANGİ BİR KAYIT BULUNAMAMIŞTIR.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TARİH</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TÜR</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CARİ HESAP</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DETAYLAR</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TUTAR (TL)</th>
                        <th className="px-10 py-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DURUM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredIslemler.map((islem, index) => (
                        <tr key={`${islem.tip}-${islem.id}-${index}`} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-10 py-8 font-black text-slate-400 uppercase tracking-tighter italic">
                            {new Date(islem.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-10 py-8">
                            <span className={`inline-flex px-4 py-2 rounded-xl text-[8px] font-black tracking-[0.2em] uppercase border ${islem.tip === 'Satış Faturası' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                islem.tip === 'Alış Faturası' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                  islem.tip === 'Alınan Ödeme' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }`}>
                              {islem.tip}
                            </span>
                          </td>
                          <td className="px-10 py-8 font-black text-slate-200 uppercase tracking-tight italic">
                            {islem.cari_ad}
                          </td>
                          <td className="px-10 py-8 font-bold text-slate-400 uppercase tracking-tight text-[10px]">
                            {islem.aciklama}
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className={`text-xl font-black tracking-tighter ${islem.tip === 'Satış Faturası' || islem.tip === 'Alınan Ödeme' ? 'text-emerald-400' : 'text-rose-500'
                              }`}>
                              {islem.tip === 'Satış Faturası' || islem.tip === 'Alınan Ödeme' ? '+' : '-'}₺{islem.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                            <span className={`inline-block px-4 py-2 bg-white/5 text-slate-500 rounded-lg text-[8px] font-black tracking-widest uppercase border border-white/5 ${islem.durum === 'Tamamlandı' ? 'text-emerald-500 border-emerald-500/20' : ''
                              }`}>
                              {islem.durum}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
