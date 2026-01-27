import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

export default function CariDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProfile } = useProfile();
  const [cari, setCari] = useState<any>(null);
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && selectedProfile) {
      loadData();
    }
  }, [id, selectedProfile]);

  const loadData = async () => {
    if (!selectedProfile || !id) return;

    try {
      setLoading(true);

      const [
        { data: cariData },
        { data: satisFaturalari },
        { data: alisFaturalari },
        { data: odemeler }
      ] = await Promise.all([
        import('../../lib/api').then(m => m.cariler.getById(id)),
        import('../../lib/api').then(m => m.satisFaturalari.getAll(selectedProfile.id)),
        import('../../lib/api').then(m => m.alisFaturalari.getAll(selectedProfile.id)),
        import('../../lib/api').then(m => m.odemeler.getAll(selectedProfile.id))
      ]);

      if (cariData) {
        setCari(cariData);

        const tumIslemler: any[] = [];

        if (satisFaturalari && Array.isArray(satisFaturalari)) {
          const cariSatislar = satisFaturalari.filter(f => f.cari_id === id);
          cariSatislar.forEach(fatura => {
            const tutar = Number(fatura.toplam) || 0;
            tumIslemler.push({
              id: fatura.id,
              tip: 'Satış Faturası',
              tarih: fatura.tarih,
              tutar: tutar,
              aciklama: `Fatura No: ${fatura.fatura_no}`,
              durum: fatura.durum,
              borc: tutar,
              alacak: 0
            });
          });
        }

        if (alisFaturalari && Array.isArray(alisFaturalari)) {
          const cariAlislar = alisFaturalari.filter(f => f.cari_id === id);
          cariAlislar.forEach(fatura => {
            const tutar = Number(fatura.toplam) || 0;
            tumIslemler.push({
              id: fatura.id,
              tip: 'Alış Faturası',
              tarih: fatura.tarih,
              tutar: tutar,
              aciklama: `Fatura No: ${fatura.fatura_no}`,
              durum: fatura.durum,
              borc: 0,
              alacak: tutar
            });
          });
        }

        if (odemeler && Array.isArray(odemeler)) {
          const cariOdemeler = odemeler.filter(o => o.cari_id === id);
          cariOdemeler.forEach(odeme => {
            const tutar = Number(odeme.tutar) || 0;
            // Tahsilat veya Alınan Ödeme: Cari bize ödüyor (Bizim için Alacak/Tahsilat)
            // Ödeme Yapıldı veya Tediye: Biz cariye ödüyoruz (Bizim için Ödeme/Tediye)
            const isTahsilat = odeme.tip === 'Tahsilat' || odeme.tip === 'Ödeme Alındı' || odeme.tip === 'Alınan Ödeme';

            tumIslemler.push({
              id: odeme.id,
              tip: isTahsilat ? 'Tahsilat' : 'Ödeme',
              tarih: odeme.tarih,
              tutar: tutar,
              aciklama: `${odeme.odeme_yontemi} - ${odeme.aciklama || ''}`,
              durum: 'Tamamlandı',
              borc: isTahsilat ? 0 : tutar, // Biz ona ödediysek o borçlu gibi (veya borcumuz azaldı) - Standart cari mantığında: Ödeme Yapıldı (Borç), Tahsilat (Alacak)
              alacak: isTahsilat ? tutar : 0
            });
          });
        }

        tumIslemler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
        setIslemler(tumIslemler);
      }
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const toplamBorc = islemler.reduce((sum, i) => sum + i.borc, 0);
  const toplamAlacak = islemler.reduce((sum, i) => sum + i.alacak, 0);
  const bakiye = toplamBorc - toplamAlacak;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase">CARİ ANALİZİ YAPILIYOR...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfile || !cari) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md animate-slide-up">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <i className="ri-user-search-line text-4xl text-slate-500"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Cari Kaydı Bulunamadı</h3>
          <p className="text-slate-400 font-medium mb-8">İstenilen cari kaydına ulaşılamadı veya yetkiniz yok.</p>
          <button onClick={() => navigate('/cariler')} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600">LİSTEYE DÖN</button>
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
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/cariler')}
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 font-black text-[10px] uppercase tracking-widest transition-colors mb-2"
                >
                  <i className="ri-arrow-left-line text-lg"></i>
                  <span>PORTFÖYE GERİ DÖN</span>
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-black text-indigo-400">
                    {cari.ad.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                      {cari.ad.split(' ')[0]} <span className="text-gradient from-indigo-400 to-purple-500 italic">{cari.ad.split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <div className="flex flex-wrap gap-6 mt-3">
                      <span className="flex items-center gap-2 text-slate-400 font-bold"><i className="ri-phone-line text-indigo-500"></i> {cari.telefon || 'Telefon Yok'}</span>
                      <span className="flex items-center gap-2 text-slate-400 font-bold"><i className="ri-map-pin-line text-indigo-500"></i> {cari.vergi_dairesi || 'Vergi D. Belirtilmemiş'}</span>
                      <span className="flex items-center gap-2 text-slate-400 font-bold"><i className="ri-bank-card-line text-indigo-500"></i> {cari.vergi_no || 'V.No Yok'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="premium-button px-8 h-16 text-[10px] uppercase tracking-widest bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white group">
                  <i className="ri-add-line text-xl group-hover:rotate-90 transition-transform"></i>
                  <span>İŞLEM KAYDET</span>
                </button>
                <button
                  onClick={() => navigate(`/cariler/duzenle/${id}`)}
                  className="premium-button px-8 h-16 text-[10px] uppercase tracking-widest"
                >
                  <i className="ri-edit-line text-xl text-indigo-400"></i>
                  <span>CARİ DÜZENLE</span>
                </button>
              </div>
            </div>

            {/* Financial Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-10 relative overflow-hidden group border-emerald-500/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <i className="ri-arrow-left-down-line text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">TOPLAM ALACAK</span>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black tracking-tighter">₺{toplamAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Cari Hesaba Yapılan Ödemeler</p>
                </div>
              </div>

              <div className="premium-card p-10 relative overflow-hidden group border-rose-500/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <i className="ri-arrow-right-up-line text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">TOPLAM BORÇ</span>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black tracking-tighter">₺{toplamBorc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">Verilen Hizmet / Mal Karşılığı</p>
                </div>
              </div>

              <div className={`premium-card p-10 relative overflow-hidden group ${bakiye >= 0 ? 'border-indigo-500 bg-indigo-500/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${bakiye >= 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                    }`}>
                    <i className="ri-scales-fill text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">NET BAKİYE DENGESİ</span>
                </div>
                <div className="space-y-1">
                  <div className={`text-5xl font-black tracking-tighter ${bakiye >= 0 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                    ₺{Math.abs(bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest mt-2 border ${bakiye >= 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                    {bakiye >= 0 ? 'CARİ BORÇLU' : 'CARİ ALACAKLI'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400">
                    <i className="ri-history-line text-2xl"></i>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">İşlem Geçmişi</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KRONOLOJİK FİNANSAL HAREKETLER</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-5 py-2 bg-indigo-500/5 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/5">
                    {islemler.length} KAYIT BULUNDU
                  </div>
                </div>
              </div>

              {islemler.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-slate-700">
                    <i className="ri-file-list-3-line text-5xl"></i>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">İşlem Kaydı Yok</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-sm mx-auto italic">BU CARİ HESABA AİT HENÜZ HİÇBİR FATURA VEYA ÖDEME KAYDI BULUNMAMAKTADIR.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İŞLEM TARİHİ</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">HESAP HAREKETİ</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AÇIKLAMA / BELGE NO</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TUTAR (TL)</th>
                        <th className="px-10 py-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DURUM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {islemler.map((islem, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-10 py-8 font-black text-slate-400 uppercase tracking-tighter italic">
                            {new Date(islem.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-10 py-8">
                            <div className={`inline-flex px-4 py-2 rounded-xl text-[8px] font-black tracking-[0.2em] uppercase border ${islem.tip === 'Satış Faturası' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              islem.tip === 'Alış Faturası' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                islem.tip === 'Tahsilat' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }`}>
                              {islem.tip}
                            </div>
                          </td>
                          <td className="px-10 py-8 font-bold text-slate-300 uppercase tracking-tight">
                            {islem.aciklama}
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className={`text-xl font-black tracking-tighter ${islem.borc > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                              {islem.borc > 0 ? `- ₺${islem.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : `+ ₺${islem.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                            <span className="inline-block px-4 py-2 bg-white/5 text-slate-500 rounded-lg text-[8px] font-black tracking-widest uppercase border border-white/5">
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
