import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

export default function CariDetay() {
  const { id } = useParams();
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

        // Tüm işlemleri çek
        const tumIslemler: any[] = [];

        // Satış faturaları filtrele
        if (satisFaturalari && Array.isArray(satisFaturalari)) {
          const cariSatislar = satisFaturalari.filter(f => f.cari_id === id);
          cariSatislar.forEach(fatura => {
            tumIslemler.push({
              id: fatura.id,
              tip: 'Satış Faturası',
              tarih: fatura.tarih,
              tutar: parseFloat(fatura.toplam.toString()),
              aciklama: `Fatura No: ${fatura.fatura_no}`,
              durum: fatura.durum,
              borc: parseFloat(fatura.toplam.toString()),
              alacak: 0
            });
          });
        }

        // Alış faturaları filtrele
        if (alisFaturalari && Array.isArray(alisFaturalari)) {
          const cariAlislar = alisFaturalari.filter(f => f.cari_id === id);
          cariAlislar.forEach(fatura => {
            tumIslemler.push({
              id: fatura.id,
              tip: 'Alış Faturası',
              tarih: fatura.tarih,
              tutar: parseFloat(fatura.toplam.toString()),
              aciklama: `Fatura No: ${fatura.fatura_no}`,
              durum: fatura.durum,
              borc: 0,
              alacak: parseFloat(fatura.toplam.toString())
            });
          });
        }

        // Ödemeler filtrele
        if (odemeler && Array.isArray(odemeler)) {
          const cariOdemeler = odemeler.filter(o => o.cari_id === id);
          cariOdemeler.forEach(odeme => {
            const isAlindi = odeme.tip === 'Tahsilat';
            tumIslemler.push({
              id: odeme.id,
              tip: isAlindi ? 'Ödeme Alındı' : 'Ödeme Yapıldı',
              tarih: odeme.tarih,
              tutar: parseFloat(odeme.tutar.toString()),
              aciklama: `${odeme.odeme_yontemi} - ${odeme.aciklama || ''}`,
              durum: 'Tamamlandı',
              borc: isAlindi ? 0 : parseFloat(odeme.tutar.toString()),
              alacak: isAlindi ? parseFloat(odeme.tutar.toString()) : 0
            });
          });
        }

        // Tarihe göre sırala
        tumIslemler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
        setIslemler(tumIslemler);
      }
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl text-indigo-500 animate-spin mb-4"></i>
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <ProfileSelector />
      </div>
    );
  }

  if (!cari) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-user-line text-6xl text-slate-300 mb-4"></i>
          <p className="text-slate-500 text-lg">Cari bulunamadı</p>
          <Link to="/cariler" className="mt-4 inline-block px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 cursor-pointer whitespace-nowrap">
            Cariler Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  const toplamBorc = islemler.reduce((sum, i) => sum + i.borc, 0);
  const toplamAlacak = islemler.reduce((sum, i) => sum + i.alacak, 0);
  const bakiye = toplamBorc - toplamAlacak;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img
                  src="https://public.readdy.ai/ai/img_res/599009ac-e967-4692-9000-451db39762de.png"
                  alt="Logo"
                  className="h-10 w-auto object-contain cursor-pointer"
                />
              </Link>
              <div className="h-8 w-px bg-slate-300"></div>
              <h1 className="text-xl font-bold text-slate-800">Cari Detay</h1>
            </div>
            <div className="flex items-center gap-3">
              <ProfileSelector />
              <Link to="/cariler" className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-arrow-left-line mr-2"></i>
                Geri Dön
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-dashboard-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Dashboard</span>
            </Link>
            <Link to="/cariler" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer">
              <i className="ri-user-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Cariler</span>
            </Link>
            <Link to="/satis-faturasi" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-file-text-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Satış Faturası</span>
            </Link>
            <Link to="/alis-faturasi" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-file-list-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Alış Faturası</span>
            </Link>
            <Link to="/odemeler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-money-dollar-circle-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ödemeler</span>
            </Link>
            <Link to="/raporlar" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-bar-chart-box-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Raporlar</span>
            </Link>
            <Link to="/stok" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-archive-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Stok Yönetimi</span>
            </Link>
            <Link to="/urunler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-product-hunt-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ürünler</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Cari Bilgileri */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{cari.ad}</h2>
                <div className="space-y-1 text-sm text-slate-600">
                  {cari.telefon && (
                    <p><i className="ri-phone-line mr-2"></i>{cari.telefon}</p>
                  )}
                  {cari.email && (
                    <p><i className="ri-mail-line mr-2"></i>{cari.email}</p>
                  )}
                  {cari.adres && (
                    <p><i className="ri-map-pin-line mr-2"></i>{cari.adres}</p>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${cari.tip === 'Müşteri' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                {cari.tip}
              </span>
            </div>

            {/* Finansal Özet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-600 mb-1">Toplam Borç</p>
                <p className="text-2xl font-bold text-red-700">₺{toplamBorc.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600 mb-1">Toplam Alacak</p>
                <p className="text-2xl font-bold text-green-700">₺{toplamAlacak.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-4 ${bakiye >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className={`text-sm font-medium mb-1 ${bakiye >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Bakiye
                </p>
                <p className={`text-2xl font-bold ${bakiye >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  ₺{Math.abs(bakiye).toLocaleString()}
                  <span className="text-sm ml-2">
                    {bakiye >= 0 ? '(Cari Borçlu)' : '(Cari Alacaklı)'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* İşlem Geçmişi */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">İşlem Geçmişi</h3>
                <p className="text-sm text-slate-600 mt-1">Toplam {islemler.length} işlem</p>
              </div>
            </div>

            {islemler.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-file-list-line text-6xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 text-lg mb-2">Henüz işlem kaydı yok</p>
                <p className="text-slate-400 text-sm">Bu cari için fatura veya ödeme ekleyerek başlayın</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">İşlem Tipi</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Açıklama</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Borç</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Alacak</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {islemler.map((islem) => (
                      <tr key={`${islem.tip}-${islem.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{islem.tarih}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${islem.tip === 'Satış Faturası' ? 'bg-green-100 text-green-700' :
                            islem.tip === 'Alış Faturası' ? 'bg-orange-100 text-orange-700' :
                              islem.tip === 'Ödeme Alındı' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                            }`}>
                            {islem.tip}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{islem.aciklama}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600 whitespace-nowrap">
                          {islem.borc > 0 ? `₺${islem.borc.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">
                          {islem.alacak > 0 ? `₺${islem.alacak.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${islem.durum === 'Onaylandı' || islem.durum === 'Tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
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
  );
}
